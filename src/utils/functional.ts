import { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function catcher(fn: AsyncRequestHandler) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (err: Error | any) {
      console.error(err.message);
      res.status(500).json({ message: err.message });
    }
  };
}
