import { existsSync } from "fs";
import { stat } from "fs/promises";
import { FILE_PATHS } from "../config";
import { readJsonFile } from "../utils/file";
import { animeStore } from "../store/animeStore";
import { AnimeItem } from "../types/anime";
import { 
  fetchAllAnimePages, 
  fetchAllAnimePagesSeasonBased,
  shouldRunMonthlyUpdate 
} from "../api";
import { cleanExistingJsonFile } from "../dataProcessor";

const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000;

async function isFileOlderThanOneDay(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return true;
  const stats = await stat(filePath);
  const fileAge = Date.now() - stats.mtime.getTime();
  return fileAge > SEVEN_DAY_MS;
}

export async function loadAnimeData(): Promise<void> {
  try {
    // Startup: Fetch seasons and append new data
    await fetchAllAnimePagesSeasonBased();

    // Monthly: Check if reclean needed and run in background
    const needsMonthlyUpdate = await shouldRunMonthlyUpdate();
    if (needsMonthlyUpdate) {
      console.log("Monthly reclean starting in background");
      setImmediate(async () => {
        try {
          await fetchAllAnimePages();
          await cleanExistingJsonFile();
          console.log("Monthly reclean completed");
        } catch (error) {
          console.error("Monthly reclean failed:", error);
        }
      });
    }

    // Load cleaned data
    const shouldRefreshData = await isFileOlderThanOneDay(FILE_PATHS.cleanAnimeData);
    if (shouldRefreshData) {
      await cleanExistingJsonFile();
    }

    const animeData = await readJsonFile<AnimeItem[]>(FILE_PATHS.cleanAnimeData);
    if (!animeData || !Array.isArray(animeData)) {
      throw new Error("Failed to load anime data");
    }

    animeStore.setAnimeList(animeData);
    console.log(`Loaded ${animeData.length} anime entries`);
  } catch (error) {
    console.error("Error loading anime data:", error);
    throw error;
  }
}
