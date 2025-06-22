import { AnimeField } from "../config";
import {
  AnimeItem,
  Filter,
  isNumericField,
  NumericField,
  ScoreMultiplier,
} from "../types/anime";
import {
  Distribution,
  FieldCount,
  Percentiles,
  TypeDistribution,
} from "../types/statistics";

const getNumericValue = (
  item: AnimeItem,
  field: AnimeField
): number | undefined => {
  switch (field) {
    case AnimeField.Score:
      return item.score;
    case AnimeField.ScoredBy:
      return item.scored_by;
    case AnimeField.Rank:
      return item.rank;
    case AnimeField.Popularity:
      return item.popularity;
    case AnimeField.Members:
      return item.members;
    case AnimeField.Favorites:
      return item.favorites;
    case AnimeField.Year:
      return item.year;
    case AnimeField.Episodes:
      return item.episodes;
    default:
      return undefined;
  }
};

const getMapValue = (
  item: AnimeItem,
  field: AnimeField
): { [key: string]: number } => {
  switch (field) {
    case AnimeField.Genres:
      return item.genres || {};
    case AnimeField.Themes:
      return item.themes || {};
    case AnimeField.Demographics:
      return item.demographics || {};
    default:
      return {};
  }
};

const getFieldValue = (
  item: AnimeItem,
  field: AnimeField
): number | { [key: string]: number } | undefined => {
  if (
    field === AnimeField.Score ||
    field === AnimeField.ScoredBy ||
    field === AnimeField.Rank ||
    field === AnimeField.Popularity ||
    field === AnimeField.Members ||
    field === AnimeField.Favorites ||
    field === AnimeField.Year ||
    field === AnimeField.Episodes
  ) {
    return getNumericValue(item, field);
  } else {
    return getMapValue(item, field);
  }
};

export const getDistribution = (
  data: AnimeItem[],
  ranges: readonly number[],
  field: AnimeField
): Distribution[] => {
  const distribution: Distribution[] = [];
  let values = data
    .map((item) => getFieldValue(item, field))
    .filter((value): value is number => value !== undefined && value !== null);

  for (let i = ranges.length - 1; i >= 0; i--) {
    const count = values.filter((value) => value >= ranges[i]).length;
    values = values.filter((value) => value < ranges[i]);
    distribution.push({ range: `${ranges[i]}+`, count });
  }

  distribution.push({ range: `others`, count: values.length });
  return distribution;
};

export const getFieldCounts = (
  animeList: AnimeItem[],
  field: AnimeField
): FieldCount[] => {
  const counts: { [key: string]: number } = {};

  animeList.forEach((anime) => {
    const value = getFieldValue(anime, field);
    if (typeof value === "object" && value !== null) {
      Object.keys(value).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    }
  });

  return Object.entries(counts)
    .map(([field, count]) => ({
      field,
      count,
    }))
    .sort((a, b) => b.count - a.count);
};

export const getPercentiles = (
  data: AnimeItem[],
  field: AnimeField
): Percentiles => {
  const values = data
    .map((item) => getNumericValue(item, field))
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b);

  const getPercentile = (p: number) => {
    const index = Math.floor((p / 100) * values.length);
    return values[index] || 0;
  };

  return {
    p99: getPercentile(99),
    p95: getPercentile(95),
    p90: getPercentile(90),
    median: getPercentile(50),
    mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    top100: values.length ? values.slice(-100)[0] : 0,
    top200: values.length ? values.slice(-200)[0] : 0,
    top500: values.length ? values.slice(-500)[0] : 0,
    top1000: values.length ? values.slice(-1000)[0] : 0,
  };
};

export const getTypeDistribution = (data: AnimeItem[]): TypeDistribution[] => {
  const counts: { [key: string]: number } = {};
  data.forEach((item) => {
    if (item.type) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
  });

  return Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }));
};

const BASE_WEIGHTS: Record<NumericField, number> = {
  [AnimeField.Score]: 1,
  [AnimeField.Members]: 1,
  [AnimeField.Favorites]: 1,
  [AnimeField.Year]: 1,
  [AnimeField.Episodes]: 1,
  [AnimeField.ScoredBy]: 1,
  [AnimeField.Rank]: 1,
  [AnimeField.Popularity]: 1,
} as const;

