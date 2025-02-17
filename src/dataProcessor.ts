import { parseUserXMLFile, readJsonFile, writeJsonFile } from "./utils/file";
import { FILE_PATHS, AnimeField, FilterAction, WatchStatus } from "./config";
import {
  AnimeItem,
  Filter,
  isNumericField,
  isArrayField,
  isStringField,
} from "./types/anime";

interface RawAnimeData {
  data: {
    mal_id: number;
    url: string;
    title: string;
    title_english?: string;
    type?: string;
    episodes?: number;
    aired?: string;
    score?: number;
    scored_by?: number;
    rank?: number;
    popularity?: number;
    members?: number;
    favorites?: number;
    synopsis?: string;
    year?: number;
    season?: string;
    genres?: { name: string }[];
    themes?: { name: string }[];
    demographics?: { name: string }[];
  }[];
}

interface UserAnimeListItem {
  series_animedb_id: string; // myanimelist id
  series_title: string;
  series_type: string;
  series_episodes: string;
  my_id: string;
  my_watched_episodes: string;
  my_start_date: string;
  my_finish_date: string;
  my_rated: Record<string, unknown>;
  my_score: string;
  my_storage: Record<string, unknown>;
  my_storage_value: string;
  my_status: string;
  my_comments: Record<string, unknown>;
  my_times_watched: string;
  my_rewatch_value: Record<string, unknown>;
  my_priority: string;
  my_tags: Record<string, unknown>;
  my_rewatching: string;
  my_rewatching_ep: string;
  my_discuss: string;
  my_sns: string;
  update_on_import: string;
}

const transformRawAnime = (rawAnime: RawAnimeData["data"][0]): AnimeItem => {
  const transformArrayToMap = (
    arr?: { name: string }[]
  ): { [key: string]: number } | undefined => {
    if (!arr) return undefined;
    return arr.reduce((acc, { name }) => ({ ...acc, [name]: 1 }), {});
  };

  return {
    mal_id: rawAnime.mal_id,
    url: rawAnime.url,
    title: rawAnime.title,
    title_english: rawAnime.title_english,
    type: rawAnime.type,
    episodes: rawAnime.episodes,
    aired: rawAnime.aired,
    score: rawAnime.score,
    scored_by: rawAnime.scored_by,
    rank: rawAnime.rank,
    popularity: rawAnime.popularity,
    members: rawAnime.members,
    favorites: rawAnime.favorites,
    synopsis: rawAnime.synopsis,
    year: rawAnime.year,
    season: rawAnime.season,
    genres: transformArrayToMap(rawAnime.genres),
    themes: transformArrayToMap(rawAnime.themes),
    demographics: transformArrayToMap(rawAnime.demographics),
  };
};

const cleanAnimeData = (rawData: RawAnimeData): AnimeItem[] => {
  return rawData.data
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
    console.log(`Reading ${FILE_PATHS.rawData}...`);
    const rawData = (await readJsonFile(FILE_PATHS.rawData)) as RawAnimeData;
    console.log("Cleaning data...");
    const cleanedData = cleanAnimeData(rawData);
    console.log(`Writing cleaned data to ${FILE_PATHS.cleanedData}...`);
    await writeJsonFile(FILE_PATHS.cleanedData, cleanedData);
    console.log(`Cleaning completed. Saved to ${FILE_PATHS.cleanedData}`);

    // Log statistics
    console.log("\nStatistics:");
    console.log(`Total entries: ${cleanedData.length}`);
    const totalSize = Buffer.byteLength(JSON.stringify(cleanedData));
    console.log(`File size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error("Error during cleaning:", error);
  }
};

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

export const filterAnimeList = async (
  filters: Filter[],
  hideWatched: boolean = false
): Promise<AnimeItem[]> => {
  try {
    const data = (await readJsonFile(FILE_PATHS.cleanedData)) as AnimeItem[];
    const userWatched: { [mal_id: number]: UserAnimeListItem } = hideWatched
      ? (
          (await readJsonFile(FILE_PATHS.userWatchList)) as {
            anime: UserAnimeListItem[];
          }
        ).anime
      : {};
    if (!data) {
      throw new Error("No data found");
    }

    return data
      .filter((anime) => !userWatched[anime.mal_id])
      .filter((anime) =>
        filters.every((filter) => {
          const value = getFieldValue(anime, filter.field);

          if (value === undefined) {
            return false;
          }

          if (isNumericField(filter.field)) {
            const numValue = value as number;
            const numFilterValue = filter.value as number;

            switch (filter.action) {
              case FilterAction.Equals:
                return numValue === numFilterValue;
              case FilterAction.GreaterThan:
                return numValue > numFilterValue;
              case FilterAction.GreaterThanOrEquals:
                return numValue >= numFilterValue;
              case FilterAction.LessThan:
                return numValue < numFilterValue;
              case FilterAction.LessThanOrEquals:
                return numValue <= numFilterValue;
              default:
                return false;
            }
          }

          if (isArrayField(filter.field)) {
            const mapValue = value as { [key: string]: number };

            switch (filter.action) {
              case FilterAction.IncludesAll:
                return (filter.value as string[]).every((v) => v in mapValue);
              case FilterAction.IncludesAny:
                return (filter.value as string[]).some((v) => v in mapValue);
              case FilterAction.Excludes:
                return !((filter.value as string) in mapValue);
              default:
                return false;
            }
          }

          if (isStringField(filter.field)) {
            return (
              filter.action === FilterAction.Equals && value === filter.value
            );
          }

          return false;
        })
      );
  } catch (error) {
    console.error("Error during filtering:", error);
    throw error;
  }
};

export const storeUserWatchedDataInFile = async () => {
  const { myanimelist } = await parseUserXMLFile();
  // clean the data
  const storedJSON = {
    user: {
      id: myanimelist.myinfo.user_id,
      name: myanimelist.myinfo.user_name,
      stats: {
        total: myanimelist.myinfo.user_total_anime,
        watching: myanimelist.myinfo.user_total_watching,
        completed: myanimelist.myinfo.user_total_completed,
        onHold: myanimelist.myinfo.user_total_onhold,
        dropped: myanimelist.myinfo.user_total_dropped,
        planToWatch: myanimelist.myinfo.user_total_plantowatch,
      },
    },
    anime: myanimelist.anime.reduce(
      (acc: Record<string, any>, anime: UserAnimeListItem) => {
        acc[anime.series_animedb_id] = {
          title: anime.series_title,
          type: anime.series_type,
          episodes: anime.series_episodes,
          status: anime.my_status,
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
  const watchedListPath = FILE_PATHS.userWatchList;

  try {
    const fileData = await readJsonFile<{
      user: { id: number };
      anime: { [mal_id: string]: UserAnimeListItem };
    }>(watchedListPath);

    if (!fileData) {
      throw new Error("File data is undefined");
    }

    const { user, anime } = fileData;
    for (const mal_id of mal_ids) {
      if (anime[mal_id]) {
        anime[mal_id].my_status = status;
      } else {
        anime[mal_id] = {
          series_animedb_id: mal_id,
          my_status: status,
        } as UserAnimeListItem;
      }
    }
    await writeJsonFile(watchedListPath, { user, anime });
  } catch (error) {
    console.error("Error adding anime to watched list:", error);
    throw error;
  }
}
