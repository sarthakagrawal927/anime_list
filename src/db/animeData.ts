import { getDb } from "./client";
import { AnimeItem } from "../types/anime";

/**
 * Insert or update anime in the database
 */
export async function upsertAnime(anime: AnimeItem): Promise<void> {
  const db = getDb();

  await db.execute({
    sql: `
      INSERT INTO anime_data (
        mal_id, url, title, title_english, type, episodes,
        aired_from, aired_to, score, scored_by, rank, status,
        popularity, members, favorites, synopsis, year, season,
        image, genres, themes, demographics, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(mal_id) DO UPDATE SET
        url = excluded.url,
        title = excluded.title,
        title_english = excluded.title_english,
        type = excluded.type,
        episodes = excluded.episodes,
        aired_from = excluded.aired_from,
        aired_to = excluded.aired_to,
        score = excluded.score,
        scored_by = excluded.scored_by,
        rank = excluded.rank,
        status = excluded.status,
        popularity = excluded.popularity,
        members = excluded.members,
        favorites = excluded.favorites,
        synopsis = excluded.synopsis,
        year = excluded.year,
        season = excluded.season,
        image = excluded.image,
        genres = excluded.genres,
        themes = excluded.themes,
        demographics = excluded.demographics,
        updated_at = datetime('now')
    `,
    args: [
      anime.mal_id,
      anime.url,
      anime.title,
      anime.title_english || null,
      anime.type || null,
      anime.episodes || null,
      anime.aired?.from || null,
      anime.aired?.to || null,
      anime.score || null,
      anime.scored_by || null,
      anime.rank || null,
      anime.status || null,
      anime.popularity || null,
      anime.members || null,
      anime.favorites || null,
      anime.synopsis || null,
      anime.year || null,
      anime.season || null,
      anime.image || null,
      JSON.stringify(anime.genres),
      JSON.stringify(anime.themes),
      JSON.stringify(anime.demographics),
    ],
  });
}

export interface UpsertSummary {
  added: { mal_id: number; title: string }[];
  updated: { mal_id: number; title: string }[];
}

/**
 * Bulk insert/update anime (more efficient for large batches)
 * Uses created_at column to distinguish new inserts from updates:
 * - INSERT sets both created_at and updated_at to now
 * - ON CONFLICT only updates updated_at, leaving created_at unchanged
 * After batch, rows where created_at == updated_at are newly added.
 */
export async function upsertAnimeBatch(animeList: AnimeItem[]): Promise<UpsertSummary> {
  const db = getDb();
  const batchSize = 100;

  for (let i = 0; i < animeList.length; i += batchSize) {
    const batch = animeList.slice(i, i + batchSize);
    const statements = batch.map((anime) => ({
      sql: `
        INSERT INTO anime_data (
          mal_id, url, title, title_english, type, episodes,
          aired_from, aired_to, score, scored_by, rank, status,
          popularity, members, favorites, synopsis, year, season,
          image, genres, themes, demographics, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(mal_id) DO UPDATE SET
          url = excluded.url,
          title = excluded.title,
          title_english = excluded.title_english,
          type = excluded.type,
          episodes = excluded.episodes,
          aired_from = excluded.aired_from,
          aired_to = excluded.aired_to,
          score = excluded.score,
          scored_by = excluded.scored_by,
          rank = excluded.rank,
          status = excluded.status,
          popularity = excluded.popularity,
          members = excluded.members,
          favorites = excluded.favorites,
          synopsis = excluded.synopsis,
          year = excluded.year,
          season = excluded.season,
          image = excluded.image,
          genres = excluded.genres,
          themes = excluded.themes,
          demographics = excluded.demographics,
          updated_at = datetime('now')
      `,
      args: [
        anime.mal_id,
        anime.url,
        anime.title,
        anime.title_english || null,
        anime.type || null,
        anime.episodes || null,
        anime.aired?.from || null,
        anime.aired?.to || null,
        anime.score || null,
        anime.scored_by || null,
        anime.rank || null,
        anime.status || null,
        anime.popularity || null,
        anime.members || null,
        anime.favorites || null,
        anime.synopsis || null,
        anime.year || null,
        anime.season || null,
        anime.image || null,
        JSON.stringify(anime.genres),
        JSON.stringify(anime.themes),
        JSON.stringify(anime.demographics),
      ],
    }));

    await db.batch(statements, "write");
  }

  // Query which of the upserted rows were new inserts vs updates
  const malIds = animeList.map((a) => a.mal_id);
  const placeholders = malIds.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT mal_id, title, title_english, created_at, updated_at
          FROM anime_data WHERE mal_id IN (${placeholders})`,
    args: malIds,
  });

  const summary: UpsertSummary = { added: [], updated: [] };
  for (const row of result.rows) {
    const entry = {
      mal_id: row.mal_id as number,
      title: (row.title_english as string) || (row.title as string),
    };
    if (row.created_at === row.updated_at) {
      summary.added.push(entry);
    } else {
      summary.updated.push(entry);
    }
  }

  console.log(`Upserted ${animeList.length} anime (${summary.added.length} new, ${summary.updated.length} updated)`);
  return summary;
}

/**
 * Get all anime from database
 */
export async function getAllAnime(): Promise<AnimeItem[]> {
  const db = getDb();
  const result = await db.execute("SELECT * FROM anime_data");

  return result.rows.map((row) => ({
    mal_id: row.mal_id as number,
    url: row.url as string,
    title: row.title as string,
    title_english: (row.title_english as string) || undefined,
    type: (row.type as string) || undefined,
    episodes: (row.episodes as number) || undefined,
    aired: row.aired_from
      ? {
          from: row.aired_from as string,
          to: (row.aired_to as string) || "",
        }
      : undefined,
    score: (row.score as number) || undefined,
    scored_by: (row.scored_by as number) || undefined,
    rank: (row.rank as number) || undefined,
    status: (row.status as string) || undefined,
    popularity: (row.popularity as number) || undefined,
    members: (row.members as number) || undefined,
    favorites: (row.favorites as number) || undefined,
    synopsis: (row.synopsis as string) || undefined,
    year: (row.year as number) || undefined,
    season: (row.season as string) || undefined,
    image: (row.image as string) || undefined,
    genres: JSON.parse((row.genres as string) || "{}"),
    themes: JSON.parse((row.themes as string) || "{}"),
    demographics: JSON.parse((row.demographics as string) || "{}"),
  }));
}

/**
 * Get count of anime in database
 */
export async function getAnimeCount(): Promise<number> {
  const db = getDb();
  const result = await db.execute("SELECT COUNT(*) as count FROM anime_data");
  return result.rows[0].count as number;
}

/**
 * Get the most recent updated_at timestamp
 */
export async function getLastDataUpdate(): Promise<string | null> {
  const db = getDb();
  const result = await db.execute("SELECT MAX(updated_at) as last_updated FROM anime_data");
  return (result.rows[0]?.last_updated as string) || null;
}

/**
 * Get recently added/updated anime grouped by date
 */
export async function getRecentChanges(limit = 100): Promise<
  { date: string; title: string; title_english: string | null; type: string | null; mal_id: number }[]
> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT mal_id, title, title_english, type, DATE(created_at) as update_date
          FROM anime_data
          ORDER BY created_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return result.rows.map((row) => ({
    date: row.update_date as string,
    title: row.title as string,
    title_english: (row.title_english as string) || null,
    type: (row.type as string) || null,
    mal_id: row.mal_id as number,
  }));
}
