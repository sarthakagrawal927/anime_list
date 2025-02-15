import { AnimeField, FilterAction } from "../config";

export interface Filter {
  field: AnimeField;
  value: string | number | string[];
  action: FilterAction;
}

export interface FilterRequestBody {
  filters: Filter[];
}

export const NUMERIC_FIELDS = [
  AnimeField.Score,
  AnimeField.ScoredBy,
  AnimeField.Rank,
  AnimeField.Popularity,
  AnimeField.Members,
  AnimeField.Favorites,
  AnimeField.Year,
  AnimeField.Episodes,
] as const;

export const ARRAY_FIELDS = [
  AnimeField.Genres,
  AnimeField.Themes,
  AnimeField.Demographics,
] as const;

export const STRING_FIELDS = [
  AnimeField.Type,
  AnimeField.Season,
] as const;

export const COMPARISON_ACTIONS = [
  FilterAction.GreaterThan,
  FilterAction.GreaterThanOrEquals,
  FilterAction.LessThan,
  FilterAction.LessThanOrEquals,
] as const;

export const ARRAY_ACTIONS = [
  FilterAction.IncludesAll,
  FilterAction.IncludesAny,
  FilterAction.Excludes,
] as const;

export type NumericField = typeof NUMERIC_FIELDS[number];
export type ArrayField = typeof ARRAY_FIELDS[number];
export type StringField = typeof STRING_FIELDS[number];
export type ComparisonAction = typeof COMPARISON_ACTIONS[number];
export type ArrayAction = typeof ARRAY_ACTIONS[number];
