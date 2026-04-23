import { getAnimeByMalId } from "../../db/animeData";
import {
  getAnimeWatchlistEntry,
  updateAnimeWatchlistNote,
} from "../../db/watchlist";
import { animeStore } from "../../store/animeStore";
import { getAnimeDetailSupplementalData } from "../animeDetailService";
import {
  getAnimeDetailByMalId,
  updateAnimeWatchlistNoteHandler,
} from "../animeDetailController";

jest.mock("../../db/animeData", () => ({
  getAnimeByMalId: jest.fn(),
}));

jest.mock("../../db/watchlist", () => ({
  getAnimeWatchlistEntry: jest.fn(),
  updateAnimeWatchlistNote: jest.fn(),
}));

jest.mock("../../store/animeStore", () => ({
  animeStore: {
    getAnimeList: jest.fn(),
  },
}));

jest.mock("../animeDetailService", () => ({
  getAnimeDetailSupplementalData: jest.fn(),
}));

const mockedGetAnimeByMalId = jest.mocked(getAnimeByMalId);
const mockedGetAnimeWatchlistEntry = jest.mocked(getAnimeWatchlistEntry);
const mockedUpdateAnimeWatchlistNote = jest.mocked(updateAnimeWatchlistNote);
const mockedGetAnimeDetailSupplementalData = jest.mocked(getAnimeDetailSupplementalData);
const mockedGetAnimeList = jest.mocked(animeStore.getAnimeList);

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
};

describe("animeDetailController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns local anime metadata with supplemental detail and watchlist note", async () => {
    mockedGetAnimeByMalId.mockResolvedValue({
      mal_id: 1,
      url: "https://myanimelist.net/anime/1",
      title: "Cowboy Bebop",
      title_english: "Cowboy Bebop",
      type: "TV",
      score: 8.7,
      status: "Finished Airing",
      year: 1998,
      genres: {},
      themes: {},
      demographics: {},
    });
    mockedGetAnimeDetailSupplementalData.mockResolvedValue({
      relations: [{ relation: "Sequel", entries: [{ mal_id: 2, type: "anime", name: "Movie", url: "u" }] }],
      recommendations: [{ entry: { mal_id: 3, title: "Samurai Champloo", url: "v" }, votes: 10 }],
    });
    mockedGetAnimeList.mockResolvedValue([
      {
        mal_id: 1,
        url: "https://myanimelist.net/anime/1",
        title: "Cowboy Bebop",
        title_english: "Cowboy Bebop",
        type: "TV",
        score: 8.7,
        status: "Finished Airing",
        year: 1998,
        genres: {},
        themes: {},
        demographics: {},
      },
      {
        mal_id: 2,
        url: "https://myanimelist.net/anime/2",
        title: "Cowboy Bebop: The Movie",
        title_english: "Cowboy Bebop: The Movie",
        type: "Movie",
        year: 2001,
        genres: {},
        themes: {},
        demographics: {},
      },
      {
        mal_id: 3,
        url: "https://myanimelist.net/anime/3",
        title: "Samurai Champloo",
        title_english: "Samurai Champloo",
        type: "TV",
        year: 2004,
        genres: {},
        themes: {},
        demographics: {},
      },
    ] as any);
    mockedGetAnimeWatchlistEntry.mockResolvedValue({
      id: "1",
      status: "Watching",
      note: "Rewatch dub",
    });

    const res = createResponse();
    await getAnimeDetailByMalId(
      {
        params: { malId: 1 },
        user: { userId: "user-1", email: "u@example.com", name: "User" },
      } as any,
      res as any,
    );

    expect(res.json).toHaveBeenCalledWith({
      anime: expect.objectContaining({
        mal_id: 1,
        title: "Cowboy Bebop",
        genres: [],
      }),
      relations: [
        expect.objectContaining({
          mal_id: 2,
          relation: "Sequel",
          title: "Cowboy Bebop: The Movie",
        }),
      ],
      recommendations: [
        expect.objectContaining({
          mal_id: 3,
          title: "Samurai Champloo",
          votes: 10,
        }),
      ],
      watchlistEntry: { status: "Watching", note: "Rewatch dub" },
    });
  });

  it("returns 404 when the anime is missing locally", async () => {
    mockedGetAnimeByMalId.mockResolvedValue(null);

    const res = createResponse();
    await getAnimeDetailByMalId(
      {
        params: { malId: 9999 },
      } as any,
      res as any,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Anime not found" });
  });

  it("rejects note updates for anime that are not already in the watchlist", async () => {
    mockedUpdateAnimeWatchlistNote.mockResolvedValue(false);

    const res = createResponse();
    await updateAnimeWatchlistNoteHandler(
      {
        params: { malId: 1 },
        body: { note: "Track later" },
        user: { userId: "user-1", email: "u@example.com", name: "User" },
      } as any,
      res as any,
    );

    expect(mockedUpdateAnimeWatchlistNote).toHaveBeenCalledWith(
      "1",
      "Track later",
      "user-1",
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Anime is not in the watchlist" });
  });

  it("allows blank note payloads to clear an existing private note", async () => {
    mockedUpdateAnimeWatchlistNote.mockResolvedValue(true);

    const res = createResponse();
    await updateAnimeWatchlistNoteHandler(
      {
        params: { malId: 1 },
        body: { note: "   " },
        user: { userId: "user-1", email: "u@example.com", name: "User" },
      } as any,
      res as any,
    );

    expect(mockedUpdateAnimeWatchlistNote).toHaveBeenCalledWith("1", null, "user-1");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Watchlist note updated",
    });
  });
});
