import { existsSync } from "fs";
import { stat } from "fs/promises";
import { FILE_PATHS } from "../config";
import { readJsonFile } from "../utils/file";
import { animeStore } from "../store/animeStore";
import { AnimeItem } from "../types/anime";
import { fetchAllAnimePages } from "../api";
import { cleanExistingJsonFile } from "../dataProcessor";

const SEVEN_DAY_MS = 7 * 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function isFileOlderThanOneDay(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return true;

  const stats = await stat(filePath);
  const fileAge = Date.now() - stats.mtime.getTime();
  return fileAge > SEVEN_DAY_MS;
}

async function fetchAndCleanData(): Promise<AnimeItem[]> {
  console.log("Fetching and cleaning new data...");
  await fetchAllAnimePages();
  await cleanExistingJsonFile();
  const freshData = await readJsonFile<AnimeItem[]>(FILE_PATHS.cleanAnimeData);

  if (!freshData || !Array.isArray(freshData)) {
    throw new Error("Failed to fetch and clean anime data");
  }

  return freshData;
}

export async function loadAnimeData(): Promise<void> {
  try {
    const shouldRefreshData = await isFileOlderThanOneDay(
      FILE_PATHS.cleanAnimeData
    );
    let animeData: AnimeItem[];

    if (shouldRefreshData) {
      console.log("Anime data is outdated or missing. Fetching new data...");
      animeData = await fetchAndCleanData();
    } else {
      console.log("Loading anime data from file...");
      const cleanedData = await readJsonFile<AnimeItem[]>(
        FILE_PATHS.cleanAnimeData
      );

      if (!cleanedData || !Array.isArray(cleanedData)) {
        console.log("No valid data found. Fetching new data...");
        animeData = await fetchAndCleanData();
      } else {
        animeData = cleanedData;
      }
    }

    animeStore.setAnimeList(animeData);
    console.log(`Loaded ${animeData.length} anime entries into memory`);
  } catch (error) {
    console.error("Error loading anime data:", error);
    throw error;
  }
}
