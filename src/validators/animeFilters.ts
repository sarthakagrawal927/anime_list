import { AnimeField, FilterAction, Genre, Theme } from "../config";
import {
  Filter,
  NUMERIC_FIELDS,
  ARRAY_FIELDS,
  STRING_FIELDS,
  COMPARISON_ACTIONS,
  ARRAY_ACTIONS,
  NumericField,
  ArrayField,
  StringField,
} from "../types/anime";

// Types
type ValidationSuccess = { isValid: true };
type ValidationError = { isValid: false; errors: string[] };
export type ValidationResult = ValidationSuccess | ValidationError;

type FieldType = {
  numeric: { type: "numeric"; actions: typeof COMPARISON_ACTIONS };
  array: { type: "array"; actions: typeof ARRAY_ACTIONS };
  string: { type: "string"; actions: [FilterAction.Equals] };
};

// Utilities
const success: ValidationSuccess = { isValid: true };
const error = (message: string): ValidationError => ({
  isValid: false,
  errors: [message],
});

const getFieldType = (field: AnimeField): keyof FieldType => {
  if (NUMERIC_FIELDS.includes(field as NumericField)) return "numeric";
  if (ARRAY_FIELDS.includes(field as ArrayField)) return "array";
  if (STRING_FIELDS.includes(field as StringField)) return "string";
  throw new Error(`Unknown field type for ${field}`);
};

const getValidCategories = (field: AnimeField) =>
  field === AnimeField.Genres
    ? new Set(Object.values(Genre))
    : field === AnimeField.Themes
    ? new Set(Object.values(Theme))
    : new Set();

const validateArrayValues = (
  field: AnimeField,
  values: string[]
): ValidationResult => {
  const validCategories = getValidCategories(field);
  const invalidValues = values.filter(
    (value) => !validCategories.has(value as any)
  );

  if (invalidValues.length > 0) {
    return error(
      `Invalid ${field} values: ${invalidValues.join(
        ", "
      )}. Must be valid ${field} categories.`
    );
  }

  return success;
};

const fieldValidators = {
  numeric: {
    action: (action: FilterAction): ValidationResult =>
      COMPARISON_ACTIONS.includes(action as (typeof COMPARISON_ACTIONS)[number])
        ? success
        : error(
            `Invalid action: ${action}. Must be one of: ${COMPARISON_ACTIONS.join(
              ", "
            )}`
          ),
    value: (value: unknown): ValidationResult =>
      typeof value === "number"
        ? success
        : error(`Invalid value type: ${typeof value}. Must be a number`),
    multiplier: (multiplier: unknown): ValidationResult =>
      typeof multiplier === "number" || multiplier === undefined
        ? success
        : error(
            `Invalid multiplier type: ${typeof multiplier}. Must be a number`
          ),
  },
  array: {
    action: (action: FilterAction): ValidationResult =>
      ARRAY_ACTIONS.includes(action as (typeof ARRAY_ACTIONS)[number])
        ? success
        : error(
            `Invalid action: ${action}. Must be one of: ${ARRAY_ACTIONS.join(
              ", "
            )}`
          ),
    value: (
      value: unknown,
      action: FilterAction,
      field: AnimeField
    ): ValidationResult => {
      if (action === FilterAction.Excludes) {
        if (typeof value !== "string") {
          return error(`Invalid value type: ${typeof value}. Must be a string`);
        }
        // For Excludes, validate single value against valid categories
        return validateArrayValues(field, [value]);
      }

      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
        return error(
          `Invalid value type: ${typeof value}. Must be an array of strings`
        );
      }

      // For IncludesAll/IncludesAny, validate all values against valid categories
      return validateArrayValues(field, value);
    },
    multiplier: (
      multiplier: unknown,
      field: AnimeField,
      value: unknown
    ): ValidationResult => {
      if (!multiplier) return success;
      if (!Array.isArray(value)) return success;
      if (typeof multiplier !== "object" || multiplier === null) {
        return error(
          `Invalid multiplier type: ${typeof multiplier}. Must be an object mapping categories to numbers`
        );
      }

      const validCategories = getValidCategories(field);
      const entries = Object.entries(multiplier as Record<string, unknown>);
      const invalidKeys = entries.filter(
        ([key]) => !validCategories.has(key as any)
      );
      const invalidValues = entries.filter(
        ([_, val]) => typeof val !== "number"
      );

      if (invalidKeys.length > 0) {
        return error(
          `Invalid categories: ${invalidKeys.map(([key]) => key).join(", ")}`
        );
      }

      return invalidValues.length > 0
        ? error("All multiplier values must be numbers")
        : success;
    },
  },
  string: {
    action: (action: FilterAction): ValidationResult =>
      action === FilterAction.Equals
        ? success
        : error(`Invalid action: ${action}. Must be ${FilterAction.Equals}`),
    value: (value: unknown): ValidationResult =>
      typeof value === "string"
        ? success
        : error(`Invalid value type: ${typeof value}. Must be a string`),
    multiplier: (multiplier: unknown): ValidationResult =>
      typeof multiplier === "number" || multiplier === undefined
        ? success
        : error(
            `Invalid multiplier type: ${typeof multiplier}. Must be a number`
          ),
  },
};

const validateField = (field: AnimeField): ValidationResult =>
  Object.values(AnimeField).includes(field)
    ? success
    : error(
        `Invalid field: ${field}. Must be one of: ${Object.values(
          AnimeField
        ).join(", ")}`
      );

export const validateFilter = (filter: Filter): ValidationResult => {
  const { field, action, value, score_multiplier } = filter;

  const fieldValidation = validateField(field);
  if (!fieldValidation.isValid) return fieldValidation;

  const fieldType = getFieldType(field);
  const validator = fieldValidators[fieldType];

  const validations = [
    validator.action(action),
    validator.value(value, action, field),
    validator.multiplier(score_multiplier, field, value),
  ];

  const errors = validations
    .filter((result): result is ValidationError => !result.isValid)
    .flatMap((error) => error.errors);

  return errors.length > 0 ? { isValid: false, errors } : success;
};

export const validateFilters = (filters: Filter[]): ValidationResult => {
  const errors = filters
    .map(validateFilter)
    .filter((result): result is ValidationError => !result.isValid)
    .flatMap((error) => error.errors);

  return errors.length > 0 ? { isValid: false, errors } : success;
};
