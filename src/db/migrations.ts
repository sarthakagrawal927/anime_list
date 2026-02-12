import { getDb } from "./client";

export async function migrateWatchlistTables(): Promise<void> {
  const db = getDb();

  // Check if anime_watchlist already has user_id column
  const animeInfo = await db.execute("PRAGMA table_info(anime_watchlist)");
  const hasUserId = animeInfo.rows.some((row) => row.name === "user_id");

  if (hasUserId) {
    console.log("Watchlist tables already migrated");
    return;
  }

  console.log("Migrating watchlist tables to support per-user data...");

  await db.batch([
    // Rename old tables
    "ALTER TABLE anime_watchlist RENAME TO anime_watchlist_old",
    "ALTER TABLE manga_watchlist RENAME TO manga_watchlist_old",

    // Create new tables with composite PK
    `CREATE TABLE anime_watchlist (
      user_id TEXT NOT NULL,
      mal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      title TEXT,
      type TEXT,
      episodes INTEGER,
      PRIMARY KEY (user_id, mal_id)
    )`,
    `CREATE TABLE manga_watchlist (
      user_id TEXT NOT NULL,
      mal_id TEXT NOT NULL,
      status TEXT NOT NULL,
      PRIMARY KEY (user_id, mal_id)
    )`,

    // Copy existing data with user_id='default'
    `INSERT INTO anime_watchlist (user_id, mal_id, status, title, type, episodes)
     SELECT 'default', mal_id, status, title, type, episodes FROM anime_watchlist_old`,
    `INSERT INTO manga_watchlist (user_id, mal_id, status)
     SELECT 'default', mal_id, status FROM manga_watchlist_old`,

    // Drop old tables
    "DROP TABLE anime_watchlist_old",
    "DROP TABLE manga_watchlist_old",
  ]);

  console.log("Watchlist migration complete");
}
