import axios from 'axios';
import { delay, writeJsonFile } from './utils';
import { API_CONFIG, FILE_PATHS, SUCCESS_MESSAGES } from './config';

interface AnimeData {
    data: any[]; // TODO: Define specific anime data structure when needed
}

interface ApiResponse<T> {
    data: T;
}

const fetchFromApi = async <T>(url: string): Promise<T | null> => {
    try {
        const response: ApiResponse<T> = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error instanceof Error ? error.message : String(error));
        return null;
    }
};

const fetchAnimePage = async (page: number): Promise<AnimeData | null> => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.topAnime}?page=${page}`;
    return fetchFromApi<AnimeData>(url);
};

const fetchUserHistory = async (username: string): Promise<any | null> => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userHistory}/${username}/history?type=anime`;
    return fetchFromApi(url);
};

const fetchAllAnimePages = async (): Promise<any[]> => {
    const allData: any[] = [];
    console.log('Starting to fetch anime data...');

    for (let page = 1; page <= API_CONFIG.totalPages; page++) {
        console.log(`Fetching page ${page}/${API_CONFIG.totalPages}...`);
        const pageData = await fetchAnimePage(page);

        if (pageData) {
            allData.push(...pageData.data);
            // Save progress every 10 pages
            if (page % 10 === 0) {
                await writeJsonFile(FILE_PATHS.partialData, allData);
                console.log(`Progress saved at page ${page}`);
            }
        }

        await delay(API_CONFIG.rateLimit);
    }

    await writeJsonFile(FILE_PATHS.rawData, allData);
    console.log(`${SUCCESS_MESSAGES.fetchCompleted} Data saved to ${FILE_PATHS.rawData}`);
    return allData;
};

export {
    fetchFromApi,
    fetchAnimePage,
    fetchUserHistory,
    fetchAllAnimePages
};
