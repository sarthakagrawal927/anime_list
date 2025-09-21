import { z } from "zod";
import { WatchStatus } from "../config";

const malIdSchema = z
  .union([z.string().min(1), z.number()])
  .transform((value) => value.toString());

export const watchedListSchema = z.object({
  mal_ids: z.array(malIdSchema).nonempty({
    message: "mal_ids must contain at least one id",
  }),
  status: z.nativeEnum(WatchStatus),
});

export type WatchedListPayload = z.infer<typeof watchedListSchema>;
