import { readJsonFile, writeJsonFile, FILTER_ACTIONS } from './utils';
import { 
    ANIME_FIELDS, 
    GENRE_FIELDS, 
    FILE_PATHS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    AnimeField
} from './config';

export interface AnimeItem {
    [key: string]: any;
    genres?: { [key: string]: number };
    themes?: { [key: string]: number };
    demographics?: { [key: string]: number };
    type?: string;
    year?: number;
}

interface GenreEntry {
    name: string;
    [key: string]: any;
}

export interface Filter {
    field: string;
    value: string | number | string[];
    action: string;
}

interface GenreMap {
    [key: string]: number;
}

const processGenres = (item: AnimeItem): AnimeItem => {
    GENRE_FIELDS.forEach((field: AnimeField) => {
        if (item[field]) {
            item[field] = (item[field] as GenreEntry[]).map(entry => entry.name).reduce((acc: GenreMap, curr: string) => {
                acc[curr] = 1;
                return acc;
            }, {});
        }
    });
    return item;
};

const cleanAnimeData = (animeData: AnimeItem | AnimeItem[]): AnimeItem | AnimeItem[] => {
    if (Array.isArray(animeData)) {
        return animeData.map(anime => {
            const cleanedAnime: AnimeItem = {};
            Object.values(ANIME_FIELDS).forEach(field => {
                if (anime[field] !== undefined) {
                    cleanedAnime[field] = anime[field];
                }
            });
            return processGenres(cleanedAnime);
        });
    } else {
        const cleanedAnime: AnimeItem = {};
        Object.values(ANIME_FIELDS).forEach(field => {
            if (animeData[field] !== undefined) {
                cleanedAnime[field] = animeData[field];
            }
        });
        return processGenres(cleanedAnime);
    }
};

const cleanExistingJsonFile = async (): Promise<void> => {
    try {
        console.log(`Reading ${FILE_PATHS.rawData}...`);
        const animeData = await readJsonFile(FILE_PATHS.rawData);

        console.log('Cleaning data...');
        const cleanedData = cleanAnimeData(animeData) as AnimeItem[];

        console.log(`Writing cleaned data to ${FILE_PATHS.cleanedData}...`);
        await writeJsonFile(FILE_PATHS.cleanedData, cleanedData);
        console.log(`${SUCCESS_MESSAGES.cleaningCompleted} Saved to ${FILE_PATHS.cleanedData}`);

        // Log statistics
        console.log('\nStatistics:');
        console.log(`Total entries: ${cleanedData.length}`);
        const totalSize = Buffer.byteLength(JSON.stringify(cleanedData));
        console.log(`File size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
        console.error('Error during cleaning:', error);
    }
};

const filterAnimeList = async (filterList: Filter[], animeData: AnimeItem[] | null = null): Promise<AnimeItem[]> => {
    const data = animeData || await readJsonFile(FILE_PATHS.cleanedData) as AnimeItem[];
    if (!data) {
        throw new Error(ERROR_MESSAGES.noDataFound);
    }
    
    return data.map(item => {
        for (const filter of filterList) {
            const itemValue = item[filter.field];
            switch (filter.action) {
                case FILTER_ACTIONS.GREATER_THAN:
                    if (itemValue <= filter.value) return false;
                    break;
                case FILTER_ACTIONS.GREATER_THAN_OR_EQUALS:
                    if (itemValue < filter.value) return false;
                    break;
                case FILTER_ACTIONS.LESS_THAN:
                    if (itemValue >= filter.value) return false;
                    break;
                case FILTER_ACTIONS.LESS_THAN_OR_EQUALS:
                    if (itemValue > filter.value) return false;
                    break;
                case FILTER_ACTIONS.EQUALS:
                    if (itemValue !== filter.value) return false;
                    break;
                case FILTER_ACTIONS.INCLUDES_ALL:
                    if (!Array.isArray(filter.value) || !filter.value.every(value => Object.keys(itemValue || {}).includes(value))) return false;
                    break;
                case FILTER_ACTIONS.INCLUDES_ANY:
                    if (!Array.isArray(filter.value) || !filter.value.some(value => Object.keys(itemValue || {}).includes(value))) return false;
                    break;
                case FILTER_ACTIONS.EXCLUDES:
                    if (typeof filter.value === 'string' && Object.keys(itemValue || {}).includes(filter.value)) return false;
                    break;
            }
        }
        return item;
    }).filter(Boolean) as AnimeItem[];
};

export {
    cleanAnimeData,
    cleanExistingJsonFile,
    filterAnimeList
};
