export enum AnimeField {
  MalId = "mal_id",
  Url = "url",
  Title = "title",
  TitleEnglish = "title_english",
  Type = "type",
  Episodes = "episodes",
  Aired = "aired",
  Score = "score",
  ScoredBy = "scored_by",
  Rank = "rank",
  Popularity = "popularity",
  Members = "members",
  Favorites = "favorites",
  Year = "year",
  Season = "season",
  Synopsis = "synopsis",
  Genres = "genres",
  Themes = "themes",
  Demographics = "demographics"
}

export enum FilterAction {
  Equals = "EQUALS",
  GreaterThan = "GREATER_THAN",
  GreaterThanOrEquals = "GREATER_THAN_OR_EQUALS",
  LessThan = "LESS_THAN",
  LessThanOrEquals = "LESS_THAN_OR_EQUALS",
  IncludesAll = "INCLUDES_ALL",
  IncludesAny = "INCLUDES_ANY",
  Excludes = "EXCLUDES"
}

export const API_CONFIG = {
    baseUrl: 'https://api.jikan.moe/v4',
    endpoints: {
        topAnime: '/top/anime',
        userHistory: '/users'
    },
    rateLimit: 1000,
    totalPages: 700
} as const;

export const FILE_PATHS = {
    rawData: 'anime_data.json',
    partialData: 'partial_anime_data.json',
    cleanedData: 'cleaned_anime_data.json'
} as const;

export const GENRE_FIELDS = [
    AnimeField.Genres,
    AnimeField.Themes,
    AnimeField.Demographics
] as const;

export const SERVER_CONFIG = {
    port: 3000,
    routes: {
        base: '/api',
        stats: '/stats',
        filter: '/stats/filter',
        fetch: '/fetch',
        filters: '/filters'
    }
} as const;

export const ERROR_MESSAGES = {
    fetchFailed: 'Failed to fetch anime stats',
    filterFailed: 'Failed to apply filters and get stats',
    invalidFilters: 'Filters must be an array',
    serverError: 'Something broke!',
    fetchError: 'Error in fetch process',
    filterError: 'Error in filter process',
    noDataFound: 'No anime data found. Please run the fetch process first.'
} as const;

export const SUCCESS_MESSAGES = {
    fetchStarted: 'Fetch process started',
    fetchCompleted: 'Completed! Data saved',
    cleaningCompleted: 'Data cleaning completed!'
} as const;

export const LOG_MESSAGES = {
    serverStart: 'Anime stats server running at http://localhost:',
    availableEndpoints: 'Available endpoints:',
    endpoints: {
        stats: '- GET  /api/stats         - Get all anime statistics',
        filter: '- POST /api/stats/filter  - Get filtered anime statistics',
        fetch: '- POST /api/fetch         - Fetch new anime data',
        filters: '- GET  /api/filters       - Get available filter options'
    }
} as const;

export const DISTRIBUTION_RANGES = {
    score: [4, 5, 6, 7, 8, 9],
    members: [100, 1000, 10000, 100000, 1000000],
    favorites: [0, 1, 10, 100, 1000, 10000, 100000]
} as const;

export const PERCENTILE_FIELDS = {
    score: AnimeField.Score,
    members: AnimeField.Members,
    favorites: AnimeField.Favorites,
    rank: AnimeField.Rank,
    popularity: AnimeField.Popularity
} as const;

// Export types
export type AnimeFieldType = typeof AnimeField;
export type GenreField = typeof GENRE_FIELDS[number];
