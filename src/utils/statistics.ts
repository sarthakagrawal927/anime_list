import { AnimeField } from "../config";
import { AnimeItem } from "../types/anime";
import { Distribution, FieldCount, Percentiles } from "../types/statistics";

const getFieldValue = (anime: AnimeItem, field: AnimeField): unknown => {
  switch (field) {
    case AnimeField.MalId:
      return anime.mal_id;
    case AnimeField.Url:
      return anime.url;
    case AnimeField.Title:
      return anime.title;
    case AnimeField.TitleEnglish:
      return anime.title_english;
    case AnimeField.Type:
      return anime.type;
    case AnimeField.Episodes:
      return anime.episodes;
    case AnimeField.Aired:
      return anime.aired;
    case AnimeField.Score:
      return anime.score;
    case AnimeField.ScoredBy:
      return anime.scored_by;
    case AnimeField.Rank:
      return anime.rank;
    case AnimeField.Popularity:
      return anime.popularity;
    case AnimeField.Members:
      return anime.members;
    case AnimeField.Favorites:
      return anime.favorites;
    case AnimeField.Synopsis:
      return anime.synopsis;
    case AnimeField.Year:
      return anime.year;
    case AnimeField.Season:
      return anime.season;
    case AnimeField.Genres:
      return anime.genres;
    case AnimeField.Themes:
      return anime.themes;
    case AnimeField.Demographics:
      return anime.demographics;
    default:
      return undefined;
  }
};

export const getDistribution = (
  data: AnimeItem[],
  ranges: number[],
  field: AnimeField
): Distribution[] => {
  const distribution: Distribution[] = ranges.map((range) => ({
    range,
    count: 0,
  }));
  
  data.forEach((item) => {
    const value = getFieldValue(item, field);
    if (typeof value === 'number') {
      const rangeIndex = ranges.findIndex(
        (range, index) =>
          value >= range && (index === ranges.length - 1 || value < ranges[index + 1])
      );
      if (rangeIndex !== -1) {
        distribution[rangeIndex].count++;
      }
    }
  });
  
  return distribution;
};

export const getFieldCounts = (data: AnimeItem[], field: AnimeField): FieldCount[] => {
  return Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      const value = getFieldValue(item, field);
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach((key) => {
          acc[key] = (acc[key] || 0) + 1;
        });
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
};

export const getPercentiles = (data: AnimeItem[], field: AnimeField): Percentiles => {
  const validValues = data
    .map((item) => getFieldValue(item, field))
    .filter((value): value is number => 
      typeof value === 'number' && !isNaN(value)
    )
    .sort((a, b) => b - a);

  const total = validValues.length;
  if (total === 0) {
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
    p999: validValues[Math.floor(total * 0.001)] || 0,
    p99: validValues[Math.floor(total * 0.01)] || 0,
    p95: validValues[Math.floor(total * 0.05)] || 0,
    p90: validValues[Math.floor(total * 0.1)] || 0,
    median: validValues[Math.floor(total * 0.5)] || 0,
    mean: validValues.reduce((sum, val) => sum + val, 0) / total,
  };
};

export const getGenreCombinations = (data: AnimeItem[], limit: number = 20) => {
  return Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      const genres = getFieldValue(item, AnimeField.Genres) as { [key: string]: number } | undefined;
      if (typeof genres === 'object' && genres !== null) {
        const genreNames = Object.keys(genres).sort();
        if (genreNames.length >= 2) {
          for (let i = 0; i < genreNames.length - 1; i++) {
            for (let j = i + 1; j < genreNames.length; j++) {
              const pair = `${genreNames[i]} + ${genreNames[j]}`;
              acc[pair] = (acc[pair] || 0) + 1;
            }
          }
        }
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pair, count]) => ({ pair, count }));
};

export const getTypeDistribution = (data: AnimeItem[]) => {
  return Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      const type = getFieldValue(item, AnimeField.Type);
      if (typeof type === 'string') {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));
};

export const getYearDistribution = (data: AnimeItem[]) => {
  return Object.entries(
    data.reduce((acc: { [key: string]: number }, item) => {
      const year = getFieldValue(item, AnimeField.Year);
      if (typeof year === 'number') {
        acc[year.toString()] = (acc[year.toString()] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: parseInt(year), count }));
};
