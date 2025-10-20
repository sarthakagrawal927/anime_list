import axios from "axios";
import { delay, writeJsonFile, readJsonFile } from "./utils/file";
import { API_CONFIG, FILE_PATHS } from "./config";
import { BaseAnimeItem } from "./types/anime";
import { BaseMangaItem } from "./types/manga";

type RawAnimeItem = BaseAnimeItem & {
  genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
};

type RawMangaItem = BaseMangaItem & {
  genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
};

interface ApiResponse<T> {
  data: T;
  pagination?: {
    has_next_page: boolean;
  };
}

const fetchFromApi = async <T>(url: string): Promise<T | null> => {
  try {
    // Run delay and API call in parallel for efficient rate limiting
    const [response] = await Promise.all([
      axios.get(url),
      delay(API_CONFIG.rateLimit),
    ]);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching ${url}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};

// Monthly reclean - fetch top anime and update existing entries
export const fetchAllAnimePages = async (): Promise<void> => {
  const fetchedAnime: RawAnimeItem[] = [];
  let page = 1;

  const p0 = performance.now();

  while (page <= API_CONFIG.totalPages) {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.topAnime}?page=${page}&limit=20`;
    const data = await fetchFromApi<ApiResponse<RawAnimeItem[]>>(url);

    if (!data?.data || !Array.isArray(data.data)) {
      console.error(`Invalid data format on page ${page}`);
      break;
    }

    fetchedAnime.push(...data.data);
    if (!data.pagination?.has_next_page) break;
    if (page % 10 === 0) console.log(`Fetched page ${page}`);
    page++;
  }

  let existingAnime: Record<string, RawAnimeItem> = {};
  for (const anime of fetchedAnime) {
    existingAnime[anime.mal_id.toString()] = anime;
  }

  await writeJsonFile(FILE_PATHS.animeData, existingAnime);
  console.log(`Updated all anime again in ${performance.now() - p0}ms`);
};

// Fetch last 2 seasons and cleanup old data
export const updateLatestTwoSeasonData = async (): Promise<void> => {
  const p0 = performance.now();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const getSeason = (month: number): string => {
    if (month >= 12 || month <= 2) return "winter";
    else if (month >= 3 && month <= 5) return "spring";
    else if (month >= 6 && month <= 8) return "summer";
    else return "fall";
  };

  const getPreviousSeason = (
    season: string,
    year: number
  ): { season: string; year: number } => {
    const seasons = ["winter", "spring", "summer", "fall"];
    const currentIndex = seasons.indexOf(season);
    if (currentIndex === 0) {
      return { season: "fall", year: year - 1 };
    }
    return { season: seasons[currentIndex - 1], year };
  };

  const currentSeason = getSeason(currentMonth);
  const previousSeasonData = getPreviousSeason(currentSeason, currentYear);

  let existingAnime = await readJsonFile<Record<string, RawAnimeItem>>(
    FILE_PATHS.animeData
  );
  if (!existingAnime) throw new Error("No data found in anime data file");

  let newCount = 0,
    updatedCount = 0;
  const seasonsToFetch = [
    { season: currentSeason, year: currentYear },
    { season: previousSeasonData.season, year: previousSeasonData.year },
  ];

  for (const { season, year } of seasonsToFetch) {
    console.log(`Fetching ${season} ${year}`);
    let page = 1;
    while (true) {
      const url = `${API_CONFIG.baseUrl}/seasons/${year}/${season}?page=${page}&limit=25`;
      const data = await fetchFromApi<ApiResponse<RawAnimeItem[]>>(url);

      if (!data?.data || !Array.isArray(data.data)) break;

      for (const anime of data.data) {
        const key = anime.mal_id.toString();
        if (!existingAnime[key]) newCount++;
        else updatedCount++;
        existingAnime[key] = anime;
      }

      if (!data.pagination?.has_next_page) break;
      page++;
    }
    console.log(`Season ${season} ${year} fetch completed in ${performance.now() - p0}ms`);
  }

  await writeJsonFile(FILE_PATHS.animeData, existingAnime);

  if (newCount > 0 || updatedCount > 0) {
    console.log(
      `Added ${newCount} new anime, updated ${updatedCount} existing anime`
    );
  }
  console.log(`Season fetch completed in ${(performance.now() - p0) / 1000}s`);
};

// Manga API functions
export const fetchAllMangaPages = async (): Promise<void> => {
  const fetchedManga: RawMangaItem[] = [];
  let page = 1;

  const p0 = performance.now();

  while (page <= API_CONFIG.totalPages) {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.topManga}?page=${page}&limit=20`;
    const data = await fetchFromApi<ApiResponse<RawMangaItem[]>>(url);

    if (!data?.data || !Array.isArray(data.data)) {
      console.error(`Invalid data format on page ${page}`);
      break;
    }

    fetchedManga.push(...data.data);
    if (!data.pagination?.has_next_page) break;
    if (page % 10 === 0) console.log(`Fetched manga page ${page}`);
    page++;
  }

  let existingManga: Record<string, RawMangaItem> = {};
  for (const manga of fetchedManga) {
    existingManga[manga.mal_id.toString()] = manga;
  }

  await writeJsonFile(FILE_PATHS.mangaData, existingManga);
  console.log(`Updated all manga in ${performance.now() - p0}ms`);
};
