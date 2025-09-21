import { z } from "zod";
import { AnimeField, FilterAction, Genre, Theme, WatchStatus } from "../config";
import { Filter, NumericField } from "../types/anime";

const numericFieldSchema = z.enum([
  AnimeField.Score,
  AnimeField.ScoredBy,
  AnimeField.Rank,
  AnimeField.Popularity,
  AnimeField.Members,
  AnimeField.Favorites,
  AnimeField.Year,
  AnimeField.Episodes,
] as const);

const arrayFieldSchema = z.enum([
  AnimeField.Genres,
  AnimeField.Themes,
  AnimeField.Demographics,
] as const);

const stringFieldSchema = z.enum([
  AnimeField.Title,
  AnimeField.TitleEnglish,
  AnimeField.Type,
  AnimeField.Season,
  AnimeField.Synopsis,
] as const);

const comparisonActionSchema = z.enum([
  FilterAction.Equals,
  FilterAction.GreaterThan,
  FilterAction.GreaterThanOrEquals,
  FilterAction.LessThan,
  FilterAction.LessThanOrEquals,
] as const);

const arrayActionIncludesSchema = z.enum([
  FilterAction.IncludesAll,
  FilterAction.IncludesAny,
] as const);

const textSearchActionSchema = z.enum([
  FilterAction.Equals,
  FilterAction.Contains,
] as const);

const getValidCategories = (field: AnimeField): Set<string> => {
  if (field === AnimeField.Genres) return new Set<string>(Object.values(Genre));
  if (field === AnimeField.Themes) return new Set<string>(Object.values(Theme));
  return new Set();
};

const ensureValidCategories = (
  field: AnimeField,
  values: string[],
  ctx: z.RefinementCtx,
  path: (string | number)[]
): void => {
  const validCategories = getValidCategories(field);
  if (validCategories.size === 0) {
    return;
  }

  const invalidValues = values.filter(
    (value) => !validCategories.has(value as Genre | Theme)
  );

  if (invalidValues.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid ${field} values: ${invalidValues.join(", ")}`,
      path,
    });
  }
};

const ensureValidMultiplierCategories = (
  field: AnimeField,
  multiplier: Record<string, number>,
  ctx: z.RefinementCtx
): void => {
  const validCategories = getValidCategories(field);
  if (validCategories.size === 0) {
    return;
  }

  const invalidKeys = Object.keys(multiplier).filter(
    (key) => !validCategories.has(key as Genre | Theme)
  );

  if (invalidKeys.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid categories in score_multiplier: ${invalidKeys.join(
        ", "
      )}`,
      path: ["score_multiplier"],
    });
  }
};

const numericFilterSchema = z.object({
  field: numericFieldSchema,
  action: comparisonActionSchema,
  value: z.number(),
  score_multiplier: z.number().optional(),
});

const arrayFilterIncludesSchema = z
  .object({
    field: arrayFieldSchema,
    action: arrayActionIncludesSchema,
    value: z.array(z.string().min(1)).nonempty(),
    score_multiplier: z.record(z.number()).optional(),
  })
  .superRefine((data, ctx) => {
    ensureValidCategories(data.field, data.value, ctx, ["value"]);
    if (data.score_multiplier) {
      ensureValidMultiplierCategories(data.field, data.score_multiplier, ctx);
    }
  });

const arrayFilterExcludesSchema = z
  .object({
    field: arrayFieldSchema,
    action: z.literal(FilterAction.Excludes),
    value: z.string().min(1),
    score_multiplier: z.record(z.number()).optional(),
  })
  .superRefine((data, ctx) => {
    ensureValidCategories(data.field, [data.value], ctx, ["value"]);
  });

const stringTextFilterSchema = z.object({
  field: stringFieldSchema,
  action: textSearchActionSchema,
  value: z.string().min(1),
  score_multiplier: z.number().optional(),
});

const stringIncludesFilterSchema = z.object({
  field: stringFieldSchema,
  action: arrayActionIncludesSchema,
  value: z.array(z.string().min(1)).nonempty(),
  score_multiplier: z.number().optional(),
});

const stringExcludesFilterSchema = z.object({
  field: stringFieldSchema,
  action: z.literal(FilterAction.Excludes),
  value: z.string().min(1),
  score_multiplier: z.number().optional(),
});

export const filterSchema = z.union([
  numericFilterSchema,
  arrayFilterIncludesSchema,
  arrayFilterExcludesSchema,
  stringTextFilterSchema,
  stringIncludesFilterSchema,
  stringExcludesFilterSchema,
]) as z.ZodType<Filter>;

export const filtersSchema = z.array(filterSchema);

const airingSchema = z.enum(["yes", "no", "any"] as const);

export const filterRequestSchema = z.object({
  filters: filtersSchema,
  hideWatched: z.array(z.nativeEnum(WatchStatus)).default([]),
  pagesize: z.number().int().min(1).default(20),
  sortBy: numericFieldSchema.optional(),
  airing: airingSchema.default("any"),
});

export type FilterRequestBody = z.infer<typeof filterRequestSchema> & {
  sortBy?: NumericField;
};

export type FiltersPayload = z.infer<typeof filtersSchema>;
