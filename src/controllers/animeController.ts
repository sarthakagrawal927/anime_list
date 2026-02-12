import { Request, Response } from "express";
import {
  ARRAY_ACTIONS,
  ARRAY_FIELDS,
  COMPARISON_ACTIONS,
  NUMERIC_FIELDS,
  STRING_FIELDS,
} from "../types/anime";
import { WatchStatus } from "../config";
import {
  addAnimeToWatched,
  filterAnimeList,
  getWatchedAnimeList,
} from "../dataProcessor";
import { getAnimeStats } from "../statistics";
import { getScoreSortedList } from "../utils/statistics";
import { FilterRequestBody } from "../validators/animeFilters";
import { WatchedListPayload } from "../validators/watchedList";
import { hideWatchedItems, includeOnlyWatchedItems, takePage } from "./helpers";
import { WatchedAnime } from '../types/watchlist';
import { AuthRequest } from "../middleware/auth";
import { animeStore } from "../store/animeStore";
import { updateLatestTwoSeasonData } from "../api";

type ScoredAnime = ReturnType<typeof getScoreSortedList>[number];

const toSummary = (anime: ScoredAnime) => ({
  id: anime.mal_id,
  score: anime.score,
  points: anime.points,
  name: anime.title,
  link: anime.url,
  synopsis: anime.synopsis,
  members: anime.members,
  favorites: anime.favorites,
  year: anime.year,
  status: anime.status,
  genres: Object.keys(anime.genres),
  themes: Object.keys(anime.themes),
  type: anime.type,
  image: anime.image,
});

const applyAiringFilter = (
  airing: FilterRequestBody["airing"],
  list: Awaited<ReturnType<typeof filterAnimeList>>
) =>
  airing === "any"
    ? list
    : list.filter((anime) => {
        const isAiring = anime.status?.toLowerCase() === "currently airing";
        return airing === "yes" ? isAiring : !isAiring;
      });

export const getFieldOptions = async (_req: Request, res: Response) => {
  res.json({
    numeric: NUMERIC_FIELDS,
    array: ARRAY_FIELDS,
    string: STRING_FIELDS,
  });
};

export const getFilterActions = async (_req: Request, res: Response) => {
  res.json({ comparison: COMPARISON_ACTIONS, array: ARRAY_ACTIONS });
};

export const searchAnime = async (
  req: AuthRequest & Request<{}, {}, FilterRequestBody>,
  res: Response
) => {
  const { filters, sortBy, airing, hideWatched, pagesize, offset } = req.body;
  const userId = req.user?.userId;

  let filtered = await filterAnimeList(filters);
  filtered = applyAiringFilter(airing, filtered);
  if (userId) {
    filtered = await hideWatchedItems(filtered, hideWatched, () => getWatchedAnimeList(userId), (list) => list.anime);
  }

  const sorted = getScoreSortedList(filtered, filters, sortBy);
  const stats = await getAnimeStats(filtered);

  res.json({
    totalFiltered: filtered.length,
    filteredList: takePage(sorted, pagesize, offset).map(toSummary),
    stats,
  });
};

export const getStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const hideWatched = (req.query.hideWatched as string)?.split(',').filter(Boolean) || [];

  let animeList = await animeStore.getAnimeList();

  if (userId && hideWatched.length > 0) {
    // Convert hideWatched to includeStatuses (invert the selection)
    const allStatuses: WatchStatus[] = [
      WatchStatus.Watching,
      WatchStatus.Completed,
      WatchStatus.Deferred,
      WatchStatus.Avoiding,
      WatchStatus.BadRatingRatio,
    ];
    const includeStatuses = allStatuses.filter(
      (status) => !hideWatched.includes(status)
    );

    animeList = await includeOnlyWatchedItems(
      animeList,
      includeStatuses,
      () => getWatchedAnimeList(userId),
      (list) => list.anime
    );
  }

  res.json(await getAnimeStats(animeList));
};

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const watchlist = await getWatchedAnimeList(userId);
  const status = req.query.status as WatchStatus;

  if (!watchlist) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }

  if (status) {
    const filteredAnime = Object.values(watchlist.anime).filter(
      (item: WatchedAnime) => item.status === status
    );
    res.json(filteredAnime);
    return;
  }

  res.json(watchlist);
};

export const addToWatchlist = async (
  req: AuthRequest & Request<{}, {}, WatchedListPayload>,
  res: Response
) => {
  const userId = req.user!.userId;
  await addAnimeToWatched(req.body.mal_ids, req.body.status, userId);
  res.json({ success: true, message: "Anime added to watched list" });
};

export const getEnrichedWatchlist = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const watchlist = await getWatchedAnimeList(userId);

  if (!watchlist) {
    res.json({ items: [] });
    return;
  }

  const allAnime = await animeStore.getAnimeList();
  const animeMap = new Map(allAnime.map((a) => [a.mal_id.toString(), a]));

  const items = Object.values(watchlist.anime).map((entry) => {
    const anime = animeMap.get(entry.id);
    return {
      mal_id: entry.id,
      watchStatus: entry.status,
      title: anime?.title || entry.title || `ID: ${entry.id}`,
      image: anime?.image,
      score: anime?.score,
      year: anime?.year,
      type: anime?.type,
      episodes: anime?.episodes,
      members: anime?.members,
      genres: anime ? Object.keys(anime.genres) : [],
      synopsis: anime?.synopsis,
      url: anime?.url,
    };
  });

  res.json({ items });
};
