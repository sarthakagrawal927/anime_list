/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { configurePostHog, trace, flushPostHog } from "@saas-maker/ops";

// Business logic imports (all unchanged files)
import { filterAnimeList } from "./filterEngine";
import {
  deleteUserTag,
  getAnimeWatchlist,
  getAnimeWatchlistEntry,
  upsertAnimeWatchlist,
  updateAnimeWatchlistNote,
  deleteFromAnimeWatchlist,
  initWatchlistTables,
  getUserTags,
  updateUserTag,
  upsertUserTag,
} from "./db/watchlist";
import { getAnimeStats } from "./statistics";
import { getScoreSortedList } from "./utils/statistics";
import { animeStore } from "./store/animeStore";
import {
  getAnimeByMalId,
  getLastDataUpdate,
  getRecentChanges,
} from "./db/animeData";
import { findOrCreateUser } from "./db/users";
import { initUsersTable } from "./db/users";
import {
  hideWatchedItems,
  includeOnlyWatchedItems,
  parseTagQuery,
  takePage,
} from "./controllers/helpers";
import { filterRequestSchema } from "./validators/animeFilters";
import {
  watchedListRemoveSchema,
  watchedListSchema,
} from "./validators/watchedList";
import {
  watchlistTagDeleteSchema,
  watchlistTagSchema,
  watchlistTagUpdateSchema,
} from "./validators/watchlistTags";
import {
  addToScheduleSchema,
  updateScheduleItemSchema,
  removeFromScheduleSchema,
  reorderScheduleSchema,
} from "./validators/schedule";
import {
  getSchedule,
  initScheduleTable,
  upsertScheduleItems,
  updateScheduleItem as dbUpdateScheduleItem,
  removeScheduleItems,
  reorderSchedule as dbReorderSchedule,
} from "./db/schedule";
import {
  migrateAnimeDetailCache,
  migrateAnimeWatchlistNotes,
  migrateScheduleEpisodesWatched,
} from "./db/migrations";
import { getAnimeDetailSupplementalData } from "./controllers/animeDetailService";
import {
  computeTimeline,
} from "./controllers/scheduleController";
import {
  NUMERIC_FIELDS,
  ARRAY_FIELDS,
  STRING_FIELDS,
  COMPARISON_ACTIONS,
  ARRAY_ACTIONS,
} from "./types/anime";
import type { AnimeDetailResponse } from "./types/animeDetail";
import {
  animeDetailNoteSchema,
  animeMalIdParamsSchema,
} from "./validators/animeDetail";

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
  POSTHOG_API_KEY?: string;
};

const SEARCH_CACHE_TTL_SECONDS = 180;

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

// ── Cookie helpers (XSS hardening: token lives in httpOnly cookie) ─────

const AUTH_COOKIE_NAME = "mal_auth_token";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, matches signToken TTL

