import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import {
  ERROR_MESSAGES,
  LOG_MESSAGES,
  SERVER_CONFIG,
  WatchStatus,
} from "./config";
import {
  addAnimeToWatched,
  filterAnimeList,
  getWatchedAnimeList,
  storeUserWatchedDataInFile,
  addMangaToWatched,
  getWatchedMangaList,
} from "./dataProcessor";
import mangaRoutes from "./mangaRoutes";
import { loadAnimeData, loadMangaData } from "./services/dataLoader";
import { getAnimeStats } from "./statistics";
import { animeStore } from "./store/animeStore";
import {
  ARRAY_ACTIONS,
  ARRAY_FIELDS,
  COMPARISON_ACTIONS,
  Filter,
  NUMERIC_FIELDS,
  NumericField,
  STRING_FIELDS,
} from "./types/anime";
import { catcher } from "./utils/functional";
import { getScoreSortedList } from "./utils/statistics";
import { validateField, validateFilters } from "./validators/animeFilters";
import { validateWatchedListPayload } from "./validators/watchedList";

interface FilterRequestBody {
  filters: Filter[];
  hideWatched: WatchStatus[];
  pagesize: number;
  sortBy?: NumericField;
  airing?: "yes" | "no" | "any";
}

const app = express();
const { port, routes } = SERVER_CONFIG;

// Middleware
app.use(express.json());
app.use(compression());
app.use(cors());

// Mount manga routes
app.use("/api/manga", mangaRoutes);

// Routes
app.get(
  `${routes.base}${routes.fields}`,
  catcher(async (_req: Request, res: Response) => {
    res.json({
      numeric: NUMERIC_FIELDS,
      array: ARRAY_FIELDS,
      string: STRING_FIELDS,
    });
  })
);

app.get(
  `${routes.base}${routes.filters}`,
  catcher(async (_req: Request, res: Response) => {
    res.json({
      comparison: COMPARISON_ACTIONS,
      array: ARRAY_ACTIONS,
    });
  })
);

app.post(
  `${routes.base}${routes.search}`,
  catcher(async (req: Request<{}, {}, FilterRequestBody>, res: Response) => {
    const filters = req.body.filters;

    // Validate filters
    const validation = validateFilters(filters);
    if (!validation.isValid) {
      res.status(400).json({
        error: "Invalid filters",
        details: validation.errors,
      });
      return;
    }

    if (req.body.sortBy) {
      const validateSortBy = validateField(req.body.sortBy);
      if (!validateSortBy.isValid) {
        res.status(400).json({
          error: "Invalid sortBy field",
          details: validateSortBy.errors,
        });
        return;
      }
    }

    let filteredList = await filterAnimeList(filters);

    // Filter by airing status if specified
    if (req.body.airing && req.body.airing !== "any") {
      filteredList = filteredList.filter((anime) => {
        const isAiring = anime.status?.toLowerCase() === "currently airing";
        return req.body.airing === "yes" ? isAiring : !isAiring;
      });
    }

    if (req.body.hideWatched.length > 0) {
      const watchlist = await getWatchedAnimeList();
      if (watchlist) {
        filteredList = filteredList.filter(
          (anime) =>
            !watchlist.anime[anime.mal_id.toString()] ||
            !req.body.hideWatched.includes(
              watchlist.anime[anime.mal_id.toString()].status
            )
        );
      }
    }

    const sortedList = getScoreSortedList(
      filteredList,
      filters,
      req.body.sortBy
    );
    const stats = await getAnimeStats(filteredList);
    res.json({
      totalFiltered: filteredList.length,
      filteredList: sortedList
        .slice(0, req.body.pagesize || 20)
        .map((anime) => {
          return {
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
          };
        }),
      stats,
    });
  })
);

app.get(
  `${routes.base}${routes.stats}`,
  catcher(async (_req: Request, res: Response) => {
    const stats = await getAnimeStats();
    res.json(stats);
  })
);

app.get(
  SERVER_CONFIG.routes.watchlist,
  catcher(async (req: Request, res: Response) => {
    const watchlist = await getWatchedAnimeList();
    if (!watchlist) {
      res.status(404).json({ error: "Watchlist not found" });
      return;
    }
    res.json(watchlist);
  })
);

app.post(
  SERVER_CONFIG.routes.add_to_watched,
  catcher(async (req: Request, res: Response) => {
    const { mal_ids, status } = req.body;
    if (!mal_ids || !Array.isArray(mal_ids) || !status) {
      res.status(400).json({
        error: "Missing required fields: mal_ids (array) and status",
      });
      return;
    }

    await addAnimeToWatched(mal_ids, status as WatchStatus);
    res.json({ success: true, message: "Anime added to watched list" });
  })
);

app.post(
  SERVER_CONFIG.routes.add_manga_to_watched,
  catcher(async (req: Request, res: Response) => {
    const { mal_ids, status } = req.body;
    if (!mal_ids || !Array.isArray(mal_ids) || !status) {
      res.status(400).json({
        error: "Missing required fields: mal_ids (array) and status",
      });
      return;
    }

    await addMangaToWatched(mal_ids, status as WatchStatus);
    res.json({ success: true, message: "Manga added to watched list" });
  })
);

app.get(
  SERVER_CONFIG.routes.manga_watchlist,
  catcher(async (req: Request, res: Response) => {
    const watchlist = await getWatchedMangaList();
    if (!watchlist) {
      res.status(404).json({ error: "Manga watchlist not found" });
      return;
    }
    res.json(watchlist);
  })
);

app.post(
  `${routes.base}${routes.init_user_anime_list}`,
  catcher(async (_req: Request, res: Response) => {
    await storeUserWatchedDataInFile();
    res.json({ message: "XML data received successfully" });
  })
);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: ERROR_MESSAGES.serverError });
});

app.listen(port, async () => {
  try {
    await loadAnimeData();
    await loadMangaData();
    console.log(LOG_MESSAGES.serverStart + port);
    console.log(LOG_MESSAGES.availableEndpoints);
    Object.values(LOG_MESSAGES.endpoints).forEach((endpoint) =>
      console.log(endpoint)
    );
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
});
