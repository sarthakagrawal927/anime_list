import {
  AnimeField,
  DISTRIBUTION_RANGES,
  FILE_PATHS,
  PERCENTILE_FIELDS,
} from "./config";
import { AnimeItem } from "./types/anime";
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
    ((await readJsonFile(FILE_PATHS.cleanAnimeData)) as AnimeItem[]);

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

export type {
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  TypeDistribution,
};
