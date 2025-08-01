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

  async setAnimeList(animeData?: AnimeItem[] | null): Promise<void> {
    if (!animeData)
      animeData = await readJsonFile<AnimeItem[]>(FILE_PATHS.cleanAnimeData);
    if (!animeData) return console.error("No data found in anime data file");
    console.log(`Loaded ${animeData.length} anime. You can now use the API`);
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
