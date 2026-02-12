export interface AnimeSummary {
  id: number;
  score: number;
  points: number;
  name: string;
  link: string;
  synopsis: string;
  members: number;
  favorites: number;
  year: number;
  status: string;
  genres: string[];
  themes: string[];
  type: string;
  image?: string;
}

export interface SearchResponse {
  totalFiltered: number;
  filteredList: AnimeSummary[];
  stats: AnimeStats;
}

export interface FieldOptions {
  numeric: string[];
  array: string[];
  string: string[];
}

export interface FilterActions {
  comparison: string[];
  array: string[];
}

export interface Distribution {
  range: string;
  count: number;
}

export interface FieldCount {
  field: string;
  count: number;
}

export interface Percentiles {
  p99: number;
  p95: number;
  p90: number;
  p75: number;
  median: number;
  mean: number;
  top100: number;
  top200: number;
  top500: number;
  top1000: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
}

export interface AnimeStats {
  totalAnime: number;
  scoreDistribution: Distribution[];
  membersDistribution: Distribution[];
  favoritesDistribution: Distribution[];
  yearDistribution: Distribution[];
  percentiles: Record<string, Percentiles>;
  genreCounts: FieldCount[];
  themeCounts: FieldCount[];
  demographicCounts: FieldCount[];
  typeDistribution: TypeDistribution[];
}

export interface SearchFilter {
  field: string;
  action: string;
  value: string | number | string[];
  score_multiplier?: number | Record<string, number>;
}

export interface WatchedAnime {
  status: string;
  id: string;
  [key: string]: string | number;
}

export interface WatchlistData {
  user: { id: string; name: string };
  anime: Record<string, WatchedAnime>;
}

export interface EnrichedWatchlistItem {
  mal_id: string;
  watchStatus: string;
  title: string;
  image?: string;
  score?: number;
  year?: number;
  type?: string;
  episodes?: number;
  members?: number;
  genres: string[];
  synopsis?: string;
  url?: string;
}

export interface EnrichedWatchlistResponse {
  items: EnrichedWatchlistItem[];
}
