import type { FieldOptions, FilterActions } from "./types";

export const DEFAULT_FIELD_OPTIONS: FieldOptions = {
  numeric: ["score", "scored_by", "rank", "popularity", "members", "favorites", "year", "episodes"],
  array: ["genres", "themes", "demographics"],
  string: ["title", "title_english", "type", "season", "synopsis"],
};

export const DEFAULT_FILTER_ACTIONS: FilterActions = {
  comparison: ["EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUALS", "LESS_THAN", "LESS_THAN_OR_EQUALS"],
  array: ["INCLUDES_ALL", "INCLUDES_ANY", "EXCLUDES"],
};
