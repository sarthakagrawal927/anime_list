import { readJsonFile } from "./file";
import { FILE_PATHS, AnimeField } from "../config";
import { AnimeItem } from "../types/anime";
import {
  AnimeStats,
  Distribution,
  FieldCount,
  YearDistribution,
  TypeDistribution,
  GenreCombination,
  Percentiles,
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

const getMapValue = (item: AnimeItem, field: AnimeField): { [key: string]: number } => {
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
  const values = data
    .map((item) => getFieldValue(item, field))
    .filter((value): value is number => value !== undefined);

  for (let i = 0; i < ranges.length - 1; i++) {
    const count = values.filter(
      (value) => value >= ranges[i] && value < ranges[i + 1]
    ).length;
    distribution.push({ range: ranges[i], count });
  }

  return distribution;
};

export const getFieldCounts = (
  animeList: AnimeItem[],
  field: AnimeField
): FieldCount[] => {
  const counts: { [key: string]: number } = {};

  animeList.forEach((anime) => {
    const value = getFieldValue(anime, field);
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
      });
    }
  });

  return Object.entries(counts).map(([field, count]) => ({
    field,
    count,
  }));
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
    p999: getPercentile(99.9),
    p99: getPercentile(99),
    p95: getPercentile(95),
    p90: getPercentile(90),
    median: getPercentile(50),
    mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  };
};

export const getYearDistribution = (data: AnimeItem[]): YearDistribution[] => {
  const counts: Record<number, number> = {};
  data.forEach((item) => {
    if (item.year) {
      counts[item.year] = (counts[item.year] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({
      year: Number(year),
      count,
    }));
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

export const getGenreCombinations = (
  data: AnimeItem[],
  limit: number = 20
): GenreCombination[] => {
  const counts: { [key: string]: number } = {};
  data.forEach((item) => {
    const genres = item.genres;
    if (genres) {
      const genreNames = Object.keys(genres).sort();
      for (let i = 0; i < genreNames.length - 1; i++) {
        for (let j = i + 1; j < genreNames.length; j++) {
          const pair = `${genreNames[i]} + ${genreNames[j]}`;
          counts[pair] = (counts[pair] || 0) + 1;
        }
      }
    }
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([pair, count]) => ({ pair, count }));
};
