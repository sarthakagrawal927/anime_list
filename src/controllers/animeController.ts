import { Request, Response } from "express";
import { fetchAllAnimePages } from "../api";
import { cleanExistingJsonFile, filterAnimeList } from "../dataProcessor";
import { getAnimeStats } from "../statistics";
import { ERROR_MESSAGES, SUCCESS_MESSAGES, AnimeField, FilterAction } from "../config";
import { validateFilter } from "../validators/animeFilters";
import {
  FilterRequestBody,
  NUMERIC_FIELDS,
  ARRAY_FIELDS,
  STRING_FIELDS,
  COMPARISON_ACTIONS,
  ARRAY_ACTIONS,
} from "../types/anime";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await getAnimeStats();
    res.json(stats);
  } catch (error) {
    console.error(ERROR_MESSAGES.fetchError, error);
    res.status(500).json({ error: ERROR_MESSAGES.fetchFailed });
  }
};

export const filterAnime = async (
  req: Request<{}, {}, FilterRequestBody>,
  res: Response
) => {
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
};

export const fetchAnime = async (_req: Request, res: Response) => {
  try {
    res.json({ message: SUCCESS_MESSAGES.fetchStarted });
    await fetchAllAnimePages();
    await cleanExistingJsonFile();
  } catch (error) {
    console.error(ERROR_MESSAGES.fetchError, error);
  }
};

export const getFilterInfo = (_req: Request, res: Response) => {
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
};
