import { FILE_PATHS, AnimeField, FilterAction, WatchStatus } from "./config";
import {
  AnimeItem,
  Filter,
  isNumericField,
  isArrayField,
  isStringField,
  RawAnimeData,
} from "./types/anime";
// Re-export from filterEngine (pure logic, no native deps)
export {
  filterAnimeList,
  filterCollection,
  matchesFilter,
  getAnimeFieldValue,
} from "./filterEngine";
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
// Dynamic import to avoid pulling in native modules (xml2json) on CF Workers
const getMangaStore = () => import("./store/mangaStore").then((m) => m.mangaStore);

const extractImageUrl = (images?: { webp?: { image_url?: string }; jpg?: { image_url?: string } }): string | undefined =>
  images?.webp?.image_url || images?.jpg?.image_url || undefined;

const arrayToMap = (
  arr?: Array<{ name: string }>
): { [key: string]: number } => {
  const map: { [key: string]: number } = {};
  if (arr) {
    arr.forEach(({ name }) => (map[name] = 1));
  }
  return map;
};

export const transformRawAnime = (rawAnime: RawAnimeData[0]): AnimeItem => {
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
    image: extractImageUrl(rawAnime.images),
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
    const { readJsonFile, writeJsonFile } = await import("./utils/file");
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
    image: extractImageUrl(rawManga.images),
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
    const { readJsonFile, writeJsonFile } = await import("./utils/file");
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

// Filter logic imported from filterEngine.ts (see re-export above)

async function loadWatchlist(): Promise<WatchlistData> {
  const { getAnimeWatchlist } = await import("./db/watchlist");
  const data = await getAnimeWatchlist();
  if (!data) {
    throw new Error("Watchlist data not found");
  }
  return data;
}

export const storeUserWatchedDataInFile = async (): Promise<void> => {
  const { parseUserXMLFile, writeJsonFile } = await import("./utils/file");
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
  status: WatchStatus,
  userId: string = "default"
): Promise<void> {
  try {
    const { upsertAnimeWatchlist } = await import("./db/watchlist");
    await upsertAnimeWatchlist(mal_ids, status, userId);
  } catch (error) {
    console.error("Error adding anime to watched list:", error);
    throw error;
  }
}

export async function getWatchedAnimeList(userId: string = "default"): Promise<WatchlistData | null> {
  try {
    const { getAnimeWatchlist } = await import("./db/watchlist");
    return await getAnimeWatchlist(userId);
  } catch (error) {
    console.error("Error reading watched anime list:", error);
    return null;
  }
}

// Manga watchlist functions

export async function addMangaToWatched(
  mal_ids: string[],
  status: WatchStatus,
  userId: string = "default"
): Promise<void> {
  try {
    const { upsertMangaWatchlist } = await import("./db/watchlist");
    await upsertMangaWatchlist(mal_ids, status, userId);
  } catch (error) {
    console.error("Error adding manga to watched list:", error);
    throw error;
  }
}

export async function getWatchedMangaList(userId: string = "default"): Promise<MangaWatchlistData | null> {
  try {
    const { getMangaWatchlist } = await import("./db/watchlist");
    return await getMangaWatchlist(userId);
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
    const mangaList = (await getMangaStore()).getMangaList();

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
