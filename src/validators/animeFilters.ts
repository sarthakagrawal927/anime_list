import { AnimeField, FilterAction } from "../config";
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

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFilter = (filter: Filter): ValidationResult => {
  const { field, value, action } = filter;

  // Check if field exists
  if (!Object.values(AnimeField).includes(field)) {
    return {
      isValid: false,
      error: `Invalid field: ${field}. Must be one of: ${Object.values(AnimeField).join(", ")}`,
    };
  }

  // Validate numeric field operations
  if (NUMERIC_FIELDS.includes(field as NumericField)) {
    if (!COMPARISON_ACTIONS.includes(action as any) && action !== FilterAction.Equals) {
      return {
        isValid: false,
        error: `Invalid action for numeric field ${field}: ${action}. Must be one of: ${[
          ...COMPARISON_ACTIONS,
          FilterAction.Equals,
        ].join(", ")}`,
      };
    }
    if (typeof value !== "number") {
      return {
        isValid: false,
        error: `Invalid value type for numeric field ${field}: ${typeof value}. Must be a number`,
      };
    }
  }

  // Validate array field operations
  if (ARRAY_FIELDS.includes(field as ArrayField)) {
    if (!ARRAY_ACTIONS.includes(action as any)) {
      return {
        isValid: false,
        error: `Invalid action for array field ${field}: ${action}. Must be one of: ${ARRAY_ACTIONS.join(
          ", "
        )}`,
      };
    }
    if (action === FilterAction.Excludes && typeof value !== "string") {
      return {
        isValid: false,
        error: `Invalid value type for EXCLUDES action: ${typeof value}. Must be a string`,
      };
    }
    if (
      (action === FilterAction.IncludesAll || action === FilterAction.IncludesAny) &&
      (!Array.isArray(value) || !value.every((v) => typeof v === "string"))
    ) {
      return {
        isValid: false,
        error: `Invalid value type for ${action} action: ${typeof value}. Must be an array of strings`,
      };
    }
  }

  // Validate string field operations
  if (STRING_FIELDS.includes(field as StringField)) {
    if (action !== FilterAction.Equals) {
      return {
        isValid: false,
        error: `Invalid action for string field ${field}: ${action}. Must be EQUALS`,
      };
    }
    if (typeof value !== "string") {
      return {
        isValid: false,
        error: `Invalid value type for string field ${field}: ${typeof value}. Must be a string`,
      };
    }
  }

  return { isValid: true };
};
