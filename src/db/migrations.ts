import { getDb } from "./client";

const DEFAULT_TAG_COLORS: Record<string, string> = {
  Watching: "#10b981",
  Done: "#3b82f6",
};

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

const getDefaultTagColor = (tag: string): string => {
  const defaultColor = DEFAULT_TAG_COLORS[tag];
  if (defaultColor) return defaultColor;

  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return TAG_COLOR_PALETTE[hash % TAG_COLOR_PALETTE.length];
};

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

export async function migrateAnimeDataTable(): Promise<void> {
  const db = getDb();

  // Check if anime_data table exists
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='anime_data'"
  );

  if (tables.rows.length > 0) {
    console.log("Anime data table already exists");
    return;
  }

  console.log("Creating anime_data table...");

  await db.execute(`
    CREATE TABLE anime_data (
      mal_id INTEGER PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      title_english TEXT,
      type TEXT,
      episodes INTEGER,
      aired_from TEXT,
      aired_to TEXT,
      score REAL,
      scored_by INTEGER,
      rank INTEGER,
      status TEXT,
      popularity INTEGER,
      members INTEGER,
      favorites INTEGER,
      synopsis TEXT,
      year INTEGER,
      season TEXT,
      image TEXT,
      genres TEXT,
      themes TEXT,
      demographics TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for common queries
  await db.batch([
    "CREATE INDEX idx_anime_score ON anime_data(score)",
    "CREATE INDEX idx_anime_year ON anime_data(year)",
    "CREATE INDEX idx_anime_members ON anime_data(members)",
    "CREATE INDEX idx_anime_favorites ON anime_data(favorites)",
  ]);

  console.log("Anime data table created successfully");
}

export async function migrateWatchlistIndexes(): Promise<void> {
  const db = getDb();

  console.log("Creating watchlist indexes...");

  await db.batch([
    "CREATE INDEX IF NOT EXISTS idx_watchlist_user ON anime_watchlist(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_manga_watchlist_user ON manga_watchlist(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_user_tags_user ON user_tags(user_id)",
  ]);

  console.log("Watchlist indexes created successfully");
}

export async function migrateUserTagsTable(): Promise<void> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_tags (
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL COLLATE NOCASE,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, tag)
    )
  `);

  const info = await db.execute("PRAGMA table_info(user_tags)");
  const hasColor = info.rows.some((row) => row.name === "color");
  if (!hasColor) {
    await db.execute("ALTER TABLE user_tags ADD COLUMN color TEXT");
  }

  const rows = await db.execute(`
    SELECT DISTINCT user_id, status AS tag FROM anime_watchlist WHERE status IS NOT NULL AND trim(status) != ''
    UNION
    SELECT DISTINCT user_id, status AS tag FROM manga_watchlist WHERE status IS NOT NULL AND trim(status) != ''
  `);

  const statements = rows.rows.map((row) => {
    const userId = row.user_id as string;
    const tag = row.tag as string;
    return {
      sql: "INSERT OR IGNORE INTO user_tags (user_id, tag, color) VALUES (?, ?, ?)",
      args: [userId, tag, getDefaultTagColor(tag)],
    };
  });

  if (statements.length > 0) {
    await db.batch(statements);
  }

  const missingColorRows = await db.execute(
    "SELECT user_id, tag FROM user_tags WHERE color IS NULL OR trim(color) = ''"
  );
  const colorStatements = missingColorRows.rows.map((row) => {
    const userId = row.user_id as string;
    const tag = row.tag as string;
    return {
      sql: "UPDATE user_tags SET color = ? WHERE user_id = ? AND tag = ?",
      args: [getDefaultTagColor(tag), userId, tag],
    };
  });

  if (colorStatements.length > 0) {
    await db.batch(colorStatements);
  }
}

export async function migrateAnimeCreatedAt(): Promise<void> {
  const db = getDb();
  const info = await db.execute("PRAGMA table_info(anime_data)");
  const hasCreatedAt = info.rows.some((row) => row.name === "created_at");
  if (hasCreatedAt) return;

  console.log("Adding created_at column to anime_data...");
  await db.execute("ALTER TABLE anime_data ADD COLUMN created_at TEXT");
  // Backfill: set created_at = updated_at for existing rows
  await db.execute("UPDATE anime_data SET created_at = updated_at WHERE created_at IS NULL");
  console.log("created_at column added");
}

export async function migrateWatchlistStatusRenames(): Promise<void> {
  const db = getDb();

  // Check if migration has already run by looking for new status names
  const statusCheck = await db.execute({
    sql: "SELECT COUNT(*) as count FROM anime_watchlist WHERE status IN ('Avoiding', 'Deferred')",
    args: []
  });

  const needsMigration = (statusCheck.rows[0].count as number) > 0;

  if (!needsMigration) {
    return;
  }

  console.log("Migrating watchlist status names...");

  await db.batch([
    { sql: "UPDATE anime_watchlist SET status = 'Delaying' WHERE status = 'Avoiding'", args: [] },
    { sql: "UPDATE anime_watchlist SET status = 'Dropped' WHERE status = 'Deferred'", args: [] },
    { sql: "UPDATE manga_watchlist SET status = 'Delaying' WHERE status = 'Avoiding'", args: [] },
    { sql: "UPDATE manga_watchlist SET status = 'Dropped' WHERE status = 'Deferred'", args: [] },
  ]);

  console.log("Watchlist status names migrated successfully");
}

export async function runAllMigrations(): Promise<void> {
  await migrateWatchlistTables();
  await migrateUserTagsTable();
  await migrateAnimeDataTable();
  await migrateWatchlistIndexes();
  await migrateAnimeCreatedAt();
  console.log("All migrations completed");
}
