const { default: axios } = require("axios");
const fs = require('fs').promises;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchFromApi = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error.message);
        return null;
    }
}

const fetchAnimePage = async (pagenum) => {
    const url = `https://api.jikan.moe/v4/top/anime?page=${pagenum}`;
    return fetchFromApi(url);
}

// Not very useful
// https://docs.google.com/document/d/1-6H-agSnqa8Mfmw802UYfGQrceIEnAaEh4uCXAPiX5A/edit?tab=t.0#heading=h.iv72kmlfzsix
const fetchUserDetails = async (username) => {
    const url = `https://api.jikan.moe/v4/users/${username}/history?type=anime`;
    return fetchFromApi(url);
}

const fetchAllAnimePages = async () => {
    const allData = [];
    const totalPages = 700;

    console.log('Starting to fetch anime data...');

    for (let page = 1; page <= totalPages; page++) {
        console.log(`Fetching page ${page}/${totalPages}...`);
        const pageData = await fetchAnimePage(page);

        if (pageData) {
            allData.push(...pageData.data);
            // Save progress every 10 pages
            if (page % 10 === 0) {
                await fs.writeFile('partial_anime_data.json', JSON.stringify(allData, null, 2));
                console.log(`Progress saved at page ${page}`);
            }
        }

        // Rate limiting: Wait 1 second between requests to respect API limits
        await delay(1000);
    }

    // Save final data
    await fs.writeFile('anime_data.json', JSON.stringify(allData, null, 2));
    console.log('Completed! Data saved to anime_data.json');
    return allData;
}

const cleanAnimeData = (animeData) => {
    const keepFields = [
        'mal_id',
        'url',
        'title',
        'title_english',
        'type',
        'episodes',
        'aired',
        'score',
        'scored_by',
        'rank',
        'popularity',
        'members',
        'favorites',
        'year',
        'season',
        'synopsis',
        'genres',
        'themes',
        'demographics'
    ];

    const processGenres = (item) => {
        const genreFields = ['genres', 'themes', 'demographics'];

        genreFields.forEach(field => {
            if (item[field]) {
                item[field] = (item[field].map(entry => entry.name)).reduce((acc, curr) => {
                    acc[curr] = 1;
                    return acc;
                }, {});
            }
        });
        return item;
    };

    if (Array.isArray(animeData)) {
        return animeData.map(anime => {
            const cleanedAnime = {};
            keepFields.forEach(field => {
                if (anime[field] !== undefined) {
                    cleanedAnime[field] = anime[field];
                }
            });
            return processGenres(cleanedAnime);
        });
    } else {
        const cleanedAnime = {};
        keepFields.forEach(field => {
            if (animeData[field] !== undefined) {
                cleanedAnime[field] = animeData[field];
            }
        });
        return processGenres(cleanedAnime);
    }
};

const getAnimeData = async (filename = 'cleaned_anime_data.json') => {
    try {
        const animeData = await fs.readFile(filename, 'utf8');
        return JSON.parse(animeData);
    } catch (error) {
        console.error(error);
    }
}

