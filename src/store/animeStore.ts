import { AnimeItem } from "../types/anime";
import { getAllAnime } from "../db/animeData";

class AnimeStore {
  private animeList: AnimeItem[] = [];
  private static instance: AnimeStore;
  private lastLoadedAt: number = 0;
  // Production: Long cache since Turso is remote (1 hour)
  // Cron job updates DB daily, manual refresh if needed
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

  private constructor() {}

  static getInstance(): AnimeStore {
    if (!AnimeStore.instance) {
      AnimeStore.instance = new AnimeStore();
    }
    return AnimeStore.instance;
  }

  async setAnimeList(animeData?: AnimeItem[] | null): Promise<void> {
    if (!animeData) {
      // Load from Turso database
      animeData = await getAllAnime();
    }
    if (!animeData || animeData.length === 0) {
      return console.error("No anime data found in database");
    }
    console.log(`Loaded ${animeData.length} anime from database`);
    this.animeList = animeData;
    this.lastLoadedAt = Date.now();
  }

  async getAnimeList(): Promise<AnimeItem[]> {
    // Auto-refresh cache if expired
    if (Date.now() - this.lastLoadedAt > this.CACHE_TTL) {
      console.log("Cache expired, reloading anime data...");
      await this.setAnimeList();
    }
    return this.animeList;
  }

  clearStore(): void {
    this.animeList = [];
    this.lastLoadedAt = 0;
  }
}

// Export a singleton instance
export const animeStore = AnimeStore.getInstance();
