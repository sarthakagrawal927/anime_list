import { readJsonFile } from "./utils";
import {
  FILE_PATHS,
  DISTRIBUTION_RANGES,
  PERCENTILE_FIELDS,
  AnimeField,
} from "./config";
import { AnimeItem } from "./dataProcessor";

interface Distribution {
  range: number;
  count: number;
}

interface FieldCount {
  name: string;
  count: number;
}

interface Percentiles {
  p999: number;
  p99: number;
  p95: number;
  p90: number;
  median: number;
  mean: number;
}

interface YearDistribution {
  year: number;
  count: number;
}

interface TypeDistribution {
  type: string;
  count: number;
}

interface GenreCombination {
  pair: string;
  count: number;
}

interface AnimeStats {
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

const getDistribution = (
  data: AnimeItem[],
  ranges: number[],
  field: AnimeField
): Distribution[] => {
  const distribution: Distribution[] = ranges.map((range) => ({
    range,
    count: 0,
  }));
  data.forEach((item) => {
    const value = item[field] as number;
    const rangeIndex = ranges.findIndex(
      (range, index) =>
        value >= range &&
        (index === ranges.length - 1 || value < ranges[index + 1])
    );
    if (rangeIndex !== -1) {
      distribution[rangeIndex].count++;
    }
  });
  return distribution;
};

const getFieldCounts = (data: AnimeItem[], field: AnimeField): FieldCount[] => {
  return Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      const values = Object.keys(
        (item[field] as { [key: string]: number }) || {}
      );
      values.forEach((value) => {
        acc[value] = (acc[value] || 0) + 1;
      });
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
};

const getPercentiles = (data: AnimeItem[], field: AnimeField): Percentiles => {
  const validValues = data
    .map((item) => item[field] as number)
    .filter((value): value is number => value !== undefined && value !== null)
    .sort((a, b) => b - a);

  const total = validValues.length;
  return {
    p999: validValues[Math.floor(total * 0.001)],
    p99: validValues[Math.floor(total * 0.01)],
    p95: validValues[Math.floor(total * 0.05)],
    p90: validValues[Math.floor(total * 0.1)],
    median: validValues[Math.floor(total * 0.5)],
    mean: validValues.reduce((sum, val) => sum + val, 0) / total,
  };
};

const getAnimeStats = async (
  animeList: AnimeItem[] | null = null
): Promise<AnimeStats> => {
  const data =
    animeList || ((await readJsonFile(FILE_PATHS.cleanedData)) as AnimeItem[]);

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

    percentiles: Object.entries(PERCENTILE_FIELDS).reduce(
      (acc: { [key: string]: Percentiles }, [key, field]) => {
        acc[key] = getPercentiles(data, field);
        return acc;
      },
      {}
    ),

    genreCounts: getFieldCounts(data, AnimeField.Genres),
    themeCounts: getFieldCounts(data, AnimeField.Themes),
    demographicCounts: getFieldCounts(data, AnimeField.Demographics),

    yearDistribution: Object.entries(
      data.reduce((acc: { [key: string]: number }, item: AnimeItem) => {
        if (item.year) {
          acc[item.year] = (acc[item.year] || 0) + 1;
        }
        return acc;
      }, {})
    )
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ year: parseInt(year), count })),

    typeDistribution: Object.entries(
      data.reduce((acc: { [key: string]: number }, item: AnimeItem) => {
        if (item.type) {
          acc[item.type] = (acc[item.type] || 0) + 1;
        }
        return acc;
      }, {})
    ).map(([type, count]) => ({ type, count })),

    popularGenreCombinations: Object.entries(
      data.reduce((acc: { [key: string]: number }, item: AnimeItem) => {
        const genres = Object.keys(item.genres || {}).sort();
        if (genres.length >= 2) {
          for (let i = 0; i < genres.length - 1; i++) {
            for (let j = i + 1; j < genres.length; j++) {
              const pair = `${genres[i]} + ${genres[j]}`;
              acc[pair] = (acc[pair] || 0) + 1;
            }
          }
        }
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pair, count]) => ({ pair, count })),
  };
};

const printStats = (stats: AnimeStats): void => {
  console.log(stats);
};

export {
  getAnimeStats,
  printStats,
  AnimeStats,
  Distribution,
  FieldCount,
  Percentiles,
  YearDistribution,
  TypeDistribution,
  GenreCombination,
};
