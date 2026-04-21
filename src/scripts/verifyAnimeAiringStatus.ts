#!/usr/bin/env node
import axios from "axios";
import dotenv from "dotenv";
import { getAllAnime, upsertAnimeBatchNoSummary } from "../db/animeData";
import { runAllMigrations } from "../db/migrations";
import {
  applyAniListStatusUpdates,
  type AniListStatusRecord,
} from "../services/anilistStatusSync";

dotenv.config({ path: ".env.local" });
dotenv.config();

const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";
const QUERY = `
  query ($ids: [Int], $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(type: ANIME, idMal_in: $ids) {
        idMal
        status
        episodes
      }
    }
  }
`;

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_DELAY_MS = 800;
const DEFAULT_MAX_RETRIES = 5;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getNumberArg(name: string, fallback: number): number {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function ensureRequiredEnv(): void {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required to verify airing status."
    );
  }
}

async function fetchAniListBatch(
  malIds: number[],
  maxRetries: number
): Promise<AniListStatusRecord[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post<{
        data?: {
          Page?: {
            media?: AniListStatusRecord[];
          };
        };
      }>(
        ANILIST_GRAPHQL_URL,
        {
          query: QUERY,
          variables: {
            ids: malIds,
            perPage: malIds.length,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      return response.data.data?.Page?.media ?? [];
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const statusCode = error.response?.status;
      const retryAfterSeconds = Number(error.response?.headers["retry-after"]);
      const shouldRetry =
        attempt < maxRetries &&
        (!statusCode || statusCode === 429 || statusCode >= 500);

      if (!shouldRetry) {
        throw error;
      }

      const delayMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : Math.min(30000, DEFAULT_DELAY_MS * 2 ** attempt);

      console.warn(
        `AniList batch failed with ${statusCode ?? "network error"} on attempt ${attempt}/${maxRetries}. Retrying in ${delayMs}ms...`
      );
      await delay(delayMs);
    }
  }

  return [];
}

async function main() {
  ensureRequiredEnv();

  const startedAt = Date.now();
  const isDryRun = process.argv.includes("--dry-run");
  const batchSize = getNumberArg("--batch-size", DEFAULT_BATCH_SIZE);
  const delayMs = getNumberArg("--delay-ms", DEFAULT_DELAY_MS);
  const limit = getNumberArg("--limit", 0);

  console.log(`[${new Date().toISOString()}] Starting anime airing status verification...`);
  console.log(
    `Mode=${isDryRun ? "dry-run" : "write"}, batchSize=${batchSize}, delayMs=${delayMs}${limit ? `, limit=${limit}` : ""}`
  );

  await runAllMigrations();

  const animeList = await getAllAnime();
  const scopedAnimeList = limit > 0 ? animeList.slice(0, limit) : animeList;
  const allChanges = [];
  const allMissingMalIds: number[] = [];
  const changedAnimeMap = new Map<number, (typeof animeList)[number]>();

  for (let offset = 0; offset < scopedAnimeList.length; offset += batchSize) {
    const batch = scopedAnimeList.slice(offset, offset + batchSize);
    const malIds = batch.map((anime) => anime.mal_id);
    const updates = await fetchAniListBatch(malIds, DEFAULT_MAX_RETRIES);
    const { changedAnime, changes, missingMalIds } = applyAniListStatusUpdates(
      batch,
      updates
    );

    for (const anime of changedAnime) {
      changedAnimeMap.set(anime.mal_id, anime);
    }

    allChanges.push(...changes);
    allMissingMalIds.push(...missingMalIds);

    const processed = Math.min(offset + batch.length, scopedAnimeList.length);
    console.log(
      `Processed ${processed}/${scopedAnimeList.length} anime. Changed=${allChanges.length}, missing=${allMissingMalIds.length}`
    );

    if (processed < scopedAnimeList.length) {
      await delay(delayMs);
    }
  }

  const changedAnime = Array.from(changedAnimeMap.values());

  console.log(`\nSummary:`);
  console.log(`- Checked: ${scopedAnimeList.length}`);
  console.log(`- Changed: ${changedAnime.length}`);
  console.log(`- Missing on AniList: ${allMissingMalIds.length}`);

  if (allChanges.length > 0) {
    console.log(`\nSample changes:`);
    for (const change of allChanges.slice(0, 20)) {
      const statusDelta =
        change.previousStatus !== change.nextStatus
          ? `status: ${change.previousStatus ?? "unset"} -> ${change.nextStatus ?? "unset"}`
          : "";
      const episodesDelta =
        change.previousEpisodes !== change.nextEpisodes
          ? `episodes: ${change.previousEpisodes ?? "unset"} -> ${change.nextEpisodes ?? "unset"}`
          : "";
      const pieces = [statusDelta, episodesDelta].filter(Boolean);
      console.log(`- ${change.title} (${change.malId}): ${pieces.join(", ")}`);
    }
  }

  if (!isDryRun && changedAnime.length > 0) {
    await upsertAnimeBatchNoSummary(changedAnime);
    console.log(`\nPersisted ${changedAnime.length} changed anime records.`);
  } else if (isDryRun) {
    console.log(`\nDry run complete. No database changes were written.`);
  } else {
    console.log(`\nNo database changes were necessary.`);
  }

  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[${new Date().toISOString()}] Done in ${durationSeconds}s.`);
}

main().catch((error) => {
  console.error(
    `[${new Date().toISOString()}] ✗ Error verifying anime airing status:`,
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
