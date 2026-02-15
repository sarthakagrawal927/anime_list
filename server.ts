import "dotenv/config";
import cron from "node-cron";
import { createApp } from "./src/app";
import { SERVER_CONFIG } from "./src/config";
import { loadAnimeData, loadMangaData } from "./src/services/dataLoader";
import { initWatchlistTables } from "./src/db/watchlist";
import { initUsersTable } from "./src/db/users";
import { migrateWatchlistTables } from "./src/db/migrations";

const port = SERVER_CONFIG.port;

async function main() {
  const app = createApp();

  // Init DB tables and run migrations
  await initUsersTable();
  await initWatchlistTables();
  await migrateWatchlistTables();
  console.log("Database tables initialized");

  // Start listening immediately so Render health check passes
  app.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`);
  });

  // Load data in the background
  try {
    await loadAnimeData();
    await loadMangaData();
    console.log("Data loaded successfully");
  } catch (error) {
    console.error("Failed to load data:", error);
  }

  // Daily data refresh at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("Running scheduled data refresh...");
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await loadAnimeData();
        await loadMangaData();
        console.log("✓ Scheduled refresh complete");
        return;
      } catch (error) {
        console.error(`Refresh attempt ${attempt}/3 failed:`, error);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 60000)); // Wait 1 min before retry
        }
      }
    }
    console.error("✗ All refresh attempts failed");
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
