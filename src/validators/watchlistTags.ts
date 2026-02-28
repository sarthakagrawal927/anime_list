import { z } from "zod";
import { watchTagColorSchema, watchTagSchema } from "./watchTags";

export const watchlistTagSchema = z.object({
  tag: watchTagSchema,
  color: watchTagColorSchema,
});

export type WatchlistTagPayload = z.infer<typeof watchlistTagSchema>;

