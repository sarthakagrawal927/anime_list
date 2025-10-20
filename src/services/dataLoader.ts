import { existsSync } from "fs";
import { stat } from "fs/promises";
import {
  fetchAllAnimePages,
  fetchAllMangaPages,
  updateLatestTwoSeasonData,
} from "../api";
import { FILE_PATHS } from "../config";
import {
  cleanExistingJsonFile,
  cleanExistingMangaJsonFile,
} from "../dataProcessor";
import { animeStore } from "../store/animeStore";
import { mangaStore } from "../store/mangaStore";

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
    let fileExists = existsSync(FILE_PATHS.animeData);
    if (!fileExists) {
      console.log("Anime data file not found. Initializing...");
      return initAnimeData();
    } else {
      await cleanExistingJsonFile();
    }
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

// Manga data loading functions
async function initMangaData() {
  await fetchAllMangaPages();
  mangaStore.setMangaList(await cleanExistingMangaJsonFile());
}

export async function loadMangaData(): Promise<void> {
  let fileExists = existsSync(FILE_PATHS.cleanMangaData);
  if (!fileExists) {
    console.log("Manga data file not found. Initializing...");
    return initMangaData();
  }

  let mangaData;
  if (await isFileOlderThan(FILE_PATHS.cleanMangaData, THIRTY_DAYS_MS)) {
    console.log("Monthly manga reclean starting in background");
    initMangaData();
  }
  await mangaStore.setMangaList(mangaData);
  console.log("Manga data loaded successfully");
}
