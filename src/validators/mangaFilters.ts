import { z } from "zod";
import { FilterAction, WatchStatus } from "../config";
import {
  MANGA_ARRAY_FIELDS,
  MANGA_NUMERIC_FIELDS,
  MANGA_STRING_FIELDS,
  MANGA_BOOLEAN_FIELDS,
  MangaField,
  MangaFilter,
  MangaNumericField,
} from "../types/manga";

const numericFieldValues = MANGA_NUMERIC_FIELDS as [
  MangaNumericField,
  ...MangaNumericField[]
];
const arrayFieldValues = MANGA_ARRAY_FIELDS as [
  (typeof MANGA_ARRAY_FIELDS)[number],
  ...(typeof MANGA_ARRAY_FIELDS)[number][]
];
const stringFieldValues = MANGA_STRING_FIELDS as [
  (typeof MANGA_STRING_FIELDS)[number],
  ...(typeof MANGA_STRING_FIELDS)[number][]
];
const booleanFieldValues = MANGA_BOOLEAN_FIELDS as [
  (typeof MANGA_BOOLEAN_FIELDS)[number],
  ...(typeof MANGA_BOOLEAN_FIELDS)[number][]
];

const numericFieldSchema = z.enum(numericFieldValues);

const arrayFieldSchema = z.enum(arrayFieldValues);

const stringFieldSchema = z.enum(stringFieldValues);

const booleanFieldSchema = z.enum(booleanFieldValues);

const comparisonActionSchema = z.enum([
  FilterAction.Equals,
  FilterAction.GreaterThan,
  FilterAction.GreaterThanOrEquals,
  FilterAction.LessThan,
  FilterAction.LessThanOrEquals,
] as const);

const textActionSchema = z.enum([
  FilterAction.Equals,
  FilterAction.Contains,
] as const);

const booleanActionSchema = z.literal(FilterAction.Equals);

const numericFilterSchema = z.object({
  field: numericFieldSchema,
  action: comparisonActionSchema,
  value: z.number(),
  score_multiplier: z.number().optional(),
});

const arrayFilterIncludesSchema = z.object({
  field: arrayFieldSchema,
  action: z.enum([FilterAction.IncludesAll, FilterAction.IncludesAny] as const),
  value: z.array(z.string().min(1)).nonempty(),
  score_multiplier: z.record(z.number()).optional(),
});

const arrayFilterExcludesSchema = z.object({
  field: arrayFieldSchema,
  action: z.literal(FilterAction.Excludes),
  value: z.string().min(1),
  score_multiplier: z.record(z.number()).optional(),
});

const stringTextFilterSchema = z.object({
  field: stringFieldSchema,
  action: textActionSchema,
  value: z.string().min(1),
  score_multiplier: z.number().optional(),
});

const stringIncludesFilterSchema = z.object({
  field: stringFieldSchema,
  action: z.enum([FilterAction.IncludesAll, FilterAction.IncludesAny] as const),
  value: z.array(z.string().min(1)).nonempty(),
  score_multiplier: z.number().optional(),
});

const stringExcludesFilterSchema = z.object({
  field: stringFieldSchema,
  action: z.literal(FilterAction.Excludes),
  value: z.string().min(1),
  score_multiplier: z.number().optional(),
});

const booleanFilterSchema = z.object({
  field: booleanFieldSchema,
  action: booleanActionSchema,
  value: z.boolean(),
  score_multiplier: z.number().optional(),
});

export const mangaFilterSchema = z.union([
  numericFilterSchema,
  arrayFilterIncludesSchema,
  arrayFilterExcludesSchema,
  stringTextFilterSchema,
  stringIncludesFilterSchema,
  stringExcludesFilterSchema,
  booleanFilterSchema,
]) as z.ZodType<MangaFilter>;

export const mangaFiltersSchema = z.array(mangaFilterSchema);

export const mangaFilterRequestSchema = z.object({
  filters: mangaFiltersSchema,
  hideWatched: z.array(z.nativeEnum(WatchStatus)).default([]),
  pagesize: z.number().int().min(1).default(50),
  sortBy: numericFieldSchema.optional(),
});

export type MangaFilterRequestBody = z.infer<
  typeof mangaFilterRequestSchema
> & {
  sortBy?: MangaNumericField;
};
