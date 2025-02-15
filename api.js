const { default: axios } = require("axios");
const { delay, writeJsonFile } = require('./utils');
const { API_CONFIG, FILE_PATHS, SUCCESS_MESSAGES } = require('./config');

const fetchFromApi = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error.message);
        return null;
    }
};

const fetchAnimePage = async (pagenum) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.topAnime}?page=${pagenum}`;
    return fetchFromApi(url);
};

const fetchUserHistory = async (username) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.userHistory}/${username}/history?type=anime`;
    return fetchFromApi(url);
};

const fetchAllAnimePages = async () => {
    const allData = [];
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

module.exports = {
    fetchFromApi,
    fetchAnimePage,
    fetchUserHistory,
    fetchAllAnimePages
};
