import { Request, Response } from "express";
import {
  addMangaToWatched,
  filterMangaList,
  getMangaFieldValue,
  getWatchedMangaList,
} from "../dataProcessor";
import { getMangaStats } from "../statistics";
import { mangaStore } from "../store/mangaStore";
import {
  ARRAY_ACTIONS,
  COMPARISON_ACTIONS,
  TEXT_SEARCH_ACTIONS,
} from "../types/anime";
import {
  MANGA_ARRAY_FIELDS,
  MANGA_BOOLEAN_FIELDS,
  MANGA_NUMERIC_FIELDS,
  MANGA_STRING_FIELDS,
} from "../types/manga";
import { MangaFilterRequestBody } from "../validators/mangaFilters";
import { WatchedListPayload } from "../validators/watchedList";
import { hideWatchedItems, takeFirst } from "./helpers";

const sortManga = (
  list: Awaited<ReturnType<typeof filterMangaList>>,
  sortBy: MangaFilterRequestBody["sortBy"]
) => {
  if (!sortBy) return list;
  return [...list].sort((a, b) => {
    const aValue = (getMangaFieldValue(a, sortBy) as number) || 0;
    const bValue = (getMangaFieldValue(b, sortBy) as number) || 0;
    return bValue - aValue;
  });
};

export const getMangaFields = async (_req: Request, res: Response) => {
  res.json({
    numeric: MANGA_NUMERIC_FIELDS,
    array: MANGA_ARRAY_FIELDS,
    string: MANGA_STRING_FIELDS,
    boolean: MANGA_BOOLEAN_FIELDS,
  });
};

export const getMangaFilterOptions = async (_req: Request, res: Response) => {
  res.json({
    comparison: COMPARISON_ACTIONS,
    array: ARRAY_ACTIONS,
    text: TEXT_SEARCH_ACTIONS,
  });
};

export const getMangaStatistics = async (_req: Request, res: Response) => {
  const mangaList = mangaStore.getMangaList();
  if (!mangaList || mangaList.length === 0) {
    res
      .status(404)
      .json({ error: "No manga data found. Please wait for initialization." });
    return;
  }
  res.json(await getMangaStats(mangaList));
};

export const searchManga = async (
  req: Request<{}, {}, MangaFilterRequestBody>,
  res: Response
) => {
  const { filters, hideWatched, pagesize, sortBy } = req.body;

  let filtered = await filterMangaList(filters);
  filtered = await hideWatchedItems(filtered, hideWatched, getWatchedMangaList, (list) => list.manga);

  const sorted = sortManga(filtered, sortBy);

  res.json({
    manga: takeFirst(sorted, pagesize),
    total: filtered.length,
    pagesize,
    hasMore: filtered.length > pagesize,
  });
};

export const addMangaToWatchlistHandler = async (
  req: Request<{}, {}, WatchedListPayload>,
  res: Response
) => {
  await addMangaToWatched(req.body.mal_ids, req.body.status);
  res.json({ success: true, message: "Manga added to watched list" });
};

export const getMangaWatchlist = async (_req: Request, res: Response) => {
  const watchlist = await getWatchedMangaList();
  if (!watchlist) {
    res.status(404).json({ error: "Manga watchlist not found" });
    return;
  }
  res.json(watchlist);
};
