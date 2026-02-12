import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ERROR_MESSAGES, SERVER_CONFIG } from "./config";
import mangaRoutes from "./routes/mangaRoutes";
import animeRoutes from "./routes/animeRoutes";
import authRoutes from "./routes/authRoutes";
import { logger } from "./utils/logger";

const { routes } = SERVER_CONFIG;

const ALLOWED_ORIGINS = [
  "https://anime-explorer-mal.vercel.app",
  process.env.NODE_ENV !== "production" && "http://localhost:3000",
].filter(Boolean) as string[];

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(compression());
  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(routes.base, authRoutes);
  app.use(`${routes.base}/manga`, mangaRoutes);
  app.use(animeRoutes);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled application error");
    res.status(500).json({ error: ERROR_MESSAGES.serverError });
  });

  return app;
}
