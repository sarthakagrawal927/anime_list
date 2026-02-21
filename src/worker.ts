/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";

// Business logic imports (all unchanged files)
import { filterAnimeList } from "./filterEngine";
import {
  getAnimeWatchlist,
  upsertAnimeWatchlist,
  deleteFromAnimeWatchlist,
  initWatchlistTables,
} from "./db/watchlist";
import { getAnimeStats } from "./statistics";
import { getScoreSortedList } from "./utils/statistics";
import { animeStore } from "./store/animeStore";
import { getLastDataUpdate, getRecentChanges } from "./db/animeData";
import { findOrCreateUser } from "./db/users";
import { initUsersTable } from "./db/users";
import {
  hideWatchedItems,
  includeOnlyWatchedItems,
  takePage,
} from "./controllers/helpers";
import { filterRequestSchema } from "./validators/animeFilters";
import { watchedListSchema } from "./validators/watchedList";
import {
  NUMERIC_FIELDS,
  ARRAY_FIELDS,
  STRING_FIELDS,
  COMPARISON_ACTIONS,
  ARRAY_ACTIONS,
} from "./types/anime";
import { WatchStatus } from "./config";
import { runAllMigrations } from "./db/migrations";

// ── Types ──────────────────────────────────────────────────────────────

interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

type Env = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
};

// ── JWT helpers (using jose instead of jsonwebtoken) ───────────────────

const getJwtSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "mal-explorer-dev-secret-change-in-prod"
  );

async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

// ── Google OAuth (using jose JWKS instead of google-auth-library) ──────

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

// ── Hono app ───────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env; Variables: { user?: AuthPayload } }>();

// Bridge env bindings → process.env so existing code (db/client, config) works unchanged
app.use("*", async (c, next) => {
  process.env.TURSO_DATABASE_URL = c.env.TURSO_DATABASE_URL;
  process.env.TURSO_AUTH_TOKEN = c.env.TURSO_AUTH_TOKEN;
  process.env.JWT_SECRET = c.env.JWT_SECRET;
  process.env.GOOGLE_CLIENT_ID = c.env.GOOGLE_CLIENT_ID;
  await next();
});

// DB init (runs once per isolate)
let dbInitialized = false;
app.use("*", async (_c, next) => {
  if (!dbInitialized) {
    await initUsersTable();
    await initWatchlistTables();
    await runAllMigrations();
    dbInitialized = true;
  }
  await next();
});

