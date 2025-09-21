import { Router } from "express";
import { SERVER_CONFIG } from "../config";
import { catcher } from "../utils/functional";
import { validate } from "../middleware/validation";
import { mangaFilterRequestSchema } from "../validators/mangaFilters";
import { watchedListSchema } from "../validators/watchedList";
import {
  addMangaToWatchlistHandler,
  getMangaFields,
  getMangaFilterOptions,
  getMangaStatistics,
  getMangaWatchlist,
  searchManga,
} from "../controllers/mangaController";

const router = Router();

router.get("/fields", catcher(getMangaFields));

router.get("/filters", catcher(getMangaFilterOptions));

router.get("/stats", catcher(getMangaStatistics));

router.post(
  "/search",
  validate(mangaFilterRequestSchema, {
    errorMessage: "Invalid manga search payload",
  }),
  catcher(searchManga)
);

router.post(
  SERVER_CONFIG.routes.add_to_watched,
  validate(watchedListSchema, { errorMessage: "Invalid watchlist payload" }),
  catcher(addMangaToWatchlistHandler)
);

router.get("/watchlist", catcher(getMangaWatchlist));

export default router;
