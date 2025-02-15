const { readJsonFile, writeJsonFile, FILTER_ACTIONS } = require('./utils');
const { 
    ANIME_FIELDS, 
    GENRE_FIELDS, 
    FILE_PATHS,
    SUCCESS_MESSAGES,
    ERROR_MESSAGES 
} = require('./config');

const processGenres = (item) => {
    GENRE_FIELDS.forEach(field => {
        if (item[field]) {
            item[field] = (item[field].map(entry => entry.name)).reduce((acc, curr) => {
                acc[curr] = 1;
                return acc;
            }, {});
        }
    });
    return item;
};

const cleanAnimeData = (animeData) => {
    if (Array.isArray(animeData)) {
        return animeData.map(anime => {
            const cleanedAnime = {};
            Object.values(ANIME_FIELDS).forEach(field => {
                if (anime[field] !== undefined) {
                    cleanedAnime[field] = anime[field];
                }
            });
            return processGenres(cleanedAnime);
        });
    } else {
        const cleanedAnime = {};
        Object.values(ANIME_FIELDS).forEach(field => {
            if (animeData[field] !== undefined) {
                cleanedAnime[field] = animeData[field];
            }
        });
        return processGenres(cleanedAnime);
    }
};

const cleanExistingJsonFile = async () => {
    try {
        console.log(`Reading ${FILE_PATHS.rawData}...`);
        const animeData = await readJsonFile(FILE_PATHS.rawData);

        console.log('Cleaning data...');
        const cleanedData = cleanAnimeData(animeData);

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

const filterAnimeList = async (filterList, animeData = null) => {
    const data = animeData || await readJsonFile(FILE_PATHS.cleanedData);
    if (!data) {
        throw new Error(ERROR_MESSAGES.noDataFound);
    }
    
    return data.map(item => {
        for (const filter of filterList) {
            switch (filter.action) {
                case FILTER_ACTIONS.GREATER_THAN:
                    if (item[filter.field] <= filter.value) return false;
                    break;
                case FILTER_ACTIONS.GREATER_THAN_OR_EQUALS:
                    if (item[filter.field] < filter.value) return false;
                    break;
                case FILTER_ACTIONS.LESS_THAN:
                    if (item[filter.field] >= filter.value) return false;
                    break;
                case FILTER_ACTIONS.LESS_THAN_OR_EQUALS:
                    if (item[filter.field] > filter.value) return false;
                    break;
                case FILTER_ACTIONS.EQUALS:
                    if (item[filter.field] !== filter.value) return false;
                    break;
                case FILTER_ACTIONS.INCLUDES_ALL:
                    if (!filter.value.every(value => Object.keys(item[filter.field] || {}).includes(value))) return false;
                    break;
                case FILTER_ACTIONS.INCLUDES_ANY:
                    if (!filter.value.some(value => Object.keys(item[filter.field] || {}).includes(value))) return false;
                    break;
                case FILTER_ACTIONS.EXCLUDES:
                    if (Object.keys(item[filter.field] || {}).includes(filter.value)) return false;
                    break;
            }
        }
        return item;
    }).filter(Boolean);
};

module.exports = {
    cleanAnimeData,
    cleanExistingJsonFile,
    filterAnimeList
};
