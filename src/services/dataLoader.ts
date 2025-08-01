import { existsSync } from "fs";
import { stat } from "fs/promises";
import { fetchAllAnimePages, updateLatestTwoSeasonData } from "../api";
import { FILE_PATHS } from "../config";
import { cleanExistingJsonFile } from "../dataProcessor";
import { animeStore } from "../store/animeStore";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

async function isFileOlderThan(
  filePath: string,
  ageMs: number
): Promise<boolean> {
  if (!existsSync(filePath)) return true;
  const stats = await stat(filePath);
  return Date.now() - stats.mtime.getTime() > ageMs;
}

async function initAnimeData() {
  await fetchAllAnimePages();
  animeStore.setAnimeList(await cleanExistingJsonFile());
}

export async function loadAnimeData(): Promise<void> {
  let fileExists = existsSync(FILE_PATHS.cleanAnimeData);
  if (!fileExists) {
    console.log("Anime data file not found. Initializing...");
    return initAnimeData();
  }

  let animeData;
  if (await isFileOlderThan(FILE_PATHS.cleanAnimeData, THIRTY_DAYS_MS)) {
    console.log("Monthly reclean starting in background");
    initAnimeData();
  } else if (await isFileOlderThan(FILE_PATHS.cleanAnimeData, ONE_DAY_MS)) {
    console.log("Daily update starting");
    await updateLatestTwoSeasonData();
    animeData = await cleanExistingJsonFile();
  }
  await animeStore.setAnimeList(animeData);
  console.log("Anime data loaded successfully");
}
