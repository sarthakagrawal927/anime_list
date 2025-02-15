import express from "express";
import {
  getStats,
  filterAnime,
  fetchAnime,
  getFilterInfo,
} from "../controllers/animeController";
import { SERVER_CONFIG } from "../config";

const router = express.Router();
const { routes } = SERVER_CONFIG;

router.get(routes.stats, getStats);
router.post(routes.filter, filterAnime);
router.post(routes.fetch, fetchAnime);
router.get(routes.filters, getFilterInfo);

export default router;
