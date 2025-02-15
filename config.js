const API_CONFIG = {
    baseUrl: 'https://api.jikan.moe/v4',
    endpoints: {
        topAnime: '/top/anime',
        userHistory: '/users'
    },
    rateLimit: 1000,
    totalPages: 700
};

const FILE_PATHS = {
    rawData: 'anime_data.json',
    partialData: 'partial_anime_data.json',
    cleanedData: 'cleaned_anime_data.json'
};

const ANIME_FIELDS = {
    id: 'mal_id',
    url: 'url',
    title: 'title',
    titleEnglish: 'title_english',
    type: 'type',
    episodes: 'episodes',
    aired: 'aired',
    score: 'score',
    scoredBy: 'scored_by',
    rank: 'rank',
    popularity: 'popularity',
    members: 'members',
    favorites: 'favorites',
    year: 'year',
    season: 'season',
    synopsis: 'synopsis',
    genres: 'genres',
    themes: 'themes',
    demographics: 'demographics'
};

const GENRE_FIELDS = [
    ANIME_FIELDS.genres,
    ANIME_FIELDS.themes,
    ANIME_FIELDS.demographics
];

const SERVER_CONFIG = {
    port: 3000,
    routes: {
        base: '/api',
        stats: '/stats',
        filter: '/stats/filter',
        fetch: '/fetch',
        filters: '/filters'
    }
};

const ERROR_MESSAGES = {
    fetchFailed: 'Failed to fetch anime stats',
    filterFailed: 'Failed to apply filters and get stats',
    invalidFilters: 'Filters must be an array',
    serverError: 'Something broke!',
    fetchError: 'Error in fetch process',
    filterError: 'Error in filter process',
    noDataFound: 'No anime data found. Please run the fetch process first.'
};

const SUCCESS_MESSAGES = {
    fetchStarted: 'Fetch process started',
    fetchCompleted: 'Completed! Data saved',
    cleaningCompleted: 'Data cleaning completed!'
};

const LOG_MESSAGES = {
    serverStart: 'Anime stats server running at http://localhost:',
    availableEndpoints: 'Available endpoints:',
    endpoints: {
        stats: '- GET  /api/stats         - Get all anime statistics',
        filter: '- POST /api/stats/filter  - Get filtered anime statistics',
        fetch: '- POST /api/fetch         - Fetch new anime data',
        filters: '- GET  /api/filters       - Get available filter options'
    }
};

const DISTRIBUTION_RANGES = {
    score: [4, 5, 6, 7, 8, 9],
    members: [100, 1000, 10000, 100000, 1000000],
    favorites: [0, 1, 10, 100, 1000, 10000, 100000]
};

const PERCENTILE_FIELDS = {
    score: ANIME_FIELDS.score,
    members: ANIME_FIELDS.members,
    favorites: ANIME_FIELDS.favorites,
    rank: ANIME_FIELDS.rank,
    popularity: ANIME_FIELDS.popularity
};

module.exports = {
    API_CONFIG,
    FILE_PATHS,
    ANIME_FIELDS,
    GENRE_FIELDS,
    SERVER_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOG_MESSAGES,
    DISTRIBUTION_RANGES,
    PERCENTILE_FIELDS
};
