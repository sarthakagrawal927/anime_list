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
import { hideWatchedItems, takeFirst } from "./helpers";

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
  req: Request<{}, {}, FilterRequestBody>,
  res: Response
) => {
  const { filters, sortBy, airing, hideWatched, pagesize } = req.body;

  let filtered = await filterAnimeList(filters);
  filtered = applyAiringFilter(airing, filtered);
  filtered = await hideWatchedItems(filtered, hideWatched, getWatchedAnimeList, (list) => list.anime);

  const sorted = getScoreSortedList(filtered, filters, sortBy);
  const stats = await getAnimeStats(filtered);

  res.json({
    totalFiltered: filtered.length,
    filteredList: takeFirst(sorted, pagesize).map(toSummary),
    stats,
  });
};

export const getStats = async (_req: Request, res: Response) => {
  res.json(await getAnimeStats());
};

export const getWatchlist = async (_req: Request, res: Response) => {
  const watchlist = await getWatchedAnimeList();
  if (!watchlist) {
    res.status(404).json({ error: "Watchlist not found" });
    return;
  }
  res.json(watchlist);
};

export const addToWatchlist = async (
  req: Request<{}, {}, WatchedListPayload>,
  res: Response
) => {
  await addAnimeToWatched(req.body.mal_ids, req.body.status);
  res.json({ success: true, message: "Anime added to watched list" });
};
