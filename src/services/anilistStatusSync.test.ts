import type { AnimeItem } from "../types/anime";
import {
  applyAniListStatusUpdates,
  mapAniListStatus,
} from "./anilistStatusSync";

const baseAnime: AnimeItem = {
  mal_id: 1,
  url: "https://myanimelist.net/anime/1",
  title: "Cowboy Bebop",
  title_english: "Cowboy Bebop",
  status: "Currently Airing",
  episodes: 24,
  genres: {},
  themes: {},
  demographics: {},
};

describe("anilistStatusSync", () => {
  it("maps AniList statuses to the app's airing strings", () => {
    expect(mapAniListStatus("RELEASING")).toBe("Currently Airing");
    expect(mapAniListStatus("FINISHED")).toBe("Finished Airing");
    expect(mapAniListStatus("NOT_YET_RELEASED")).toBe("Not yet aired");
    expect(mapAniListStatus("HIATUS")).toBe("Hiatus");
    expect(mapAniListStatus("CANCELLED")).toBe("Cancelled");
  });

  it("detects status and episode changes", () => {
    const { changedAnime, changes, missingMalIds } = applyAniListStatusUpdates(
      [baseAnime],
      [
        {
          idMal: 1,
          status: "FINISHED",
          episodes: 26,
        },
      ]
    );

    expect(missingMalIds).toEqual([]);
    expect(changedAnime).toHaveLength(1);
    expect(changedAnime[0]).toEqual(
      expect.objectContaining({
        mal_id: 1,
        status: "Finished Airing",
        episodes: 26,
      })
    );
    expect(changes).toEqual([
      expect.objectContaining({
        malId: 1,
        previousStatus: "Currently Airing",
        nextStatus: "Finished Airing",
        previousEpisodes: 24,
        nextEpisodes: 26,
      }),
    ]);
  });

  it("reports missing MAL ids when AniList has no matching entry", () => {
    const { changedAnime, changes, missingMalIds } = applyAniListStatusUpdates(
      [baseAnime],
      []
    );

    expect(changedAnime).toEqual([]);
    expect(changes).toEqual([]);
    expect(missingMalIds).toEqual([1]);
  });
});
