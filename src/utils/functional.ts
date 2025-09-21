import { NextFunction, Request, Response } from "express";
import { logger } from "./logger";

type AsyncRequestHandler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function catcher<Req extends Request>(fn: AsyncRequestHandler<Req>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await fn(req as Req, res, next);
    } catch (err: Error | any) {
      logger.error({ err }, "Request handler failed");
      next(err instanceof Error ? err : new Error("Unexpected error"));
    }
  };
}
