import { ValidationResult } from "./animeFilters";
import { WatchStatus } from "../config";

export interface WatchedListPayload {
  mal_ids: string;
  status: WatchStatus;
}

export const validateWatchedListPayload = (
  payload: unknown
): ValidationResult => {
  if (!payload || typeof payload !== "object") {
    return {
      isValid: false,
      errors: ["Invalid payload: expected an object"],
    };
  }

  const { mal_ids, status } = payload as WatchedListPayload;

  if (!mal_ids || !Array.isArray(mal_ids)) {
    return {
      isValid: false,
      errors: ["Invalid mal_ids: expected an array"],
    };
  }

  if (!status || !Object.values(WatchStatus).includes(status)) {
    return {
      isValid: false,
      errors: [
        `Invalid status: must be one of ${Object.values(WatchStatus).join(
          ", "
        )}`,
      ],
    };
  }

  return {
    isValid: true,
  };
};
