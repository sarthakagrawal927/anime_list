import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES, SERVER_CONFIG } from "./config";
import mangaRoutes from "./routes/mangaRoutes";
import animeRoutes from "./routes/animeRoutes";
import { logger } from "./utils/logger";

const { routes } = SERVER_CONFIG;

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(compression());
  app.use(cors());

  app.use(`${routes.base}/manga`, mangaRoutes);
  app.use(animeRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled application error");
    res.status(500).json({ error: ERROR_MESSAGES.serverError });
  });

  return app;
}
