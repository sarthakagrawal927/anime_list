import express, { Request, Response, NextFunction } from "express";
import { fetchAllAnimePages } from "./api";
import { cleanExistingJsonFile, filterAnimeList } from "./dataProcessor";
import { getAnimeStats } from "./statistics";
import {
  SERVER_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOG_MESSAGES,
  AnimeField,
  FilterAction,
} from "./config";
import {
  Filter,
  FilterRequestBody,
  NUMERIC_FIELDS,
  ARRAY_FIELDS,
  STRING_FIELDS,
  COMPARISON_ACTIONS,
  ARRAY_ACTIONS,
} from "./types/anime";
import { validateFilter } from "./validators/animeFilters";

const app = express();
const { port, routes } = SERVER_CONFIG;

app.use(express.json());

app.get(
  `${routes.base}${routes.stats}`,
  async (_req: Request, res: Response) => {
    try {
      const stats = await getAnimeStats();
      res.json(stats);
    } catch (error) {
      console.error(ERROR_MESSAGES.fetchError, error);
      res.status(500).json({ error: ERROR_MESSAGES.fetchFailed });
    }
  }
);

app.post(
  `${routes.base}${routes.filter}`,
  async (req: Request<{}, {}, FilterRequestBody>, res: Response) => {
    try {
      const filters = req.body.filters;
      if (!Array.isArray(filters)) {
        res.status(400).json({ error: ERROR_MESSAGES.invalidFilters });
        return;
      }

      // Validate each filter
      const validationErrors: string[] = [];
      for (const filter of filters) {
        const validation = validateFilter(filter);
        if (!validation.isValid && validation.error) {
          validationErrors.push(validation.error);
        }
      }

      if (validationErrors.length > 0) {
        res.status(400).json({
          error: "Invalid filters",
          details: validationErrors,
        });
        return;
      }

      const filteredList = await filterAnimeList(filters);
      const stats = await getAnimeStats(filteredList);
      res.json({
        totalFiltered: filteredList.length,
        filters,
        stats,
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.filterError, error);
      res.status(500).json({ error: ERROR_MESSAGES.filterFailed });
    }
  }
);

app.post(
  `${routes.base}${routes.fetch}`,
  async (_req: Request, res: Response) => {
    try {
      res.json({ message: SUCCESS_MESSAGES.fetchStarted });
      await fetchAllAnimePages();
      await cleanExistingJsonFile();
    } catch (error) {
      console.error(ERROR_MESSAGES.fetchError, error);
    }
  }
);

app.get(`${routes.base}${routes.filters}`, (_req: Request, res: Response) => {
  res.json({
    availableActions: FilterAction,
    filterableFields: {
      numeric: NUMERIC_FIELDS,
      array: ARRAY_FIELDS,
      string: STRING_FIELDS,
    },
    validOperations: {
      numeric: [...COMPARISON_ACTIONS, FilterAction.Equals],
      array: ARRAY_ACTIONS,
      string: [FilterAction.Equals],
    },
    examples: [
      {
        description: "Recent high-rated action anime",
        filters: [
          {
            field: AnimeField.Year,
            value: 2020,
            action: FilterAction.GreaterThanOrEquals,
          },
          {
            field: AnimeField.Score,
            value: 7,
            action: FilterAction.GreaterThanOrEquals,
          },
          {
            field: AnimeField.Genres,
            value: ["Action"],
            action: FilterAction.IncludesAll,
          },
        ],
      },
    ],
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: ERROR_MESSAGES.serverError });
});

app.listen(port, () => {
  console.log(LOG_MESSAGES.serverStart + port);
  console.log(LOG_MESSAGES.availableEndpoints);
  Object.values(LOG_MESSAGES.endpoints).forEach((endpoint) =>
    console.log(endpoint)
  );
});
