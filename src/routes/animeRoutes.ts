import { Router } from "express";
import { SERVER_CONFIG } from "../config";
import { catcher } from "../utils/functional";
import { validate } from "../middleware/validation";
import { filterRequestSchema } from "../validators/animeFilters";
import {
  watchedListRemoveSchema,
  watchedListSchema,
} from "../validators/watchedList";
import {
  addToScheduleSchema,
  updateScheduleItemSchema,
  removeFromScheduleSchema,
  reorderScheduleSchema,
} from "../validators/schedule";
import {
  watchlistTagDeleteSchema,
  watchlistTagSchema,
  watchlistTagUpdateSchema,
} from "../validators/watchlistTags";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { userRateLimit } from "../middleware/rateLimit";
import {
  addToWatchlist,
  removeFromWatchlist,
  getChangelog,
  getEnrichedWatchlist,
  getFieldOptions,
  getFilterActions,
  getLastUpdated,
  getStats,
  getWatchlist,
  getWatchlistTags,
  deleteWatchlistTag,
  saveWatchlistTag,
  updateWatchlistTag,
  searchAnime,
} from "../controllers/animeController";
import {
  getScheduleTimeline,
  addToScheduleHandler,
  updateScheduleEntry,
  removeFromScheduleHandler,
  reorderScheduleHandler,
} from "../controllers/scheduleController";

const router = Router();
const { routes } = SERVER_CONFIG;

router.get(`${routes.base}${routes.fields}`, catcher(getFieldOptions));

router.get(`${routes.base}/last-updated`, catcher(getLastUpdated));

router.get(`${routes.base}/changelog`, catcher(getChangelog));

router.get(`${routes.base}${routes.filters}`, catcher(getFilterActions));

router.post(
  `${routes.base}${routes.search}`,
  optionalAuth,
  validate(filterRequestSchema, { errorMessage: "Invalid search payload" }),
  catcher(searchAnime)
);

router.get(`${routes.base}${routes.stats}`, optionalAuth, catcher(getStats));

router.get(`${routes.base}${routes.watchlist}`, requireAuth, catcher(getWatchlist));
router.get(`${routes.base}/watchlist/tags`, requireAuth, catcher(getWatchlistTags));
router.post(
  `${routes.base}/watchlist/tags`,
  requireAuth,
  userRateLimit,
  validate(watchlistTagSchema, { errorMessage: "Invalid watchlist tag payload" }),
  catcher(saveWatchlistTag),
);
router.post(
  `${routes.base}/watchlist/tags/:tagId/update`,
  requireAuth,
  userRateLimit,
  validate(watchlistTagUpdateSchema, { errorMessage: "Invalid watchlist tag update payload" }),
  catcher(updateWatchlistTag),
);
router.post(
  `${routes.base}/watchlist/tags/:tagId/delete`,
  requireAuth,
  userRateLimit,
  validate(watchlistTagDeleteSchema, { errorMessage: "Invalid watchlist tag delete payload" }),
  catcher(deleteWatchlistTag),
);

router.get(`${routes.base}/watchlist/enriched`, requireAuth, catcher(getEnrichedWatchlist));

router.post(
  `${routes.base}${routes.add_to_watched}`,
  requireAuth,
  userRateLimit,
  validate(watchedListSchema, { errorMessage: "Invalid watchlist payload" }),
  catcher(addToWatchlist)
);

router.post(
  `${routes.base}/watched/remove`,
  requireAuth,
  userRateLimit,
  validate(watchedListRemoveSchema, { errorMessage: "Invalid watchlist payload" }),
  catcher(removeFromWatchlist)
);

// Schedule
router.get(`${routes.base}/schedule/timeline`, requireAuth, catcher(getScheduleTimeline));

router.post(
  `${routes.base}/schedule/add`,
  requireAuth,
  userRateLimit,
  validate(addToScheduleSchema, { errorMessage: "Invalid schedule payload" }),
  catcher(addToScheduleHandler),
);

router.post(
  `${routes.base}/schedule/:malId/update`,
  requireAuth,
  userRateLimit,
  validate(updateScheduleItemSchema, { errorMessage: "Invalid schedule update payload" }),
  catcher(updateScheduleEntry),
);

router.post(
  `${routes.base}/schedule/remove`,
  requireAuth,
  userRateLimit,
  validate(removeFromScheduleSchema, { errorMessage: "Invalid schedule payload" }),
  catcher(removeFromScheduleHandler),
);

router.post(
  `${routes.base}/schedule/reorder`,
  requireAuth,
  userRateLimit,
  validate(reorderScheduleSchema, { errorMessage: "Invalid schedule reorder payload" }),
  catcher(reorderScheduleHandler),
);

export default router;
