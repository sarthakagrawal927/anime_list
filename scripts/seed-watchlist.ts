import "dotenv/config";
import { readFileSync } from "fs";
import { getDb } from "../src/db/client";
import { initWatchlistTables } from "../src/db/watchlist";

async function seed() {
  await initWatchlistTables();
  const db = getDb();

  const userId = process.argv[2] || "default";
  console.log(`Seeding watchlist for user_id: ${userId}`);

  // Seed anime watchlist
  try {
    const animeData = JSON.parse(readFileSync("user_watchedlist_data.json", "utf-8"));
    const entries = Object.values(animeData.anime) as Array<{
      id: string;
      status: string;
      title?: string;
      type?: string;
      episodes?: number | string;
    }>;

    console.log(`Seeding ${entries.length} anime watchlist entries...`);

    for (let i = 0; i < entries.length; i += 100) {
      const chunk = entries.slice(i, i + 100);
      await db.batch(
        chunk.map((e) => ({
          sql: `INSERT OR REPLACE INTO anime_watchlist (user_id, mal_id, status, title, type, episodes) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            userId,
            e.id,
            e.status,
            e.title || null,
            e.type || null,
            e.episodes ? Number(e.episodes) : null,
          ],
        }))
      );
      console.log(`  ${Math.min(i + 100, entries.length)}/${entries.length}`);
    }

    console.log("Anime watchlist seeded.");
  } catch (e) {
    console.log("No anime watchlist file found, skipping.");
  }

  // Seed manga watchlist
  try {
    const mangaData = JSON.parse(readFileSync("user_manga_watchedlist_data.json", "utf-8"));
    const entries = Object.values(mangaData.manga) as Array<{
      id: string;
      status: string;
    }>;

    console.log(`Seeding ${entries.length} manga watchlist entries...`);

    await db.batch(
      entries.map((e) => ({
        sql: `INSERT OR REPLACE INTO manga_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)`,
        args: [userId, e.id, e.status],
      }))
    );

    console.log("Manga watchlist seeded.");
  } catch (e) {
    console.log("No manga watchlist file found, skipping.");
  }

  console.log("Done!");
}

seed().catch(console.error);
