import axios from "axios";
import { delay, writeJsonFile, readJsonFile } from "./utils/file";
import { API_CONFIG, FILE_PATHS } from "./config";
import { BaseAnimeItem } from "./types/anime";

type RawAnimeItem = BaseAnimeItem & {
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

  let existingAnime: RawAnimeItem[] = [];
  try {
    const existing = await readJsonFile<RawAnimeItem[]>(FILE_PATHS.animeData);
    if (existing && Array.isArray(existing)) existingAnime = existing;
  } catch {
    console.log("No existing data found");
  }

  const animeMap = new Map(existingAnime.map((anime) => [anime.mal_id, anime]));
  for (const anime of fetchedAnime) {
    animeMap.set(anime.mal_id, anime);
  }

  await writeJsonFile(FILE_PATHS.animeData, Array.from(animeMap.values()));

  try {
    const record = { lastFullUpdate: new Date().toISOString() };
    await writeJsonFile(FILE_PATHS.fetchedSeasons, record);
  } catch {}
};

// Fetch last 2 seasons and cleanup old data
export const fetchAllAnimePagesSeasonBased = async (): Promise<void> => {
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

  let existingAnime: RawAnimeItem[] = [];
  try {
    const existing = await readJsonFile<RawAnimeItem[]>(FILE_PATHS.animeData);
    if (existing && Array.isArray(existing)) existingAnime = existing;
  } catch {}

  const animeMap = new Map(existingAnime.map((anime) => [anime.mal_id, anime]));
  let newCount = 0;
  const seasonsToFetch = [
    { season: currentSeason, year: currentYear },
    { season: previousSeasonData.season, year: previousSeasonData.year },
  ];

  for (const { season, year } of seasonsToFetch) {
    let page = 1;
    while (true) {
      const url = `${API_CONFIG.baseUrl}/seasons/${year}/${season}?page=${page}&limit=25`;
      const data = await fetchFromApi<ApiResponse<RawAnimeItem[]>>(url);

      if (!data?.data || !Array.isArray(data.data)) break;

      for (const anime of data.data) {
        if (!animeMap.has(anime.mal_id)) {
          animeMap.set(anime.mal_id, anime);
          newCount++;
        }
      }

      if (!data.pagination?.has_next_page) break;
      page++;
    }
  }

  await writeJsonFile(FILE_PATHS.animeData, Array.from(animeMap.values()));

  if (newCount > 0) {
    console.log(`Added ${newCount} new anime`);
  }

  console.log(`Season fetch completed in ${performance.now() - p0}ms`);
};

// Check if monthly update needed
export const shouldRunMonthlyUpdate = async (): Promise<boolean> => {
  try {
    const record = await readJsonFile<{ lastFullUpdate: string }>(
      FILE_PATHS.fetchedSeasons
    );
    if (!record?.lastFullUpdate) return true;

    const lastUpdate = new Date(record.lastFullUpdate).getTime();
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return lastUpdate < oneMonthAgo;
  } catch {
    return true;
  }
};