function buildAuthCookie(token: string): string {
  // Cross-site (Workers ↔ Vercel/Pages frontends) requires SameSite=None+Secure
  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE}`;
}

function buildAuthClearCookie(): string {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}

function readAuthCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)mal_auth_token=([^;]+)/);
  return match?.[1] ?? null;
}

function extractToken(c: {
  req: { header: (name: string) => string | undefined };
}): string | null {
  return (
    extractBearerToken(c.req.header("Authorization")) ||
    readAuthCookie(c.req.header("Cookie"))
  );
}

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const buildSearchCacheRequest = async (
  origin: string,
  payload: {
    filters: unknown;
    sortBy: string | undefined;
    airing: "yes" | "no" | "any";
    pagesize: number;
    offset: number;
  }
): Promise<Request> => {
  const normalizedPayload = {
    filters: payload.filters,
    sortBy: payload.sortBy ?? null,
    airing: payload.airing,
    pagesize: payload.pagesize,
    offset: payload.offset,
  };
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(normalizedPayload))
  );
  const key = toHex(digest);
  const cacheUrl = new URL("https://mal-cache.local/api/search");
  cacheUrl.searchParams.set("v", "1");
  cacheUrl.searchParams.set("k", key);
  cacheUrl.searchParams.set("o", origin || "none");
  return new Request(cacheUrl.toString(), { method: "GET" });
};

// ── Google OAuth (using jose JWKS instead of google-auth-library) ──────

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

// ── Hono app ───────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env; Variables: { user?: AuthPayload } }>();

const toDetailAnime = (
  anime: NonNullable<Awaited<ReturnType<typeof getAnimeByMalId>>>,
) => ({
  mal_id: anime.mal_id,
  url: anime.url,
  title: anime.title,
  title_english: anime.title_english,
  type: anime.type,
  episodes: anime.episodes,
  score: anime.score,
  scored_by: anime.scored_by,
  rank: anime.rank,
  status: anime.status,
  popularity: anime.popularity,
  members: anime.members,
  favorites: anime.favorites,
  synopsis: anime.synopsis,
  year: anime.year,
  season: anime.season,
  image: anime.image,
  genres: Object.keys(anime.genres ?? {}),
  themes: Object.keys(anime.themes ?? {}),
  demographics: Object.keys(anime.demographics ?? {}),
});

// Bridge env bindings → process.env so existing code (db/client, config) works unchanged
app.use("*", async (c, next) => {
  process.env.TURSO_DATABASE_URL = c.env.TURSO_DATABASE_URL;
  process.env.TURSO_AUTH_TOKEN = c.env.TURSO_AUTH_TOKEN;
  process.env.JWT_SECRET = c.env.JWT_SECRET;
  process.env.GOOGLE_CLIENT_ID = c.env.GOOGLE_CLIENT_ID;
  await next();
});

// PostHog tracing middleware
let phConfigured = false;
app.use("*", async (c, next) => {
  if (!phConfigured && c.env.POSTHOG_API_KEY) {
    configurePostHog(c.env.POSTHOG_API_KEY, "https://us.i.posthog.com");
    phConfigured = true;
  }
  await next();
  if (c.env.POSTHOG_API_KEY) c.executionCtx.waitUntil(flushPostHog());
});

// DB init (runs once per isolate)
let dbInitialized = false;
app.use("*", async (_c, next) => {
  if (!dbInitialized) {
    await initUsersTable();
    await initWatchlistTables();
    await initScheduleTable();
    await migrateScheduleEpisodesWatched();
    await migrateAnimeWatchlistNotes();
    await migrateAnimeDetailCache();
    dbInitialized = true;
  }
  await next();
});

// CORS
app.use(
  "*",
  cors({
    origin: [
      "https://anime-list-web.sarthakagrawal927.workers.dev",
      "https://anime-list-9lk.pages.dev",
      "https://anime-explorer-mal.vercel.app",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
    // Required for the browser to attach the httpOnly cookie cross-origin.
    credentials: true,
  })
);

// ── Auth middleware ─────────────────────────────────────────────────────

const optionalAuth = async (
  c: { req: { header: (name: string) => string | undefined }; set: (key: string, value: unknown) => void },
  next: () => Promise<void>
) => {
  const token = extractToken(c);
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
  const token = extractToken(c);
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

    // Set token in httpOnly cookie (XSS hardening). The token is also returned
    // in the body for backward compatibility during migration; the frontend
    // no longer needs to persist it.
    c.header("Set-Cookie", buildAuthCookie(token), { append: true });

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

// Logout: clear the auth cookie
app.post("/api/auth/logout", (c) => {
  c.header("Set-Cookie", buildAuthClearCookie(), { append: true });
  return c.json({ ok: true });
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
  const edgeCache = (caches as unknown as { default: Cache }).default;
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

  const { filters, sortBy, airing, hideWatched, includeWatched, pagesize, offset } =
    parsed.data;
  const user = c.get("user");
  const canUseCache = hideWatched.length === 0 && includeWatched.length === 0;
  let cacheRequest: Request | null = null;

  if (canUseCache) {
    cacheRequest = await buildSearchCacheRequest(
      c.req.header("origin") || "none",
      { filters, sortBy, airing, pagesize, offset }
    );
    const cachedResponse = await edgeCache.match(cacheRequest);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("X-Search-Cache", "HIT");
      return response;
    }
  }

  let filtered = await trace("db:search", () => filterAnimeList(filters), { project: "mal-api" });

  // Airing filter
  if (airing !== "any") {
    filtered = filtered.filter((anime) => {
      const isAiring = anime.status?.toLowerCase() === "currently airing";
      return airing === "yes" ? isAiring : !isAiring;
    });
  }

  // Watchlist filter
  if (user?.userId && includeWatched.length > 0) {
    filtered = await includeOnlyWatchedItems(
      filtered,
      includeWatched,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  } else if (user?.userId) {
    filtered = await hideWatchedItems(
      filtered,
      hideWatched,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  }

  const sorted = getScoreSortedList(filtered, filters, sortBy);

  const response = c.json({
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

  if (!canUseCache || !cacheRequest) {
    response.headers.set("X-Search-Cache", "BYPASS");
    return response;
  }

  response.headers.set("X-Search-Cache", "MISS");
  const cacheableResponse = new Response(response.body, response);
  cacheableResponse.headers.set(
    "Cache-Control",
    `public, max-age=0, s-maxage=${SEARCH_CACHE_TTL_SECONDS}`
  );
  c.executionCtx.waitUntil(edgeCache.put(cacheRequest, cacheableResponse.clone()));
  return cacheableResponse;
});

// Stats
app.get("/api/stats", optionalAuth, async (c) => {
  const user = c.get("user");
  const includeWatched = parseTagQuery(c.req.query("includeWatched"));
  const hideWatched = parseTagQuery(c.req.query("hideWatched"));

  let animeList = await animeStore.getAnimeList();

  if (user?.userId && includeWatched.length > 0) {
    animeList = await includeOnlyWatchedItems(
      animeList,
      includeWatched,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  } else if (user?.userId && hideWatched.length > 0) {
    const watchlist = await getAnimeWatchlist(user.userId);
    const includeWatchedFromHide = watchlist
      ? Array.from(
          new Set(
            Object.values(watchlist.anime)
              .map((item) => item.status)
              .filter((status) => !hideWatched.includes(status))
          )
        )
      : [];

    animeList = await includeOnlyWatchedItems(
      animeList,
      includeWatchedFromHide,
      () => getAnimeWatchlist(user.userId),
      (list) => list.anime
    );
  }

  return c.json(await getAnimeStats(animeList));
});

app.get("/api/anime/:malId", optionalAuth, async (c) => {
  const parsed = animeMalIdParamsSchema.safeParse({
    malId: c.req.param("malId"),
  });
  if (!parsed.success) {
    return c.json({ error: "Invalid anime id", details: parsed.error.issues }, 400);
  }

  const malId = parsed.data.malId;
  const anime = await getAnimeByMalId(malId);

  if (!anime) {
    return c.json({ error: "Anime not found" }, 404);
  }

  const user = c.get("user");
  const [supplemental, watchlistEntry, animeList] = await Promise.all([
    getAnimeDetailSupplementalData(malId),
    user
      ? getAnimeWatchlistEntry(String(malId), user.userId)
      : Promise.resolve(null),
    animeStore.getAnimeList(),
  ]);
  const animeMap = new Map(animeList.map((item) => [item.mal_id, item] as const));

  const response: AnimeDetailResponse = {
    anime: toDetailAnime(anime),
    relations: supplemental.relations.flatMap((group) =>
      group.entries.map((entry) => {
        const relatedAnime = animeMap.get(entry.mal_id);
        return {
          mal_id: entry.mal_id,
          relation: group.relation,
          title: relatedAnime?.title || entry.name,
          title_english: relatedAnime?.title_english,
          image: relatedAnime?.image,
          type: relatedAnime?.type || entry.type,
          status: relatedAnime?.status,
          episodes: relatedAnime?.episodes,
          year: relatedAnime?.year,
          url: relatedAnime?.url || entry.url,
        };
      }),
    ),
    recommendations: supplemental.recommendations.map((recommendation) => {
      const recommendedAnime = animeMap.get(recommendation.entry.mal_id);
      return {
        mal_id: recommendation.entry.mal_id,
        title: recommendedAnime?.title || recommendation.entry.title,
        title_english: recommendedAnime?.title_english,
        image: recommendedAnime?.image || recommendation.entry.image,
        type: recommendedAnime?.type,
        status: recommendedAnime?.status,
        episodes: recommendedAnime?.episodes,
        year: recommendedAnime?.year,
        url: recommendedAnime?.url || recommendation.entry.url,
        votes: recommendation.votes ?? 0,
      };
    }),
    watchlistEntry: watchlistEntry
      ? {
          status: watchlistEntry.status,
          note: watchlistEntry.note || null,
        }
      : null,
  };

  return c.json(response);
});

app.post("/api/anime/:malId/note", requireAuth, async (c) => {
  const parsedParams = animeMalIdParamsSchema.safeParse({
    malId: c.req.param("malId"),
  });
  if (!parsedParams.success) {
    return c.json(
      { error: "Invalid anime id", details: parsedParams.error.issues },
      400,
    );
  }

  const body = await c.req.json();
  const parsedBody = animeDetailNoteSchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json(
      { error: "Invalid anime note payload", details: parsedBody.error.issues },
      400,
    );
  }

  const user = c.get("user")!;
  const normalizedNote = parsedBody.data.note.trim();
  const updated = await updateAnimeWatchlistNote(
    String(parsedParams.data.malId),
    normalizedNote.length > 0 ? normalizedNote : null,
    user.userId,
  );

  if (!updated) {
    return c.json({ error: "Anime is not in the watchlist" }, 404);
  }

  return c.json({ success: true, message: "Watchlist note updated" });
});

// Watchlist
app.get("/api/watchlist", requireAuth, async (c) => {
  const user = c.get("user")!;
  const watchlist = await getAnimeWatchlist(user.userId);
  const status = (c.req.query("status") || "").trim();

  if (!watchlist) return c.json({ error: "Watchlist not found" }, 404);

  if (status) {
    const filteredAnime = Object.values(watchlist.anime).filter(
      (item) => item.status === status
    );
    return c.json(filteredAnime);
  }

  return c.json(watchlist);
});

app.get("/api/watchlist/tags", requireAuth, async (c) => {
  const user = c.get("user")!;
  const tags = await getUserTags(user.userId);
  return c.json({ tags });
});

app.post("/api/watchlist/tags", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchlistTagSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid watchlist tag payload", details: parsed.error.issues },
      400
    );
  }

  const user = c.get("user")!;
  await upsertUserTag(parsed.data.tag, user.userId, parsed.data.color);
  return c.json({ success: true, message: "Tag saved" });
});

app.post("/api/watchlist/tags/:tagId/update", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchlistTagUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid watchlist tag update payload", details: parsed.error.issues },
      400
    );
  }

  const user = c.get("user")!;
  await updateUserTag(c.req.param("tagId"), user.userId, {
    tag: parsed.data.tag,
    color: parsed.data.color,
  });
  return c.json({ success: true, message: "Tag updated" });
});

app.post("/api/watchlist/tags/:tagId/delete", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchlistTagDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Invalid watchlist tag delete payload", details: parsed.error.issues },
      400
    );
  }

  const user = c.get("user")!;
  await deleteUserTag(c.req.param("tagId"), user.userId, parsed.data.moveToTagId);
  return c.json({ success: true, message: "Tag deleted" });
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
      note: entry.note,
      title: anime?.title_english || anime?.title || entry.title || `ID: ${entry.id}`,
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
  await upsertAnimeWatchlist(
    parsed.data.mal_ids,
    parsed.data.status,
    user.userId,
    parsed.data.tagColor
  );
  return c.json({ success: true, message: "Anime added to watched list" });
});

app.post("/api/watched/remove", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = watchedListRemoveSchema.safeParse(body);
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

// Schedule
app.get("/api/schedule/timeline", requireAuth, async (c) => {
  const user = c.get("user")!;
  const [scheduleRows, watchlist] = await Promise.all([
    getSchedule(user.userId),
    getAnimeWatchlist(user.userId),
  ]);
  const allAnime = await animeStore.getAnimeList();
  const animeMap = new Map(allAnime.map((a) => [a.mal_id.toString(), a]));

  const items = scheduleRows.map((row) => {
    const anime = animeMap.get(row.mal_id);
    const watched = watchlist?.anime[row.mal_id];
    return {
      mal_id: row.mal_id,
      episodes_per_day: row.episodes_per_day,
      sort_order: row.sort_order,
      episodes_watched: row.episodes_watched,
      title: anime?.title_english || anime?.title || (watched?.title as string | undefined) || `ID: ${row.mal_id}`,
      image: anime?.image,
      episodes: anime?.episodes,
      type: anime?.type,
      score: anime?.score,
      url: anime?.url,
      watchStatus: watched?.status || "",
    };
  });

  const { timeline, stats } = computeTimeline(items);
  return c.json({ items, timeline, stats });
});

app.post("/api/schedule/add", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = addToScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid schedule payload", details: parsed.error.issues }, 400);
  }
  const user = c.get("user")!;
  await upsertScheduleItems(
    user.userId,
    parsed.data.mal_ids.map((id) => ({ malId: id, episodesPerDay: parsed.data.episodes_per_day })),
  );
  return c.json({ success: true, message: "Added to schedule" });
});

app.post("/api/schedule/:malId/update", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = updateScheduleItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid schedule update payload", details: parsed.error.issues }, 400);
  }
  const user = c.get("user")!;
  await dbUpdateScheduleItem(user.userId, c.req.param("malId"), {
    episodesPerDay: parsed.data.episodes_per_day,
    episodesWatched: parsed.data.episodes_watched,
  });
  return c.json({ success: true, message: "Schedule item updated" });
});

app.post("/api/schedule/remove", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = removeFromScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid schedule payload", details: parsed.error.issues }, 400);
  }
  const user = c.get("user")!;
  await removeScheduleItems(user.userId, parsed.data.mal_ids);
  return c.json({ success: true, message: "Removed from schedule" });
});

app.post("/api/schedule/reorder", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = reorderScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid schedule reorder payload", details: parsed.error.issues }, 400);
  }
  const user = c.get("user")!;
  await dbReorderSchedule(user.userId, parsed.data.mal_ids);
  return c.json({ success: true, message: "Schedule reordered" });
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
