import { getDb } from "./client";
import type { WatchStatus } from "../config";
import type { WatchedAnime, WatchlistData, WatchedManga, MangaWatchlistData } from "../types/watchlist";

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
  ]);
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
      status: row.status as WatchStatus,
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
  status: WatchStatus,
  userId: string = "default"
): Promise<void> {
  const db = getDb();
  const stmts = malIds.map((id) => ({
    sql: `INSERT INTO anime_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)
          ON CONFLICT(user_id, mal_id) DO UPDATE SET status = excluded.status`,
    args: [userId, id, status],
  }));
  await db.batch(stmts);
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
    manga[id] = { id, status: row.status as WatchStatus };
  }

  return {
    user: { id: userId, name: userId },
    manga,
  };
}

export async function upsertMangaWatchlist(
  malIds: string[],
  status: WatchStatus,
  userId: string = "default"
): Promise<void> {
  const db = getDb();
  const stmts = malIds.map((id) => ({
    sql: `INSERT INTO manga_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)
          ON CONFLICT(user_id, mal_id) DO UPDATE SET status = excluded.status`,
    args: [userId, id, status],
  }));
  await db.batch(stmts);
}
