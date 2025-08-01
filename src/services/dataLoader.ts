import { existsSync } from "fs";
import { stat } from "fs/promises";
import {
  fetchAllAnimePages,
  fetchAllAnimePagesSeasonBased,
  shouldRunMonthlyUpdate,
} from "../api";
import { FILE_PATHS } from "../config";
import { cleanExistingJsonFile } from "../dataProcessor";
import { animeStore } from "../store/animeStore";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function isFileOlderThanOneDay(filePath: string): Promise<boolean> {
  if (!existsSync(filePath)) return true;
  const stats = await stat(filePath);
  const fileAge = Date.now() - stats.mtime.getTime();
  return fileAge > ONE_DAY_MS;
}

async function initAnimeData() {
  await fetchAllAnimePages();
  await cleanExistingJsonFile();
}

export async function loadAnimeData(): Promise<void> {
  let fileExists = existsSync(FILE_PATHS.cleanAnimeData);
  if (!fileExists) return initAnimeData();

  const needsMonthlyUpdate = await shouldRunMonthlyUpdate();
  if (needsMonthlyUpdate) {
    console.log("Monthly reclean starting in background");
    initAnimeData();
  } else {
    if (await isFileOlderThanOneDay(FILE_PATHS.cleanAnimeData))
      await fetchAllAnimePagesSeasonBased();
  }
}
