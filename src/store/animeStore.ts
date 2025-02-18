import { AnimeItem } from "../types/anime";

class AnimeStore {
  private animeList: AnimeItem[] = [];
  private static instance: AnimeStore;

  private constructor() {}

  static getInstance(): AnimeStore {
    if (!AnimeStore.instance) {
      AnimeStore.instance = new AnimeStore();
    }
    return AnimeStore.instance;
  }

  setAnimeList(list: AnimeItem[]): void {
    this.animeList = list;
  }

  getAnimeList(): AnimeItem[] {
    return this.animeList;
  }

  clearStore(): void {
    this.animeList = [];
  }
}

// Export a singleton instance
export const animeStore = AnimeStore.getInstance();
