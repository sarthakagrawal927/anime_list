#!/usr/bin/env node
import "dotenv/config";
import { updateLatestTwoSeasonData } from "../api";
import { runAllMigrations } from "../db/migrations";
import { animeStore } from "../store/animeStore";

/**
 * Cron job script to update anime data in Turso database
 * Fetches current and previous season anime and saves to Turso
 */
async function main() {
  console.log(`[${new Date().toISOString()}] Starting anime data update...`);

  try {
    // Ensure database tables exist
    await runAllMigrations();

    // Fetch latest two seasons and save to Turso
    await updateLatestTwoSeasonData();

    // Refresh the in-memory store cache
    await animeStore.setAnimeList();

    console.log(`[${new Date().toISOString()}] ✓ Anime data update completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Error updating anime data:`, error);
    process.exit(1);
  }
}

main();
