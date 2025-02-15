import { readJsonFile } from "./utils/file";
import {
  FILE_PATHS,
  DISTRIBUTION_RANGES,
  PERCENTILE_FIELDS,
  AnimeField,
} from "./config";
import { AnimeItem } from "./types/anime";
import {
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  YearDistribution,
  TypeDistribution,
  GenreCombination,
} from "./types/statistics";
import {
  getDistribution,
  getFieldCounts,
  getPercentiles,
  getGenreCombinations,
  getTypeDistribution,
  getYearDistribution,
} from "./utils/statistics";

const getAnimeStats = async (
  animeList: AnimeItem[] | null = null
): Promise<AnimeStats> => {
  const data =
    animeList || ((await readJsonFile(FILE_PATHS.cleanedData)) as AnimeItem[]);

  const percentiles: { [key: string]: Percentiles } = {};
  Object.entries(PERCENTILE_FIELDS).forEach(([key, field]) => {
    percentiles[key] = getPercentiles(data, field as AnimeField);
  });

  return {
    totalAnime: data.length,
    scoreDistribution: getDistribution(
      data,
      [...DISTRIBUTION_RANGES.score],
      AnimeField.Score
    ),
    membersDistribution: getDistribution(
      data,
      [...DISTRIBUTION_RANGES.members],
      AnimeField.Members
    ),
    favoritesDistribution: getDistribution(
      data,
      [...DISTRIBUTION_RANGES.favorites],
      AnimeField.Favorites
    ),
    percentiles,
    genreCounts: getFieldCounts(data, AnimeField.Genres),
    themeCounts: getFieldCounts(data, AnimeField.Themes),
    demographicCounts: getFieldCounts(data, AnimeField.Demographics),
    yearDistribution: getYearDistribution(data),
    typeDistribution: getTypeDistribution(data),
    popularGenreCombinations: getGenreCombinations(data),
  };
};

export {
  getAnimeStats,
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  YearDistribution,
  TypeDistribution,
  GenreCombination,
};
