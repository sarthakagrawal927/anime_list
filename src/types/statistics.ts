export interface Distribution {
  range: number;
  count: number;
}

export interface FieldCount {
  name: string;
  count: number;
}

export interface Percentiles {
  p999: number;
  p99: number;
  p95: number;
  p90: number;
  median: number;
  mean: number;
}

export interface YearDistribution {
  year: number;
  count: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
}

export interface GenreCombination {
  pair: string;
  count: number;
}

export interface AnimeStats {
  totalAnime: number;
  scoreDistribution: Distribution[];
  membersDistribution: Distribution[];
  favoritesDistribution: Distribution[];
  percentiles: {
    [key: string]: Percentiles;
  };
  genreCounts: FieldCount[];
  themeCounts: FieldCount[];
  demographicCounts: FieldCount[];
  yearDistribution: YearDistribution[];
  typeDistribution: TypeDistribution[];
  popularGenreCombinations: GenreCombination[];
}
