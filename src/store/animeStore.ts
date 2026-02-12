import { AnimeItem } from "../types/anime";
import { getAllAnime } from "../db/animeData";

class AnimeStore {
  private animeList: AnimeItem[] = [];
  private static instance: AnimeStore;
  private lastLoadedAt: number = 0;
  private isRefreshing: boolean = false;
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
    const now = Date.now();
    const isExpired = now - this.lastLoadedAt > this.CACHE_TTL;
    const isEmpty = this.animeList.length === 0;

    // If cache is empty, must load synchronously (blocking, only first time)
    if (isEmpty) {
      console.log("Cache empty, loading from database...");
      await this.setAnimeList();
      return this.animeList;
    }

    // If cache is stale, refresh in background (non-blocking)
    if (isExpired && !this.isRefreshing) {
      console.log("Cache stale, refreshing in background...");
      this.isRefreshing = true;

      // Fire-and-forget background refresh
      this.setAnimeList()
        .then(() => {
          console.log("✓ Background refresh complete");
          this.isRefreshing = false;
        })
        .catch((err) => {
          console.error("✗ Background refresh failed:", err);
          this.isRefreshing = false;
        });
    }

    // Always return current cache immediately (stale-while-revalidate)
    return this.animeList;
  }

  clearStore(): void {
    this.animeList = [];
    this.lastLoadedAt = 0;
    this.isRefreshing = false;
  }
}

// Export a singleton instance
export const animeStore = AnimeStore.getInstance();