// CORS
app.use(
  "*",
  cors({
    origin: [
      "https://anime-explorer-mal.vercel.app",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Auth middleware ─────────────────────────────────────────────────────

const optionalAuth = async (
  c: { req: { header: (name: string) => string | undefined }; set: (key: string, value: unknown) => void },
  next: () => Promise<void>
) => {
  const token = extractBearerToken(c.req.header("Authorization"));
  if (token) {
    const user = await verifyToken(token);
    if (user) c.set("user", user);
  }
  await next();
};

const requireAuth = async (
  c: { req: { header: (name: string) => string | undefined }; set: (key: string, value: unknown) => void; json: (data: unknown, status?: number) => Response },
  next: () => Promise<void>
) => {
  const token = extractBearerToken(c.req.header("Authorization"));
  if (!token) return c.json({ error: "Authentication required" }, 401);
  const user = await verifyToken(token);
  if (!user) return c.json({ error: "Invalid or expired token" }, 401);
  c.set("user", user);
  await next();
};

// ── Routes ─────────────────────────────────────────────────────────────

// Auth
app.post("/api/auth/google", async (c) => {
  const { credential } = await c.req.json();
  if (!credential || typeof credential !== "string") {
    return c.json({ error: "Missing Google credential token" }, 400);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) return c.json({ error: "Google OAuth not configured" }, 500);

  try {
    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
      audience: clientId,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    });

    if (!payload.sub || !payload.email) {
      return c.json({ error: "Invalid Google token" }, 400);
    }

    const user = await findOrCreateUser({
      googleId: payload.sub,
      email: payload.email as string,
      name: (payload.name as string) || (payload.email as string),
      picture: payload.picture as string | undefined,
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Google OAuth error:", err);
    return c.json({ error: "Invalid Google token" }, 400);
  }
});

// Static data
app.get("/api/fields", (c) =>
  c.json({
    numeric: NUMERIC_FIELDS,
    array: ARRAY_FIELDS,
    string: STRING_FIELDS,
  })
);

app.get("/api/filters", (c) =>
  c.json({ comparison: COMPARISON_ACTIONS, array: ARRAY_ACTIONS })
);

app.get("/api/last-updated", async (c) => {
  const lastUpdated = await getLastDataUpdate();
  return c.json({ lastUpdated });
});

app.get("/api/changelog", async (c) => {
  const limit = Math.min(Number(c.req.query("limit")) || 200, 500);
  const changes = await getRecentChanges(limit);
  return c.json({ changes });
});

// Search
app.post("/api/search", optionalAuth, async (c) => {
  const body = await c.req.json();
  const parsed = filterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid search payload",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".")}: ${i.message}`
        ),
      },
      400
    );
  }

  const { filters, sortBy, airing, hideWatched, pagesize, offset } =
    parsed.data;
  const user = c.get("user");

  let filtered = await filterAnimeList(filters);

  // Airing filter
  if (airing !== "any") {
    filtered = filtered.filter((anime) => {
      const isAiring = anime.status?.toLowerCase() === "currently airing";
      return airing === "yes" ? isAiring : !isAiring;
    });
  }

  // Hide watched
  if (user?.userId) {
    filtered = await hideWatchedItems(
      filtered,
      hideWatched,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  }

  const sorted = getScoreSortedList(filtered, filters, sortBy);

  return c.json({
    totalFiltered: filtered.length,
    filteredList: takePage(sorted, pagesize, offset).map((anime) => ({
      id: anime.mal_id,
      score: anime.score,
      points: anime.points,
      name: anime.title,
      title_english: anime.title_english,
      link: anime.url,
      synopsis: anime.synopsis,
      members: anime.members,
      favorites: anime.favorites,
      year: anime.year,
      status: anime.status,
      genres: Object.keys(anime.genres),
      themes: Object.keys(anime.themes),
      type: anime.type,
      image: anime.image,
    })),
  });
});

// Stats
app.get("/api/stats", optionalAuth, async (c) => {
  const user = c.get("user");
  const hideWatched = (c.req.query("hideWatched") || "")
    .split(",")
    .filter(Boolean);

  let animeList = await animeStore.getAnimeList();

  if (user?.userId && hideWatched.length > 0) {
    const allStatuses: WatchStatus[] = [
      WatchStatus.Watching,
      WatchStatus.Completed,
      WatchStatus.Deferred,
      WatchStatus.Avoiding,
      WatchStatus.BadRatingRatio,
    ];
    const includeStatuses = allStatuses.filter(
      (s) => !hideWatched.includes(s)
    );

    animeList = await includeOnlyWatchedItems(
      animeList,
      includeStatuses,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  }

  return c.json(await getAnimeStats(animeList));
});

// Watchlist
app.get("/api/watchlist", requireAuth, async (c) => {
  const user = c.get("user")!;
  const watchlist = await getAnimeWatchlist(user.userId);
  const status = c.req.query("status") as WatchStatus;

  if (!watchlist) return c.json({ error: "Watchlist not found" }, 404);

  if (status) {
    const filteredAnime = Object.values(watchlist.anime).filter(
      (item) => item.status === status
    );
    return c.json(filteredAnime);
  }

  return c.json(watchlist);
});

app.get("/api/watchlist/enriched", requireAuth, async (c) => {
  const user = c.get("user")!;
  const watchlist = await getAnimeWatchlist(user.userId);

  if (!watchlist) return c.json({ items: [] });

  const allAnime = await animeStore.getAnimeList();
  const animeMap = new Map(allAnime.map((a) => [a.mal_id.toString(), a]));

  const items = Object.values(watchlist.anime).map((entry) => {
    const anime = animeMap.get(entry.id);
    return {
      mal_id: entry.id,
      watchStatus: entry.status,
      title: anime?.title || entry.title || `ID: ${entry.id}`,
      image: anime?.image,
      score: anime?.score,
      year: anime?.year,
      type: anime?.type,
      episodes: anime?.episodes,
      members: anime?.members,
      genres: anime ? Object.keys(anime.genres) : [],
      synopsis: anime?.synopsis,
      url: anime?.url,
    };
  });

  return c.json({ items });
});

app.post("/api/watched/add", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchedListSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid watchlist payload", details: parsed.error.issues },
      400
    );
  }

  const user = c.get("user")!;
  await upsertAnimeWatchlist(parsed.data.mal_ids, parsed.data.status, user.userId);
  return c.json({ success: true, message: "Anime added to watched list" });
});

app.post("/api/watched/remove", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchedListSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid watchlist payload", details: parsed.error.issues },
      400
    );
  }

  const user = c.get("user")!;
  await deleteFromAnimeWatchlist(parsed.data.mal_ids, user.userId);
  return c.json({ success: true, message: "Anime removed from watchlist" });
});

// ── Export ──────────────────────────────────────────────────────────────

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    app.fetch(request, env, ctx),
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ) {
    // Bridge env for the cron context
    process.env.TURSO_DATABASE_URL = env.TURSO_DATABASE_URL;
    process.env.TURSO_AUTH_TOKEN = env.TURSO_AUTH_TOKEN;
    console.log("Cron: refreshing anime cache from Turso");
    await animeStore.setAnimeList();
    console.log("Cron: cache refreshed");
  },
};
