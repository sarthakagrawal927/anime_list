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

type NumericValue = number | undefined;
type MapValue = { [key: string]: number } | undefined;

const getNumericValue = (item: AnimeItem, field: AnimeField): NumericValue => {
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

const getMapValue = (item: AnimeItem, field: AnimeField): MapValue => {
  switch (field) {
    case AnimeField.Genres:
      return item.genres;
    case AnimeField.Themes:
      return item.themes;
    case AnimeField.Demographics:
      return item.demographics;
    default:
      return undefined;
  }
};

export const getDistribution = (
  data: AnimeItem[],
  ranges: number[],
  field: AnimeField
): Distribution[] => {
  const distribution = ranges.map((range) => ({ range, count: 0 }));
  data.forEach((item) => {
    const value = getNumericValue(item, field);
    if (value !== undefined) {
      const idx = ranges.findIndex(
        (r, i) =>
          value >= r && (i === ranges.length - 1 || value < ranges[i + 1])
      );
      if (idx !== -1) distribution[idx].count++;
    }
  });
  return distribution;
};

export const getFieldCounts = (
  data: AnimeItem[],
  field: AnimeField
): FieldCount[] => {
  const counts: { [key: string]: number } = {};
  data.forEach((item) => {
    const value = getMapValue(item, field);
    if (value)
      Object.keys(value).forEach(
        (key) => (counts[key] = (counts[key] || 0) + 1)
      );
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));
};

export const getPercentiles = (
  data: AnimeItem[],
  field: AnimeField
): Percentiles => {
  const values = data
    .map((item) => getNumericValue(item, field))
    .filter((n): n is number => n !== undefined)
    .sort((a, b) => b - a);

  if (!values.length) {
    return {
      p999: 0,
      p99: 0,
      p95: 0,
      p90: 0,
      median: 0,
      mean: 0,
    };
  }

  return {
    p999: values[Math.floor(values.length * 0.001)] || 0,
    p99: values[Math.floor(values.length * 0.01)] || 0,
    p95: values[Math.floor(values.length * 0.05)] || 0,
    p90: values[Math.floor(values.length * 0.1)] || 0,
    median: values[Math.floor(values.length * 0.5)] || 0,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  };
};

export const getYearDistribution = (data: AnimeItem[]): YearDistribution[] => {
  const counts: { [key: number]: number } = {};
  data.forEach((item) => {
    if (item.year) counts[item.year] = (counts[item.year] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: Number(year), count }));
};

export const getTypeDistribution = (data: AnimeItem[]): TypeDistribution[] => {
  const counts: { [key: string]: number } = {};
  data.forEach((item) => {
    if (item.type) counts[item.type] = (counts[item.type] || 0) + 1;
  });
  return Object.entries(counts).map(([type, count]) => ({ type, count }));
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
