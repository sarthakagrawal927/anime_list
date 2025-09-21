import compression from "compression";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ERROR_MESSAGES, SERVER_CONFIG } from "./config";
import mangaRoutes from "./routes/mangaRoutes";
import animeRoutes from "./routes/animeRoutes";
import { loadAnimeData, loadMangaData } from "./services/dataLoader";
import { logger } from "./utils/logger";

const app = express();
const { port, routes } = SERVER_CONFIG;

// Middleware
app.use(express.json());
app.use(compression());
app.use(cors());

// Mount routes
app.use(`${routes.base}/manga`, mangaRoutes);
app.use(animeRoutes);

// Error handling
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled application error");
  res.status(500).json({ error: ERROR_MESSAGES.serverError });
});

app.listen(port, async () => {
  try {
    await loadAnimeData();
    await loadMangaData();
    logger.info({ port }, "Server ready");
  } catch (error) {
    logger.fatal({ err: error }, "Failed to initialize server");
    process.exit(1);
  }
});
