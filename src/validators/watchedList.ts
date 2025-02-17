import { ValidationResult } from "./animeFilters";
import { WatchStatus } from "../config";

export interface WatchedListPayload {
  mal_id: string;
  status: WatchStatus;
}

export const validateWatchedListPayload = (
  payload: unknown
): ValidationResult => {
  if (!payload || typeof payload !== "object") {
    return {
      isValid: false,
      error: "Invalid payload: expected an object",
    };
  }

  const { mal_id, status } = payload as WatchedListPayload;

  if (!mal_id || typeof mal_id !== "string") {
    return {
      isValid: false,
      error: "Invalid mal_id: expected a string",
    };
  }

  if (!status || !Object.values(WatchStatus).includes(status)) {
    return {
      isValid: false,
      error: `Invalid status: must be one of ${Object.values(WatchStatus).join(", ")}`,
    };
  }

  return {
    isValid: true,
  };
};
