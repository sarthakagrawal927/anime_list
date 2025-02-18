import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import {
  AnimeField,
  ERROR_MESSAGES,
  FilterAction,
  LOG_MESSAGES,
  SERVER_CONFIG,
} from "./config";
import {
  addAnimeToWatched,
  filterAnimeList,
  storeUserWatchedDataInFile,
  getWatchedAnimeList,
} from "./dataProcessor";
import { loadAnimeData } from "./services/dataLoader";
import { getAnimeStats } from "./statistics";
import {
  ARRAY_ACTIONS,
  ARRAY_FIELDS,
  COMPARISON_ACTIONS,
  Filter,
  NUMERIC_FIELDS,
  STRING_FIELDS,
} from "./types/anime";
import { catcher } from "./utils/functional";
import { validateFilters } from "./validators/animeFilters";
import { validateWatchedListPayload } from "./validators/watchedList";

interface FilterRequestBody {
  filters: Filter[];
  hideWatched?: boolean;
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
    if (!Array.isArray(filters)) {
      res.status(400).json({ error: ERROR_MESSAGES.invalidFilters });
      return;
    }

    // Validate filters
    const validation = validateFilters(filters);
    if (!validation.isValid) {
      res.status(400).json({
        error: "Invalid filters",
        details: validation.errors,
      });
      return;
    }

    const filteredList = await filterAnimeList(filters);
    const stats = await getAnimeStats(filteredList);
    res.json({
      totalFiltered: filteredList.length,
      filteredList,
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
  catcher(async (_req: Request, res: Response) => {
    const watchlist = await getWatchedAnimeList();
    if (!watchlist) {
      res.status(404).json({ error: "Watchlist not found" });
      return;
    }
    res.json(watchlist);
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
