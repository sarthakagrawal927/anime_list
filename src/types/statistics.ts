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
  percentiles: {
    [key: string]: Percentiles;
  };
  genreCounts: FieldCount[];
  themeCounts: FieldCount[];
  demographicCounts: FieldCount[];
  yearDistribution: Distribution[];
  typeDistribution: TypeDistribution[];
}
