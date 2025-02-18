import { WatchStatus } from "../config";

export interface UserInfo {
  id: string;
  name: string;
  stats: {
    total: string;
    watching: string;
    completed: string;
    onHold: string;
    dropped: string;
    planToWatch: string;
    avoiding: string;
  };
}

export interface WatchedAnime {
  title?: string;
  type?: string;
  episodes?: string;
  status: WatchStatus;
  id: string;
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
