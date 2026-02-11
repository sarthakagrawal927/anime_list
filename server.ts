import cron from "node-cron";
import { createApp } from "./src/app";
import { SERVER_CONFIG } from "./src/config";
import { loadAnimeData, loadMangaData } from "./src/services/dataLoader";

const port = SERVER_CONFIG.port;

async function main() {
  const app = createApp();

  try {
    await loadAnimeData();
    await loadMangaData();
    console.log("Data loaded successfully");
  } catch (error) {
    console.error("Failed to load data:", error);
    process.exit(1);
  }

  // Daily data refresh at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("Running scheduled data refresh...");
    try {
      await loadAnimeData();
      await loadMangaData();
      console.log("Scheduled refresh complete");
    } catch (error) {
      console.error("Scheduled refresh failed:", error);
    }
  });

  app.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
