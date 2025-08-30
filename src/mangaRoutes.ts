import express, { Request, Response } from "express";
import { FilterAction, WatchStatus, SERVER_CONFIG } from "./config";
import {
  addMangaToWatched,
  filterMangaList,
  getMangaFieldValue,
  getWatchedMangaList,
} from "./dataProcessor";
import { getMangaStats } from "./statistics";
import { mangaStore } from "./store/mangaStore";
import {
  ARRAY_ACTIONS,
  COMPARISON_ACTIONS,
  TEXT_SEARCH_ACTIONS,
} from "./types/anime";
import {
  MANGA_ARRAY_FIELDS,
  MANGA_BOOLEAN_FIELDS,
  MANGA_NUMERIC_FIELDS,
  MANGA_STRING_FIELDS,
  MangaField,
  MangaFilter,
  MangaNumericField,
} from "./types/manga";
import { catcher } from "./utils/functional";

const router = express.Router();

interface MangaFilterRequestBody {
  filters: MangaFilter[];
  hideWatched: WatchStatus[];
  pagesize: number;
  sortBy?: MangaNumericField;
}

// GET /manga/fields - Get available manga fields
router.get(
  "/fields",
  catcher(async (_req: Request, res: Response) => {
    res.json({
      numeric: MANGA_NUMERIC_FIELDS,
      array: MANGA_ARRAY_FIELDS,
      string: MANGA_STRING_FIELDS,
      boolean: MANGA_BOOLEAN_FIELDS,
    });
  })
);

// GET /manga/filters - Get available filter options
router.get(
  "/filters",
  catcher(async (_req: Request, res: Response) => {
    res.json({
      comparison: COMPARISON_ACTIONS,
      array: ARRAY_ACTIONS,
      text: TEXT_SEARCH_ACTIONS,
    });
  })
);

// GET /manga/stats - Get manga statistics
router.get(
  "/stats",
  catcher(async (_req: Request, res: Response) => {
    const mangaList = mangaStore.getMangaList();

    if (!mangaList || mangaList.length === 0) {
      res.status(404).json({
        error: "No manga data found. Please wait for initialization.",
      });
      return;
    }

    const stats = await getMangaStats(mangaList);
    res.json(stats);
  })
);

// POST /manga/search - Search and filter manga
router.post(
  "/search",
  catcher(
    async (req: Request<{}, {}, MangaFilterRequestBody>, res: Response) => {
      const filters = req.body.filters;
      const pagesize = req.body.pagesize || 50;
      const sortBy = req.body.sortBy;

      if (!Array.isArray(filters)) {
        res.status(400).json({ error: "Filters must be an array" });
        return;
      }

      // Validate filters
      for (const filter of filters) {
        if (!Object.values(MangaField).includes(filter.field)) {
          res.status(400).json({ error: `Invalid field: ${filter.field}` });
          return;
        }
        if (!Object.values(FilterAction).includes(filter.action)) {
          res.status(400).json({ error: `Invalid action: ${filter.action}` });
          return;
        }
      }

      let filteredManga = await filterMangaList(filters);

      // Filter by watchlist status if specified
      if (req.body.hideWatched && req.body.hideWatched.length > 0) {
        const watchlist = await getWatchedMangaList();
        if (watchlist) {
          filteredManga = filteredManga.filter(
            (manga) =>
              !watchlist.manga[manga.mal_id.toString()] ||
              !req.body.hideWatched.includes(
                watchlist.manga[manga.mal_id.toString()].status
              )
          );
        }
      }

      // Sort if requested
      if (sortBy && MANGA_NUMERIC_FIELDS.includes(sortBy)) {
        filteredManga = filteredManga.sort((a, b) => {
          const aValue = (getMangaFieldValue(a, sortBy) as number) || 0;
          const bValue = (getMangaFieldValue(b, sortBy) as number) || 0;
          return bValue - aValue; // descending
        });
      }

      // Paginate
      const paginatedManga = filteredManga.slice(0, pagesize);

      res.json({
        manga: paginatedManga,
        total: filteredManga.length,
        pagesize,
        hasMore: filteredManga.length > pagesize,
      });
    }
  )
);

router.post(
  SERVER_CONFIG.routes.add_to_watched,
  catcher(async (req: Request, res: Response) => {
    const { mal_ids, status } = req.body;
    if (
      !mal_ids ||
      !Array.isArray(mal_ids) ||
      !status ||
      !Object.values(WatchStatus).includes(status as WatchStatus)
    ) {
      res.status(400).json({
        error:
          "Missing or invalid required fields: mal_ids (array) and status (Watching, Completed, Deferred, Avoiding, BRR)",
      });
      return;
    }

    await addMangaToWatched(mal_ids, status as WatchStatus);
    res.json({ success: true, message: "Manga added to watched list" });
  })
);

router.get(
  "/watchlist",
  catcher(async (req: Request, res: Response) => {
    const watchlist = await getWatchedMangaList();
    if (!watchlist) {
      res.status(404).json({ error: "Manga watchlist not found" });
      return;
    }
    res.json(watchlist);
  })
);

export default router;
