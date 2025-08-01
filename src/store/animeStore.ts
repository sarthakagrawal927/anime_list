import { FILE_PATHS } from "../config";
import { AnimeItem } from "../types/anime";
import { readJsonFile } from "../utils/file";

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

  setAnimeList(animeData: AnimeItem[]): void {
    this.animeList = animeData;
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
