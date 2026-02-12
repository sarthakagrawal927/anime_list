import { Request, Response } from "express";
import { updateLatestTwoSeasonData } from "../api";
import { animeStore } from "../store/animeStore";

/**
 * Trigger anime data update
 * Protected by CRON_SECRET environment variable
 */
export const triggerUpdate = async (req: Request, res: Response) => {
  // Auth check
  const token = req.headers["x-cron-secret"] || req.query.secret;
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    console.log(`[${new Date().toISOString()}] Cron triggered, updating anime data...`);

    // Update Turso with latest seasons
    await updateLatestTwoSeasonData();

    // Refresh in-memory cache
    await animeStore.setAnimeList();

    console.log(`[${new Date().toISOString()}] ✓ Update completed`);

    res.json({
      success: true,
      message: "Anime data updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Update failed:`, error);
    res.status(500).json({
      error: "Update failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
