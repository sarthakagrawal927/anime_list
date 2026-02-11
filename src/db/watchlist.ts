import { getDb } from "./client";
import type { WatchStatus } from "../config";
import type { WatchedAnime, WatchlistData, WatchedManga, MangaWatchlistData } from "../types/watchlist";

export async function initWatchlistTables(): Promise<void> {
  const db = getDb();
  await db.batch([
    `CREATE TABLE IF NOT EXISTS anime_watchlist (
      mal_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      title TEXT,
      type TEXT,
      episodes INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS manga_watchlist (
      mal_id TEXT PRIMARY KEY,
      status TEXT NOT NULL
    )`,
  ]);
}

// Anime watchlist

export async function getAnimeWatchlist(): Promise<WatchlistData | null> {
  const db = getDb();
  const result = await db.execute("SELECT mal_id, status, title, type, episodes FROM anime_watchlist");

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
    user: { id: "default", name: "default" },
    anime,
  };
}

export async function upsertAnimeWatchlist(
  malIds: string[],
  status: WatchStatus
): Promise<void> {
  const db = getDb();
  const stmts = malIds.map((id) => ({
    sql: `INSERT INTO anime_watchlist (mal_id, status) VALUES (?, ?)
          ON CONFLICT(mal_id) DO UPDATE SET status = excluded.status`,
    args: [id, status],
  }));
  await db.batch(stmts);
}

// Manga watchlist

export async function getMangaWatchlist(): Promise<MangaWatchlistData | null> {
  const db = getDb();
  const result = await db.execute("SELECT mal_id, status FROM manga_watchlist");

  const manga: Record<string, WatchedManga> = {};
  for (const row of result.rows) {
    const id = row.mal_id as string;
    manga[id] = { id, status: row.status as WatchStatus };
  }

  return {
    user: { id: "default", name: "default" },
    manga,
  };
}

export async function upsertMangaWatchlist(
  malIds: string[],
  status: WatchStatus
): Promise<void> {
  const db = getDb();
  const stmts = malIds.map((id) => ({
    sql: `INSERT INTO manga_watchlist (mal_id, status) VALUES (?, ?)
          ON CONFLICT(mal_id) DO UPDATE SET status = excluded.status`,
    args: [id, status],
  }));
  await db.batch(stmts);
}
