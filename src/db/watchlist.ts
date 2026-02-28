import { getDb } from "./client";
import type {
  MangaWatchlistData,
  WatchedAnime,
  WatchedManga,
  WatchTag,
  WatchlistData,
  WatchlistTag,
} from "../types/watchlist";

export const DEFAULT_USER_TAGS = [
  { tag: "Watching", color: "#10b981" },
  { tag: "Done", color: "#3b82f6" },
] as const;

const DEFAULT_TAG_COLOR_MAP: Map<string, string> = new Map(
  DEFAULT_USER_TAGS.map(({ tag, color }) => [tag, color]),
);

const TAG_COLOR_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
] as const;

const tagColorPattern = /^#[0-9A-Fa-f]{6}$/;

const normalizeTag = (tag: string): WatchTag => tag.trim();

const normalizeTagColor = (color?: string): string | null => {
  if (!color) return null;
  const trimmed = color.trim();
  if (!tagColorPattern.test(trimmed)) return null;
  return trimmed.toLowerCase();
};

const defaultTagColor = (tag: string): string => {
  const mapped = DEFAULT_TAG_COLOR_MAP.get(tag);
  if (mapped) return mapped;

  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_COLOR_PALETTE[hash % TAG_COLOR_PALETTE.length];
};

async function syncUserTagsFromWatchlists(userId: string): Promise<void> {
  const db = getDb();
  const result = await db.execute({
    sql: `
      SELECT DISTINCT status FROM anime_watchlist WHERE user_id = ?
      UNION
      SELECT DISTINCT status FROM manga_watchlist WHERE user_id = ?
    `,
    args: [userId, userId],
  });

  const statements = result.rows
    .map((row) => normalizeTag((row.status as string) || ""))
    .filter(Boolean)
    .map((tag) => ({
      sql: "INSERT OR IGNORE INTO user_tags (user_id, tag, color) VALUES (?, ?, ?)",
      args: [userId, tag, defaultTagColor(tag)],
    }));

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function initWatchlistTables(): Promise<void> {
  const db = getDb();
  await db.batch([
    `CREATE TABLE IF NOT EXISTS anime_watchlist (
      user_id TEXT NOT NULL DEFAULT 'default',
      mal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT,
      type TEXT,
      episodes INTEGER,
      PRIMARY KEY (user_id, mal_id)
    )`,
    `CREATE TABLE IF NOT EXISTS manga_watchlist (
      user_id TEXT NOT NULL DEFAULT 'default',
      mal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (user_id, mal_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_tags (
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL COLLATE NOCASE,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, tag)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id)",
  ]);
}

export async function seedDefaultUserTags(userId: string): Promise<void> {
  const db = getDb();
  const statements = DEFAULT_USER_TAGS.map(({ tag, color }) => ({
    sql: "INSERT OR IGNORE INTO user_tags (user_id, tag, color) VALUES (?, ?, ?)",
    args: [userId, tag, color],
  }));

  if (statements.length > 0) {
    await db.batch(statements);
  }
}

export async function getUserTags(userId: string = "default"): Promise<WatchlistTag[]> {
  const db = getDb();
  await syncUserTagsFromWatchlists(userId);

  const result = await db.execute({
    sql: `
      SELECT
        ut.tag,
        ut.color,
        COALESCE(COUNT(aw.mal_id), 0) AS count
      FROM user_tags ut
      LEFT JOIN anime_watchlist aw
        ON aw.user_id = ut.user_id
        AND aw.status = ut.tag
      WHERE ut.user_id = ?
      GROUP BY ut.tag, ut.color
      ORDER BY count DESC, ut.tag COLLATE NOCASE ASC
    `,
    args: [userId],
  });

  return result.rows.map((row) => {
    const tag = row.tag as string;
    return {
      tag,
      count: Number(row.count || 0),
      color: normalizeTagColor((row.color as string | null) || undefined) || defaultTagColor(tag),
    };
  });
}

export async function upsertUserTag(
  tag: string,
  userId: string = "default",
  color?: string,
): Promise<void> {
  const db = getDb();
  const normalizedTag = normalizeTag(tag);
  const normalizedColor = normalizeTagColor(color);

  if (normalizedColor) {
    await db.execute({
      sql: `
        INSERT INTO user_tags (user_id, tag, color)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, tag) DO UPDATE SET color = excluded.color
      `,
      args: [userId, normalizedTag, normalizedColor],
    });
    return;
  }

  await db.execute({
    sql: "INSERT OR IGNORE INTO user_tags (user_id, tag, color) VALUES (?, ?, ?)",
    args: [userId, normalizedTag, defaultTagColor(normalizedTag)],
  });
}

// Anime watchlist

export async function getAnimeWatchlist(userId: string = "default"): Promise<WatchlistData | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT mal_id, status, title, type, episodes FROM anime_watchlist WHERE user_id = ?",
    args: [userId],
  });

  const anime: Record<string, WatchedAnime> = {};
  for (const row of result.rows) {
    const id = row.mal_id as string;
    anime[id] = {
      id,
      status: (row.status as string) || "",
      ...(row.title ? { title: row.title as string } : {}),
      ...(row.type ? { type: row.type as string } : {}),
      ...(row.episodes ? { episodes: row.episodes as number } : {}),
    };
  }

  return {
    user: { id: userId, name: userId },
    anime,
  };
}

export async function upsertAnimeWatchlist(
  malIds: string[],
  status: WatchTag,
  userId: string = "default",
  tagColor?: string,
): Promise<void> {
  const db = getDb();
  const normalizedStatus = normalizeTag(status);

  await upsertUserTag(normalizedStatus, userId, tagColor);

  const statements = malIds.map((id) => ({
    sql: `INSERT INTO anime_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)
          ON CONFLICT(user_id, mal_id) DO UPDATE SET status = excluded.status`,
    args: [userId, id, normalizedStatus],
  }));
  await db.batch(statements);
}

export async function deleteFromAnimeWatchlist(
  malIds: string[],
  userId: string = "default",
): Promise<void> {
  const db = getDb();
  const statements = malIds.map((id) => ({
    sql: "DELETE FROM anime_watchlist WHERE user_id = ? AND mal_id = ?",
    args: [userId, id],
  }));
  await db.batch(statements);
}

// Manga watchlist

export async function getMangaWatchlist(userId: string = "default"): Promise<MangaWatchlistData | null> {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT mal_id, status FROM manga_watchlist WHERE user_id = ?",
    args: [userId],
  });

  const manga: Record<string, WatchedManga> = {};
  for (const row of result.rows) {
    const id = row.mal_id as string;
    manga[id] = { id, status: (row.status as string) || "" };
  }

  return {
    user: { id: userId, name: userId },
    manga,
  };
}

export async function upsertMangaWatchlist(
  malIds: string[],
  status: WatchTag,
  userId: string = "default",
  tagColor?: string,
): Promise<void> {
  const db = getDb();
  const normalizedStatus = normalizeTag(status);

  await upsertUserTag(normalizedStatus, userId, tagColor);

  const statements = malIds.map((id) => ({
    sql: `INSERT INTO manga_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)
          ON CONFLICT(user_id, mal_id) DO UPDATE SET status = excluded.status`,
    args: [userId, id, normalizedStatus],
  }));
  await db.batch(statements);
}