const cleanExistingJsonFile = async () => {
    try {
        console.log('Reading anime_data.json...');
        const animeData = await getAnimeData('anime_data.json');

        console.log('Cleaning data...');
        const cleanedData = cleanAnimeData(animeData);

        console.log('Writing cleaned data to cleaned_anime_data.json...');
        await fs.writeFile('cleaned_anime_data.json', JSON.stringify(cleanedData, null, 2));
        console.log('Data cleaning completed! Cleaned data saved to cleaned_anime_data.json');

        // Log some statistics
        console.log(`\nStatistics:`);
        console.log(`Total entries: ${cleanedData.length}`);
        const totalSize = Buffer.byteLength(JSON.stringify(cleanedData));
        console.log(`File size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
        console.error('Error during cleaning:', error);
    }
};

async function getAnimeStats(animeList) {
    animeList = animeList || await getAnimeData('cleaned_anime_data.json');

    // Helper function to calculate distribution in ranges
    const getDistribution = (data, ranges, field) => {
        const distribution = ranges.map(range => ({ range, count: 0 }));
        data.forEach(item => {
            const value = item[field];
            const rangeIndex = ranges.findIndex((range, index) => 
                value >= range && (index === ranges.length - 1 || value < ranges[index + 1])
            );
            if (rangeIndex !== -1) {
                distribution[rangeIndex].count++;
            }
        });
        return distribution;
    };

    // Helper function to count field occurrences
    const getFieldCounts = (data, field) => {
        return Object.entries(data.reduce((acc, item) => {
            const values = Object.keys(item[field] || {});
            values.forEach(value => {
                acc[value] = (acc[value] || 0) + 1;
            });
            return acc;
        }, {}))
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));
    };

    // Helper function to calculate percentiles
    const getPercentiles = (data, field) => {
        const validValues = data
            .map(item => item[field])
            .filter(value => value !== undefined && value !== null)
            .sort((a, b) => b - a);

        const total = validValues.length;
        const percentiles = {
            p999: validValues[Math.floor(total * 0.001)],
            p99: validValues[Math.floor(total * 0.01)],
            p95: validValues[Math.floor(total * 0.05)],
            p90: validValues[Math.floor(total * 0.1)],
            median: validValues[Math.floor(total * 0.5)],
            mean: validValues.reduce((sum, val) => sum + val, 0) / total
        };
        return percentiles;
    };

    // Calculate basic statistics
    const stats = {
        totalAnime: animeList.length,

        // Score distribution (0-10 in steps of 1)
        scoreDistribution: getDistribution(
            animeList,
            [4,5,6, 7, 8, 9],
            'score'
        ),

        // Members distribution in logarithmic ranges
        membersDistribution: getDistribution(
            animeList,
            [100, 1000, 10000, 100000, 1000000],
            'members'
        ),

        // Favorites distribution in logarithmic ranges
        favoritesDistribution: getDistribution(
            animeList,
            [0, 1, 10, 100, 1000, 10000, 100000],
            'favorites'
        ),

        // Percentile distributions for key metrics
        percentiles: {
            score: getPercentiles(animeList, 'score'),
            members: getPercentiles(animeList, 'members'),
            favorites: getPercentiles(animeList, 'favorites'),
            rank: getPercentiles(animeList, 'rank'),
            popularity: getPercentiles(animeList, 'popularity')
        },

        // Genre, theme
        genreCounts: getFieldCounts(animeList, 'genres'),
        themeCounts: getFieldCounts(animeList, 'themes'),
        demographicCounts: getFieldCounts(animeList, 'demographics'),

        // Year distribution
        yearDistribution: Object.entries(animeList.reduce((acc, item) => {
            if (item.year) {
                acc[item.year] = (acc[item.year] || 0) + 1;
            }
            return acc;
        }, {}))
        .sort((a, b) => a[0] - b[0])
        .map(([year, count]) => ({ year: parseInt(year), count })),

        // Type distribution
        typeDistribution: Object.entries(animeList.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {}))
        .map(([type, count]) => ({ type, count })),

        // Most popular combinations of genres (top 20)
        popularGenreCombinations: Object.entries(animeList.reduce((acc, item) => {
            const genres = Object.keys(item.genres || {}).sort();
            if (genres.length >= 2) {
                for (let i = 0; i < genres.length - 1; i++) {
                    for (let j = i + 1; j < genres.length; j++) {
                        const pair = `${genres[i]} + ${genres[j]}`;
                        acc[pair] = (acc[pair] || 0) + 1;
                    }
                }
            }
            return acc;
        }, {}))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([pair, count]) => ({ pair, count }))
    };

    return stats;
}


const ACTIONS = {
    GREATER_THAN: 'GREATER_THAN',
    GREATER_THAN_OR_EQUALS: 'GREATER_THAN_OR_EQUALS',
    LESS_THAN: 'LESS_THAN',
    LESS_THAN_OR_EQUALS: 'LESS_THAN_OR_EQUALS',
    EQUALS: 'EQUALS',
    INCLUDES_ALL: 'INCLUDES_ALL',
    INCLUDES_ANY: 'INCLUDES_ANY',
    EXCLUDES: 'EXCLUDES'
}

/**
 * @param {*} filterList  []{
 *  field, value, action
 * }
 */
async function filterList(filterList) {
    const animeData = await getAnimeData();

    return animeData.map(item => {
        for (const filter of filterList) {
            switch (filter.action) {
                case ACTIONS.GREATER_THAN:
                    if (item[filter.field] <= filter.value) return false;
                    break;
                case ACTIONS.GREATER_THAN_OR_EQUALS:
                    if (item[filter.field] < filter.value) return false;
                    break;
                case ACTIONS.LESS_THAN:
                    if (item[filter.field] >= filter.value) return false;
                    break;
                case ACTIONS.LESS_THAN_OR_EQUALS:
                    if (item[filter.field] > filter.value) return false;
                    break;
                case ACTIONS.EQUALS:
                    if (item[filter.field] !== filter.value) return false;
                    break;
                case ACTIONS.INCLUDES_ALL:
                    if (!filter.value.every(value => Object.keys(item[filter.field]).includes(value))) return false;
                    break;
                case ACTIONS.INCLUDES_ANY:
                    if (!filter.value.some(value => Object.keys(item[filter.field]).includes(value))) return false;
                    break;
                case ACTIONS.EXCLUDES:
                    if (Object.keys(item[filter.field]).includes(filter.value)) return false;
                    break;
            }
        }
        return item;
    }).filter(Boolean);
}

// Run the fetch operation
// (async () => {
//     try {
//         await fetchAllAnimePages();
//         cleanExistingJsonFile();
//     } catch (error) {
//         console.error('Fatal error:', error);
//     }
// })();

// Run the stats analysis
(async () => {
    const filteredList = await filterList([
        { field: 'year', value: 2020, action: ACTIONS.GREATER_THAN_OR_EQUALS },
        // { field: 'rank', value: 3000, action: ACTIONS.LESS_THAN_OR_EQUALS },
        // { field: 'popularity', value: 3000, action: ACTIONS.LESS_THAN_OR_EQUALS },
        { field: 'score', value: 7, action: ACTIONS.GREATER_THAN_OR_EQUALS },
        { field: 'members', value: 100000, action: ACTIONS.GREATER_THAN_OR_EQUALS },
        { field: 'genres', value: ['Action', 'Adventure', 'Fantasy'], action: ACTIONS.INCLUDES_ALL },
        { field: 'type', value: 'TV', action: ACTIONS.EQUALS }
    ])
    const stats = await getAnimeStats(filteredList);
    console.log(filteredList, stats);
})();
