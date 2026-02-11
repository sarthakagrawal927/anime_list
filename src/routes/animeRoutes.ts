import { Router } from "express";
import { SERVER_CONFIG } from "../config";
import { catcher } from "../utils/functional";
import { validate } from "../middleware/validation";
import { filterRequestSchema } from "../validators/animeFilters";
import { watchedListSchema } from "../validators/watchedList";
import {
  addToWatchlist,
  getFieldOptions,
  getFilterActions,
  getStats,
  getWatchlist,
  searchAnime,
} from "../controllers/animeController";

const router = Router();
const { routes } = SERVER_CONFIG;

router.get(`${routes.base}${routes.fields}`, catcher(getFieldOptions));

router.get(`${routes.base}${routes.filters}`, catcher(getFilterActions));

router.post(
  `${routes.base}${routes.search}`,
  validate(filterRequestSchema, { errorMessage: "Invalid search payload" }),
  catcher(searchAnime)
);

router.get(`${routes.base}${routes.stats}`, catcher(getStats));

router.get(`${routes.base}${routes.watchlist}`, catcher(getWatchlist));

router.post(
  `${routes.base}${routes.add_to_watched}`,
  validate(watchedListSchema, { errorMessage: "Invalid watchlist payload" }),
  catcher(addToWatchlist)
);

export default router;
