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
  MangaItem,
  MangaField,
  MangaFilter,
  isMangaNumericField,
  isMangaArrayField,
  isMangaStringField,
  RawMangaData,
} from "./types/manga";
import {
  WatchlistData,
  MangaWatchlistData,
  WatchedAnime,
  WatchedManga,
  UserAnimeListItem as WatchlistUserAnimeItem,
  UserMangaListItem as WatchlistUserMangaItem,
} from "./types/watchlist";
import { animeStore } from "./store/animeStore";
import { mangaStore } from "./store/mangaStore";

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
    year: rawAnime.year || Number(rawAnime.aired?.from?.slice(0, 4)),
    season: rawAnime.season,
    status: rawAnime.status,
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
        anime.score &&
        anime.scored_by &&
        anime.members &&
        anime.favorites &&
        anime.year
    );
};

export const cleanExistingJsonFile = async (): Promise<AnimeItem[] | null> => {
  try {
    console.log(`Reading ${FILE_PATHS.animeData}...`);
    const rawData = await readJsonFile<Record<string, RawAnimeData[0]>>(
      FILE_PATHS.animeData
    );
    if (!rawData) {
      throw new Error("No data found in anime data file");
    }

    console.log("Cleaning data...");
    const dataArray = Object.values(rawData)
      // .filter(anime => anime.members && anime.members > 10000);
    const cleanedData = cleanAnimeData(dataArray);
    console.log(`Writing cleaned data to ${FILE_PATHS.cleanAnimeData}...`);
    await writeJsonFile(FILE_PATHS.cleanAnimeData, cleanedData);

    return cleanedData;
  } catch (error) {
    console.error("Error during cleaning:", error);
    throw error;
  }
};

// Manga data processing functions
const transformRawManga = (rawManga: RawMangaData[0]): MangaItem => {
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
    mal_id: rawManga.mal_id,
    url: rawManga.url,
    title: rawManga.title,
    title_english: rawManga.title_english,
    type: rawManga.type,
    chapters: rawManga.chapters,
    volumes: rawManga.volumes,
    score: rawManga.score,
    scored_by: rawManga.scored_by,
    rank: rawManga.rank,
    popularity: rawManga.popularity,
    members: rawManga.members,
    favorites: rawManga.favorites,
    synopsis: rawManga.synopsis,
    year: rawManga.year || Number(rawManga.published?.from?.slice(0, 4)),
    status: rawManga.status,
    genres: arrayToMap(rawManga.genres),
    themes: arrayToMap(rawManga.themes),
    demographics: arrayToMap(rawManga.demographics),
  };
};

const cleanMangaData = (rawData: RawMangaData): MangaItem[] => {
  return rawData
    .map(transformRawManga)
    .filter(
      (manga) =>
        manga.score &&
        manga.scored_by &&
        manga.members &&
        manga.favorites &&
        manga.year
    );
};

export const cleanExistingMangaJsonFile = async (): Promise<
  MangaItem[] | null