const normalizeValue = (
  field: NumericField,
  value: number,
  minScore: number,
  maxScore: number
): number => {
  if (value <= 0) return 0;

  switch (field) {
    case AnimeField.Score:
      return Math.max(minScore, Math.min(maxScore, value)); // Already 1-10 scale

    case AnimeField.Members:
    case AnimeField.Favorites: {
      // Log transformation for better distribution
      return (Math.log(value + 1) / Math.log(maxScore + 1)) * 10;
    }

    case AnimeField.Year: {
      const currentYear = new Date().getFullYear();
      // Simple normalization with slight recency bias
      return Math.pow((value - minScore) / (currentYear - minScore), 0.8) * 10;
    }

    default:
      return value;
  }
};

const minMaxOfAnimeList = (data: AnimeItem[], field: NumericField) => {
  const cleanedValues = data
    .map((item) => item[field])
    .filter((v): v is number => v !== undefined && v > 0);
  const min = Math.min(...cleanedValues);
  const max = Math.max(...cleanedValues);
  return { min, max };
};

type FiltersWithScoreRange =
  | (Filter & {
      field: NumericField;
      minScore: number;
      maxScore: number;
    })
  | (Filter & {
      field: Exclude<AnimeField, NumericField>;
    });

// takes roughly 1ms, for 18000 anime, was taking upto 18s which is not ideal
export const getAnimeScore = (
  anime: AnimeItem,
  filters: FiltersWithScoreRange[]
): number => {
  const fieldWiseMultipliers: Map<
    AnimeField,
    ScoreMultiplier<number | string | string[]>
  > = filters.reduce((curr, acc) => {
    if (acc.score_multiplier) {
      curr.set(acc.field, acc.score_multiplier);
    }
    return curr;
  }, new Map());
  const baseScore = filters.reduce(
    (currScore: number, filterVal: FiltersWithScoreRange) => {
      const animeField = filterVal.field;
      const value = anime[animeField];

      if (isNumericField(animeField)) {
        if (typeof value !== "number") return currScore;
        const numericFilter = filterVal as Extract<
          FiltersWithScoreRange,
          { field: NumericField }
        >;
        const normalizedValue = normalizeValue(
          animeField,
          value,
          numericFilter.minScore,
          numericFilter.maxScore
        );
        const baseWeight = BASE_WEIGHTS[animeField] || 1;

        return (
          currScore +
          (1 +
            normalizedValue *
              baseWeight *
              ((fieldWiseMultipliers.get(animeField) as number) || 1))
        );
      }

      switch (animeField) {
        case AnimeField.Genres:
        case AnimeField.Themes: {
          let multiplier = fieldWiseMultipliers.get(animeField);
          let animeInfoForField = getMapValue(anime, animeField);
          if (multiplier) {
            Object.keys(animeInfoForField).forEach((fieldVal) => {
              const multiplierValue = (multiplier as { [key: string]: number })[
                fieldVal
              ];
              if (multiplierValue !== undefined) {
                currScore *= multiplierValue;
              }
            });
          }
          return currScore;
        }

        default:
          return currScore;
      }
    },
    1
  );

  return baseScore;
};

export const getScoreSortedList = (
  animeList: AnimeItem[],
  filters: Filter[],
  sortBy?: NumericField
) => {
  const filtersWithScoreRange: FiltersWithScoreRange[] = filters.map(
    (filter) => {
      if (!isNumericField(filter.field)) return filter as FiltersWithScoreRange;
      const { min, max } = minMaxOfAnimeList(animeList, filter.field);
      return {
        ...filter,
        minScore: min,
        maxScore: max,
      };
    }
  );
  const animeWithScores = animeList.map((anime) => ({
    ...anime,
    points:
      sortBy && typeof anime[sortBy] === "number"
        ? anime[sortBy]
        : getAnimeScore(anime, filtersWithScoreRange),
  }));

  return animeWithScores.sort((a, b) => b.points - a.points);
};
