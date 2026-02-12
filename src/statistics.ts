import {
  AnimeField,
  DISTRIBUTION_RANGES,
  FILE_PATHS,
  PERCENTILE_FIELDS,
} from "./config";
import { AnimeItem } from "./types/anime";
import { MangaItem, MangaField } from "./types/manga";
import {
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  TypeDistribution,
} from "./types/statistics";
import { readJsonFile } from "./utils/file";
import {
  getDistribution,
  getFieldCounts,
  getPercentiles,
  getTypeDistribution,
} from "./utils/statistics";

export const getAnimeStats = async (
  animeList: AnimeItem[] | null = null
): Promise<AnimeStats> => {
  const data =
    animeList ||
    ((await readJsonFile(FILE_PATHS.cleanAnimeData)) as AnimeItem[]) ||
    [];

  const percentiles: Record<string, Percentiles> = {};
  Object.entries(PERCENTILE_FIELDS).forEach(([key, field]) => {
    percentiles[key] = getPercentiles(data, field);
  });

  const distributions = {
    score: getDistribution(data, DISTRIBUTION_RANGES.score, AnimeField.Score),
    members: getDistribution(
      data,
      DISTRIBUTION_RANGES.members,
      AnimeField.Members
    ),
    favorites: getDistribution(
      data,
      DISTRIBUTION_RANGES.favorites,
      AnimeField.Favorites
    ),
    yearDistribution: getDistribution(
      data,
      DISTRIBUTION_RANGES.years,
      AnimeField.Year
    ),
  };

  return {
    totalAnime: data.length,
    scoreDistribution: distributions.score,
    membersDistribution: distributions.members,
    favoritesDistribution: distributions.favorites,
    yearDistribution: distributions.yearDistribution,
    percentiles,
    genreCounts: getFieldCounts(data, AnimeField.Genres),
    themeCounts: getFieldCounts(data, AnimeField.Themes),
    demographicCounts: getFieldCounts(data, AnimeField.Demographics),
    typeDistribution: getTypeDistribution(data),
  };
};

export const getMangaStats = async (
  mangaList: MangaItem[] | null = null
): Promise<AnimeStats> => {
  const data =
    mangaList ||
    ((await readJsonFile(FILE_PATHS.cleanMangaData)) as MangaItem[]) ||
    [];

  const percentiles: Record<string, Percentiles> = {};
  Object.entries(PERCENTILE_FIELDS).forEach(([key, field]) => {
    percentiles[key] = getPercentiles(data, field as any);
  });

  const distributions = {
    score: getDistribution(data, DISTRIBUTION_RANGES.score, MangaField.Score as any),
    members: getDistribution(
      data,
      DISTRIBUTION_RANGES.members,
      MangaField.Members as any
    ),
    favorites: getDistribution(
      data,
      DISTRIBUTION_RANGES.favorites,
      MangaField.Favorites as any
    ),
    yearDistribution: getDistribution(
      data,
      DISTRIBUTION_RANGES.years,
      MangaField.Year as any
    ),
  };

  return {
    totalAnime: data.length,
    scoreDistribution: distributions.score,
    membersDistribution: distributions.members,
    favoritesDistribution: distributions.favorites,
    yearDistribution: distributions.yearDistribution,
    percentiles,
    genreCounts: getFieldCounts(data as any, MangaField.Genres as any),
    themeCounts: getFieldCounts(data as any, MangaField.Themes as any),
    demographicCounts: getFieldCounts(data as any, MangaField.Demographics as any),
    typeDistribution: getTypeDistribution(data as any),
  };
};

export type {
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  TypeDistribution,
};
