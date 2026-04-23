import type { AnimeItem } from "../types/anime";

export type AniListMediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";

export interface AniListStatusRecord {
  idMal: number;
  status?: AniListMediaStatus | null;
  episodes?: number | null;
}

export interface DirectStatusRecord {
  malId: number;
  status?: string | null;
  episodes?: number | null;
}

export interface AnimeStatusChange {
  malId: number;
  title: string;
  previousStatus?: string;
  nextStatus?: string;
  previousEpisodes?: number;
  nextEpisodes?: number;
}

const STATUS_MAP: Record<AniListMediaStatus, string> = {
  FINISHED: "Finished Airing",
  RELEASING: "Currently Airing",
  NOT_YET_RELEASED: "Not yet aired",
  CANCELLED: "Cancelled",
  HIATUS: "Hiatus",
};

export function mapAniListStatus(
  status?: AniListMediaStatus | null
): string | undefined {
  if (!status) {
    return undefined;
  }

  return STATUS_MAP[status];
}

function normalizeStatus(status?: string | null): string | undefined {
  if (!status) {
    return undefined;
  }

  return mapAniListStatus(status as AniListMediaStatus) ?? status;
}

function applyDirectStatusUpdatesInternal(
  animeList: AnimeItem[],
  updates: DirectStatusRecord[]
): {
  changedAnime: AnimeItem[];
  changes: AnimeStatusChange[];
  missingMalIds: number[];
} {
  const updateMap = new Map(updates.map((update) => [update.malId, update]));
  const changedAnime: AnimeItem[] = [];
  const changes: AnimeStatusChange[] = [];
  const missingMalIds: number[] = [];

  for (const anime of animeList) {
    const update = updateMap.get(anime.mal_id);

    if (!update) {
      missingMalIds.push(anime.mal_id);
      continue;
    }

    let nextAnime = anime;
    let hasChange = false;
    const change: AnimeStatusChange = {
      malId: anime.mal_id,
      title: anime.title_english || anime.title,
    };

    const mappedStatus = normalizeStatus(update.status);
    if (mappedStatus && anime.status !== mappedStatus) {
      nextAnime = {
        ...nextAnime,
        status: mappedStatus,
      };
      change.previousStatus = anime.status;
      change.nextStatus = mappedStatus;
      hasChange = true;
    }

    if (
      update.episodes !== null &&
      update.episodes !== undefined &&
      anime.episodes !== update.episodes
    ) {
      nextAnime = {
        ...nextAnime,
        episodes: update.episodes,
      };
      change.previousEpisodes = anime.episodes;
      change.nextEpisodes = update.episodes;
      hasChange = true;
    }

    if (hasChange) {
      changedAnime.push(nextAnime);
      changes.push(change);
    }
  }

  return {
    changedAnime,
    changes,
    missingMalIds,
  };
}

export function applyDirectStatusUpdates(
  animeList: AnimeItem[],
  updates: DirectStatusRecord[]
): {
  changedAnime: AnimeItem[];
  changes: AnimeStatusChange[];
  missingMalIds: number[];
} {
  return applyDirectStatusUpdatesInternal(animeList, updates);
}

export function applyAniListStatusUpdates(
  animeList: AnimeItem[],
  updates: AniListStatusRecord[]
): {
  changedAnime: AnimeItem[];
  changes: AnimeStatusChange[];
  missingMalIds: number[];
} {
  return applyDirectStatusUpdatesInternal(
    animeList,
    updates.map((update) => ({
      malId: update.idMal,
      status: mapAniListStatus(update.status),
      episodes: update.episodes,
    }))
  );
}
