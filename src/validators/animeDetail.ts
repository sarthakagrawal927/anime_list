import { z } from "zod";

export const animeMalIdParamsSchema = z.object({
  malId: z.coerce.number().int().positive(),
});

export const animeDetailNoteSchema = z.object({
  note: z.string().max(2000, "note must be at most 2000 characters"),
});

export type AnimeMalIdParams = z.infer<typeof animeMalIdParamsSchema>;
export type AnimeDetailNoteBody = z.infer<typeof animeDetailNoteSchema>;
