import { parseUserXMLFile, readJsonFile, writeJsonFile } from "./utils/file";
import { FILE_PATHS, AnimeField, FilterAction, WatchStatus } from "./config";
import {
  AnimeItem,
  Filter,
  isNumericField,
  isArrayField,
  isStringField,
  RawAnimeData,
} from "./types/anime";
import {
  WatchlistData,
  WatchedAnime,
  UserAnimeListItem as WatchlistUserAnimeItem,
} from "./types/watchlist";
import { animeStore } from "./store/animeStore";

const transformRawAnime = (rawAnime: RawAnimeData[0]): AnimeItem => {
  const arrayToMap = (
    arr?: Array<{ name: string }>
  ): { [key: string]: number } => {
    const map: { [key: string]: number } = {};
    if (arr) {
      arr.forEach(({ name }) => (map[name] = 1));
    }
    return map;
  };

  return {
    mal_id: rawAnime.mal_id,
    url: rawAnime.url,
    title: rawAnime.title,
    title_english: rawAnime.title_english,
    type: rawAnime.type,
    episodes: rawAnime.episodes,
    score: rawAnime.score,
    scored_by: rawAnime.scored_by,
    rank: rawAnime.rank,
    popularity: rawAnime.popularity,
    members: rawAnime.members,
    favorites: rawAnime.favorites,
    synopsis: rawAnime.synopsis,
    year: rawAnime.year || Number(rawAnime.aired?.from.slice(0, 4)),
    season: rawAnime.season,
    genres: arrayToMap(rawAnime.genres),
    themes: arrayToMap(rawAnime.themes),
    demographics: arrayToMap(rawAnime.demographics),
  };
};

const cleanAnimeData = (rawData: RawAnimeData): AnimeItem[] => {
  return rawData
    .map(transformRawAnime)
    .filter(
      (anime) =>
        anime.score !== undefined &&
        anime.scored_by !== undefined &&
        anime.members !== undefined
    );
};

export const cleanExistingJsonFile = async (): Promise<void> => {
  try {
    console.log(`Reading ${FILE_PATHS.animeData}...`);
    const rawData = await readJsonFile<RawAnimeData>(FILE_PATHS.animeData);
    if (!rawData) {
      throw new Error("No data found in anime data file");
    }

    console.log("Cleaning data...");
    const cleanedData = cleanAnimeData(rawData);
    console.log(`Writing cleaned data to ${FILE_PATHS.cleanAnimeData}...`);
    await writeJsonFile(FILE_PATHS.cleanAnimeData, cleanedData);
    animeStore.setAnimeList(cleanedData);

    // Log statistics
    console.log(`Cleaning completed. Saved to ${FILE_PATHS.cleanAnimeData}`);
    console.log("\nStatistics:");
    console.log(`Total entries: ${cleanedData.length}`);
    const totalSize = Buffer.byteLength(JSON.stringify(cleanedData));
    console.log(`File size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    return;
  } catch (error) {
    console.error("Error during cleaning:", error);
    throw error;
  }
};

const evaluateNumericFilter = (
  value: number,
  filterValue: number,
  action: FilterAction
): boolean => {
  switch (action) {
    case FilterAction.Equals:
      return value === filterValue;
    case FilterAction.GreaterThan:
      return value > filterValue;
    case FilterAction.LessThan:
      return value < filterValue;
    case FilterAction.GreaterThanOrEquals:
      return value >= filterValue;
    case FilterAction.LessThanOrEquals:
      return value <= filterValue;
    default:
      return false;
  }
};

const evaluateArrayFilter = (
  mapValue: { [key: string]: number },
  filterValue: string | string[],
  action: FilterAction
): boolean => {
  const values = Array.isArray(filterValue) ? filterValue : [filterValue];
  switch (action) {
    case FilterAction.Excludes:
      return !values.some((v) => mapValue[v]);
    case FilterAction.IncludesAll:
      return values.every((v) => mapValue[v]);
    case FilterAction.IncludesAny:
      return values.length === 0 || values.some((v) => mapValue[v]);
    default:
      return false;
  }
};

export const getFieldValue = (anime: AnimeItem, field: AnimeField): unknown => {
  switch (field) {
    case AnimeField.MalId:
      return anime.mal_id;
    case AnimeField.Title:
      return anime.title;
    case AnimeField.TitleEnglish:
      return anime.title_english;
    case AnimeField.Type:
      return anime.type;
    case AnimeField.Episodes:
      return anime.episodes;
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
    case AnimeField.Year:
      return anime.year;
    case AnimeField.Season:
      return anime.season;
    case AnimeField.Synopsis:
      return anime.synopsis;
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

export const filterAnimeList = async (
  filters: Filter[]
): Promise<AnimeItem[]> => {
  try {
    const animeList = animeStore.getAnimeList();

    return animeList.filter((anime) =>
      filters.every((filter) => {
        const value = getFieldValue(anime, filter.field);
        if (value === undefined) return false;

        if (isNumericField(filter.field)) {
          return evaluateNumericFilter(
            value as number,
            filter.value as number,
            filter.action
          );
        }

        if (isArrayField(filter.field)) {
          return evaluateArrayFilter(
            value as { [key: string]: number },
            filter.value as string | string[],
            filter.action
          );
        }

        if (isStringField(filter.field)) {
          if (filter.action === FilterAction.Equals) {
            return value === filter.value;
          } else if (filter.action === FilterAction.Contains) {
            return (
              typeof value === "string" &&
              typeof filter.value === "string" &&
              value.toLowerCase().includes(filter.value.toLowerCase())
            );
          }
          return false;
        }

        return false;
      })
    );
  } catch (error) {
    console.error("Error during filtering:", error);
    throw error;
  }
};

async function loadWatchlist(): Promise<WatchlistData> {
  const data = await readJsonFile<WatchlistData>(FILE_PATHS.userWatchList);
  if (!data) {
    throw new Error("Watchlist data not found");
  }
  return data;
}

export const storeUserWatchedDataInFile = async (): Promise<void> => {
  const { myanimelist } = await parseUserXMLFile();

  const storedJSON: WatchlistData = {
    user: {
      id: myanimelist.myinfo.user_id,
      name: myanimelist.myinfo.user_name,
    },
    anime: myanimelist.anime.reduce(
      (acc: Record<string, WatchedAnime>, anime: WatchlistUserAnimeItem) => {
        acc[anime.series_animedb_id] = {
          title: anime.series_title,
          type: anime.series_type,
          episodes: Number(anime.series_episodes),
          status: anime.my_status as WatchStatus,
          id: anime.series_animedb_id,
        };
        return acc;
      },
      {}
    ),
  };

  await writeJsonFile(FILE_PATHS.userWatchList, storedJSON);
};

export async function addAnimeToWatched(
  mal_ids: string[],
  status: WatchStatus
): Promise<void> {
  try {
    const { user, anime } = await loadWatchlist();

    for (const mal_id of mal_ids) {
      if (anime[mal_id]) {
        anime[mal_id].status = status;
      } else {
        anime[mal_id] = {
          id: mal_id,
          status,
        };
      }
    }

    await writeJsonFile(FILE_PATHS.userWatchList, { user, anime });
  } catch (error) {
    console.error("Error adding anime to watched list:", error);
    throw error;
  }
}

export async function getWatchedAnimeList(): Promise<WatchlistData | null> {
  try {
    return await loadWatchlist();
  } catch (error) {
    console.error("Error reading watched anime list:", error);
    return null;
  }
}
