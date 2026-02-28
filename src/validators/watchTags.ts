import { z } from "zod";

export const watchTagSchema = z
  .string()
  .trim()
  .min(1, "Tag is required")
  .max(48, "Tag must be at most 48 characters");

export const watchTagColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #22c55e")
  .optional();

