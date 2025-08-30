import { WatchStatus } from "../config";

export interface UserInfo {
  id: string;
  name: string;
}

export interface WatchedAnime {
  status: WatchStatus;
  id: string;
  [key: string]: string | number;
}

export interface WatchedManga {
  status: WatchStatus;
  id: string;
  [key: string]: string | number;
}

export interface WatchlistData {
  user: UserInfo;
  anime: Record<string, WatchedAnime>;
}

export interface MangaWatchlistData {
  user: UserInfo;
  manga: Record<string, WatchedManga>;
}

export interface UserAnimeListItem {
  series_animedb_id: string;
  series_title: string;
  series_type: string;
  series_episodes: string;
  my_status: string;
}

export interface UserMangaListItem {
  series_mangadb_id: string;
  series_title: string;
  series_type: string;
  series_chapters: string;
  series_volumes: string;
  my_status: string;
}
