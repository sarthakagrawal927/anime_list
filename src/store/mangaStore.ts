import { FILE_PATHS } from "../config";
import { MangaItem } from "../types/manga";
import { readJsonFile } from "../utils/file";

class MangaStore {
  private mangaList: MangaItem[] = [];
  private static instance: MangaStore;

  private constructor() {}

  static getInstance(): MangaStore {
    if (!MangaStore.instance) {
      MangaStore.instance = new MangaStore();
    }
    return MangaStore.instance;
  }

  async setMangaList(mangaData?: MangaItem[] | null): Promise<void> {
    if (!mangaData)
      mangaData = await readJsonFile<MangaItem[]>(FILE_PATHS.cleanMangaData);
    if (!mangaData) return console.error("No data found in manga data file");
    console.log(
      `Loaded ${mangaData.length} manga. You can now use the manga API`
    );
    this.mangaList = mangaData;
  }

  getMangaList(): MangaItem[] {
    return this.mangaList;
  }

  clearStore(): void {
    this.mangaList = [];
  }
}

// Export a singleton instance
export const mangaStore = MangaStore.getInstance();
