import axios from "axios";
import { delay, writeJsonFile } from "./utils/file";
import { API_CONFIG, FILE_PATHS } from "./config";
import { RawAnimeData } from "./types/anime";

interface ApiResponse<T> {
  data: T;
  pagination?: {
    has_next_page: boolean;
  };
}

const fetchFromApi = async <T>(url: string): Promise<T | null> => {
  try {
    const response: ApiResponse<T> = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching ${url}:`,
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
};

export const fetchAllAnimePages = async (): Promise<void> => {
  const allAnime: RawAnimeData[] = [];
  let page = 1;

  while (page <= API_CONFIG.totalPages) {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.topAnime}?page=${page}`;
    const data = await fetchFromApi<ApiResponse<RawAnimeData[]>>(url);

    if (!data?.data || !Array.isArray(data.data)) {
      console.error(`Invalid data format on page ${page}`);
      break;
    }

    allAnime.push(...data.data);

    if (!data.pagination?.has_next_page) break;
    console.log(`Fetched page ${page} of ${API_CONFIG.totalPages}`);
    await delay(API_CONFIG.rateLimit);
    page++;
  }
  console.log(`Fetched ${allAnime.length} anime entries`);
  await writeJsonFile(FILE_PATHS.animeData, allAnime);
};
