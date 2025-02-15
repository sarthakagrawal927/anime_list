export interface AnimeData {
    mal_id: number;
    url: string;
    title: string;
    title_english: string | null;
    type: string;
    episodes: number | null;
    aired: {
        from: string | null;
        to: string | null;
    };
    score: number;
    scored_by: number;
    rank: number;
    popularity: number;
    members: number;
    favorites: number;
    year: number | null;
    season: string | null;
    synopsis: string | null;
    genres: { [key: string]: number };
    themes: { [key: string]: number };
    demographics: { [key: string]: number };
}

export interface Filter {
    field: string;
    value: number | string | string[];
    action: string;
}

export interface Distribution {
    range: number;
    count: number;
}

export interface Percentiles {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
}

export interface AnimeStats {
    totalAnime: number;
    scoreDistribution: Distribution[];
    membersDistribution: Distribution[];
    favoritesDistribution: Distribution[];
    percentiles: {
        score: Percentiles;
        members: Percentiles;
        favorites: Percentiles;
        rank: Percentiles;
        popularity: Percentiles;
    };
    genreCounts: { [key: string]: number };
    themeCounts: { [key: string]: number };
    demographicCounts: { [key: string]: number };
    yearDistribution: { [key: string]: number };
}
