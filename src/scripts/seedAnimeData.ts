#!/usr/bin/env node
import "dotenv/config";
import { readJsonFile } from "../utils/file";
import { FILE_PATHS } from "../config";
import { AnimeItem } from "../types/anime";
import { upsertAnimeBatch } from "../db/animeData";
import { runAllMigrations } from "../db/migrations";

/**
 * Seed script to migrate anime data from JSON to Turso
 */
async function main() {
  console.log("Starting anime data migration to Turso...");

  // Run migrations first
  await runAllMigrations();

  // Read existing JSON data
  const animeData = await readJsonFile<Record<string, AnimeItem>>(
    FILE_PATHS.cleanAnimeData
  );

  if (!animeData) {
    console.error("No anime data found in JSON file. Run data fetch first.");
    process.exit(1);
  }

  const animeList = Object.values(animeData);
  console.log(`Found ${animeList.length} anime in JSON file`);

  // Insert into Turso in batches
  await upsertAnimeBatch(animeList);

  console.log("✓ Anime data migration completed successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
