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

export interface WatchlistData {
  user: UserInfo;
  anime: Record<string, WatchedAnime>;
}

export interface UserAnimeListItem {
  series_animedb_id: string;
  series_title: string;
  series_type: string;
  series_episodes: string;
  my_status: string;
}
