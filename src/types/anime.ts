import { AnimeField, FilterAction } from "../config";

export interface AnimeItem {
  mal_id: number;
  url?: string;
  title: string;
  title_english?: string;
  type?: string;
  episodes?: number;
  aired?: string;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  year?: number;
  season?: string;
  genres?: { [key: string]: number };
  themes?: { [key: string]: number };
  demographics?: { [key: string]: number };
}

export interface Filter {
  field: AnimeField;
  value: string | number | string[];
  action: FilterAction;
}

export interface FilterRequestBody {
  filters: Filter[];
  hideWatched: boolean;
}

export type NumericField =
  | AnimeField.Score
  | AnimeField.ScoredBy
  | AnimeField.Rank
  | AnimeField.Popularity
  | AnimeField.Members
  | AnimeField.Favorites
  | AnimeField.Year
  | AnimeField.Episodes;

export type ArrayField =
  | AnimeField.Genres
  | AnimeField.Themes
  | AnimeField.Demographics;

export type StringField =
  | AnimeField.Type
  | AnimeField.Season
  | AnimeField.Title
  | AnimeField.TitleEnglish
  | AnimeField.Synopsis
  | AnimeField.Url
  | AnimeField.Aired;

export const NUMERIC_FIELDS: NumericField[] = [
  AnimeField.Score,
  AnimeField.ScoredBy,
  AnimeField.Rank,
  AnimeField.Popularity,
  AnimeField.Members,
  AnimeField.Favorites,
  AnimeField.Year,
  AnimeField.Episodes,
];

export const ARRAY_FIELDS: ArrayField[] = [
  AnimeField.Genres,
  AnimeField.Themes,
  AnimeField.Demographics,
];

export const STRING_FIELDS: StringField[] = [
  AnimeField.Type,
  AnimeField.Season,
  AnimeField.Title,
  AnimeField.TitleEnglish,
  AnimeField.Synopsis,
  AnimeField.Url,
  AnimeField.Aired,
];

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

export type ComparisonAction = (typeof COMPARISON_ACTIONS)[number];
export type ArrayAction = (typeof ARRAY_ACTIONS)[number];

// Type guard for checking if a field is numeric
export const isNumericField = (field: AnimeField): field is NumericField => {
  return NUMERIC_FIELDS.includes(field as NumericField);
};

// Type guard for checking if a field is an array
export const isArrayField = (field: AnimeField): field is ArrayField => {
  return ARRAY_FIELDS.includes(field as ArrayField);
};

// Type guard for checking if a field is a string
export const isStringField = (field: AnimeField): field is StringField => {
  return STRING_FIELDS.includes(field as StringField);
};