> => {
  try {
    console.log(`Reading ${FILE_PATHS.mangaData}...`);
    const rawData = await readJsonFile<Record<string, RawMangaData[0]>>(
      FILE_PATHS.mangaData
    );
    if (!rawData) {
      throw new Error("No data found in manga data file");
    }

    console.log("Cleaning manga data...");
    const dataArray = Object.values(rawData);
    const cleanedData = cleanMangaData(dataArray);
    console.log(
      `Writing cleaned manga data to ${FILE_PATHS.cleanMangaData}...`
    );
    await writeJsonFile(FILE_PATHS.cleanMangaData, cleanedData);

    return cleanedData;
  } catch (error) {
    console.error("Error during manga cleaning:", error);
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

const matchesStringFilter = (
  value: unknown,
  filterValue: unknown,
  action: FilterAction
): boolean => {
  if (typeof value !== "string") return false;

  if (action === FilterAction.Equals) {
    return typeof filterValue === "string" && value === filterValue;
  }

  if (action === FilterAction.Contains) {
    return (
      typeof filterValue === "string" &&
      value.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  if (action === FilterAction.Excludes) {
    if (typeof filterValue === "string") {
      return !value.toLowerCase().includes(filterValue.toLowerCase());
    }

    if (Array.isArray(filterValue)) {
      const needles = filterValue
        .filter((needle): needle is string => typeof needle === "string" && needle.length > 0)
        .map((needle) => needle.toLowerCase());
      if (needles.length === 0) {
        return true;
      }
      return needles.every((needle) => !value.toLowerCase().includes(needle));
    }

    return false;
  }

  if (action === FilterAction.IncludesAll || action === FilterAction.IncludesAny) {
    if (!Array.isArray(filterValue)) return false;
    const haystack = value.toLowerCase();
    const needles = filterValue
      .filter((needle): needle is string => typeof needle === "string" && needle.length > 0)
      .map((needle) => needle.toLowerCase());
    if (needles.length === 0) {
      return true;
    }
    return action === FilterAction.IncludesAll
      ? needles.every((needle) => haystack.includes(needle))
      : needles.some((needle) => haystack.includes(needle));
  }

  return false;
};

const matchesFilter = <
  TItem,
  TField,
  TFilter extends { field: TField; value: unknown; action: FilterAction }
>(
  item: TItem,
  filter: TFilter,
  ctx: {
    getFieldValue: (item: TItem, field: TField) => unknown;
    isNumericField: (field: TField) => boolean;
    isArrayField: (field: TField) => boolean;
    isStringField: (field: TField) => boolean;
  }
): boolean => {
  const value = ctx.getFieldValue(item, filter.field);
  if (value === undefined) return false;

  if (ctx.isNumericField(filter.field)) {
    return evaluateNumericFilter(
      value as number,
      filter.value as number,
      filter.action
    );
  }

  if (ctx.isArrayField(filter.field)) {
    return evaluateArrayFilter(
      value as { [key: string]: number },
      filter.value as string | string[],
      filter.action
    );
  }

  if (ctx.isStringField(filter.field)) {
    return matchesStringFilter(value, filter.value, filter.action);
  }

  return false;
};

const filterCollection = <
  TItem,
  TField,
  TFilter extends { field: TField; value: unknown; action: FilterAction }
>(
  items: TItem[],
  filters: TFilter[],
  ctx: {
    getFieldValue: (item: TItem, field: TField) => unknown;
    isNumericField: (field: TField) => boolean;
    isArrayField: (field: TField) => boolean;
    isStringField: (field: TField) => boolean;
  }
): TItem[] =>
  items.filter((item) => filters.every((filter) => matchesFilter(item, filter, ctx)));

const getAnimeFieldValue = (anime: AnimeItem, field: AnimeField): unknown => {
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

    return filterCollection(animeList, filters, {
      getFieldValue: getAnimeFieldValue,
      isNumericField,
      isArrayField,
      isStringField,
    });
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

// Manga watchlist functions
async function loadMangaWatchlist(): Promise<MangaWatchlistData> {
  const data = await readJsonFile<MangaWatchlistData>(
    FILE_PATHS.userMangaWatchList
  );
  if (!data) {
    throw new Error("Manga watchlist data not found");
  }
  return data;
}

export async function addMangaToWatched(
  mal_ids: string[],
  status: WatchStatus
): Promise<void> {
  try {
    const { user, manga } = await loadMangaWatchlist();

    for (const mal_id of mal_ids) {
      if (manga[mal_id]) {
        manga[mal_id].status = status;
        console.log(`Updated manga ${mal_id} status to ${status}`);
      } else {
        manga[mal_id] = { id: mal_id, status };
        console.log(`Added manga ${mal_id} with status ${status}`);
      }
    }

    await writeJsonFile(FILE_PATHS.userMangaWatchList, { user, manga });
  } catch (error) {
    console.error("Error adding manga to watched list:", error);
    throw error;
  }
}

export async function getWatchedMangaList(): Promise<MangaWatchlistData | null> {
  try {
    return await loadMangaWatchlist();
  } catch (error) {
    console.error("Error reading watched manga list:", error);
    return null;
  }
}

// Manga filtering functions
export const getMangaFieldValue = (
  manga: MangaItem,
  field: MangaField
): unknown => {
  switch (field) {
    case MangaField.MalId:
      return manga.mal_id;
    case MangaField.Title:
      return manga.title;
    case MangaField.TitleEnglish:
      return manga.title_english;
    case MangaField.Type:
      return manga.type;
    case MangaField.Chapters:
      return manga.chapters;
    case MangaField.Volumes:
      return manga.volumes;
    case MangaField.Score:
      return manga.score;
    case MangaField.ScoredBy:
      return manga.scored_by;
    case MangaField.Rank:
      return manga.rank;
    case MangaField.Status:
      return manga.status;
    case MangaField.Popularity:
      return manga.popularity;
    case MangaField.Members:
      return manga.members;
    case MangaField.Favorites:
      return manga.favorites;
    case MangaField.Year:
      return manga.year;
    case MangaField.Synopsis:
      return manga.synopsis;
    case MangaField.Genres:
      return manga.genres;
    case MangaField.Themes:
      return manga.themes;
    case MangaField.Demographics:
      return manga.demographics;
    case MangaField.HasColored:
      return manga.has_colored;
    case MangaField.IsCompleted:
      return manga.is_completed;
    case MangaField.AvailableInEnglish:
      return manga.available_in_english;
    case MangaField.AvailableLanguages:
      return manga.available_languages;
    default:
      return undefined;
  }
};

export const filterMangaList = async (
  filters: MangaFilter[]
): Promise<MangaItem[]> => {
  try {
    const mangaList = mangaStore.getMangaList();

    return filterCollection(mangaList, filters, {
      getFieldValue: getMangaFieldValue,
      isNumericField: isMangaNumericField,
      isArrayField: isMangaArrayField,
      isStringField: isMangaStringField,
    });
  } catch (error) {
    console.error("Error during manga filtering:", error);
    throw error;
  }
};
