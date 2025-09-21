import { NextFunction, Request, Response } from "express";
import { z } from "zod";

type RequestSegment = "body" | "query" | "params";

interface ValidationOptions {
  errorMessage?: string;
  target?: RequestSegment;
}

const formatIssues = (issues: z.ZodIssue[]): string[] =>
  issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "input";
    return `${path}: ${issue.message}`;
  });

export const validate = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  options: ValidationOptions = {}
) => {
  const { errorMessage = "Invalid request payload", target = "body" } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(
      (req as Record<RequestSegment, unknown>)[target]
    );
    if (!result.success) {
      res.status(400).json({
        error: errorMessage,
        details: formatIssues(result.error.issues),
      });
      return;
    }

    (req as Record<RequestSegment, unknown>)[target] = result.data;
    next();
  };
};
