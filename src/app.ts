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
} from "./dataProcessor";
import { loadAnimeData } from "./services/dataLoader";
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
  hideWatched?: boolean;
  pagesize: number;
  sortBy?: NumericField;
}

const app = express();
const { port, routes } = SERVER_CONFIG;

// Middleware
app.use(express.json());
app.use(compression());
app.use(cors());

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
    if (req.body.hideWatched) {
      const watchlist = await getWatchedAnimeList();
      if (watchlist) {
        filteredList = filteredList.filter(
          (anime) => !watchlist.anime[anime.mal_id.toString()]
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
            startYear: anime.year,
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
  `${routes.base}${routes.watchlist}`,
  catcher(async (req: Request, res: Response) => {
    const status = req.query.status as WatchStatus | undefined;
    const watchlist = await getWatchedAnimeList();
    const fullAnime = animeStore.getAnimeList();

    if (!watchlist) {
      res.status(404).json({ error: "Watchlist not found" });
      return;
    }

    Object.keys(watchlist.anime).map((mal_id) => {
      const fullAnimeData = fullAnime.find(
        (fullAnime) => fullAnime.mal_id.toString() === mal_id
      );
      if (!fullAnimeData) return;
      watchlist.anime[mal_id] = {
        title: fullAnimeData.title,
        link: fullAnimeData.url,
        ...watchlist.anime[mal_id],
      };
    });

    let filteredAnime = watchlist.anime;
    if (status) {
      filteredAnime = Object.fromEntries(
        Object.entries(watchlist.anime).filter(
          ([_, anime]) => anime.status?.toLowerCase() === status.toLowerCase()
        )
      );
    }

    const animeList = Object.values(filteredAnime);

    const stats = animeList.reduce((acc, anime) => {
      acc[anime.status] = (acc[anime.status] || 0) + 1;
      acc["Total"] = (acc["Total"] || 0) + 1;
      return acc;
    }, {} as Record<WatchStatus | string, number>);

    const completeAnimeList = animeList
      .map((anime) => {
        const fullAnime = animeStore
          .getAnimeList()
          .find((a) => a.mal_id.toString() === anime.id);
        if (!fullAnime) return null;
        return {
          ...fullAnime,
          status: anime.status,
          id: anime.id,
        };
      })
      .filter((anime) => anime !== null);

    res.json({
      stats: status ? undefined : stats,
      animeStats: await getAnimeStats(completeAnimeList),
      anime: animeList,
    });
  })
);

app.post(
  `${routes.base}${routes.add_to_watched}`,
  catcher(async (req: Request, res: Response) => {
    const validationResult = validateWatchedListPayload(req.body);

    if (!validationResult.isValid) {
      res.status(400).json({ error: validationResult.errors });
      return;
    }

    const { mal_ids, status } = req.body;
    await addAnimeToWatched(mal_ids, status);
    res.json({ success: true, message: "Anime added to watched list" });
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
