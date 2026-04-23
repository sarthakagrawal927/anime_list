import {
  getAnimeWatchlist,
  upsertAnimeWatchlist,
} from "../../db/watchlist";
import {
  getSchedule,
  upsertScheduleItems,
} from "../../db/schedule";
import { animeStore } from "../../store/animeStore";
import {
  addToScheduleHandler,
  getScheduleTimeline,
} from "../scheduleController";

jest.mock("../../db/watchlist", () => ({
  getAnimeWatchlist: jest.fn(),
  upsertAnimeWatchlist: jest.fn(),
}));

jest.mock("../../db/schedule", () => ({
  getSchedule: jest.fn(),
  upsertScheduleItems: jest.fn(),
  updateScheduleItem: jest.fn(),
  removeScheduleItems: jest.fn(),
  reorderSchedule: jest.fn(),
}));

jest.mock("../../store/animeStore", () => ({
  animeStore: {
    getAnimeList: jest.fn(),
  },
}));

const mockedGetAnimeWatchlist = jest.mocked(getAnimeWatchlist);
const mockedUpsertAnimeWatchlist = jest.mocked(upsertAnimeWatchlist);
const mockedGetSchedule = jest.mocked(getSchedule);
const mockedUpsertScheduleItems = jest.mocked(upsertScheduleItems);
const mockedGetAnimeList = jest.mocked(animeStore.getAnimeList);

const createResponse = () => {
  const res = {
    json: jest.fn(),
  };
  return res;
};

describe("scheduleController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not backfill schedule rows from watchlist items marked Watching", async () => {
    mockedGetSchedule.mockResolvedValue([]);
    mockedGetAnimeWatchlist.mockResolvedValue({
      user: { id: "user-1", name: "User" },
      anime: {
        "1": {
          id: "1",
          status: "Watching",
        },
      },
    });
    mockedGetAnimeList.mockResolvedValue([
      {
        mal_id: 1,
        url: "https://myanimelist.net/anime/1",
        title: "Cowboy Bebop",
        title_english: "Cowboy Bebop",
        type: "TV",
        episodes: 26,
        score: 8.7,
        genres: {},
        themes: {},
        demographics: {},
      },
    ] as any);

    const res = createResponse();
    await getScheduleTimeline(
      {
        user: { userId: "user-1", email: "u@example.com", name: "User" },
      } as any,
      res as any,
    );

    expect(mockedUpsertScheduleItems).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
      }),
    );
  });

  it("keeps watchlist status as display-only metadata for scheduled items", async () => {
    mockedGetSchedule.mockResolvedValue([
      {
        mal_id: "1",
        episodes_per_day: 3,
        sort_order: 0,
        episodes_watched: 0,
      },
    ]);
    mockedGetAnimeWatchlist.mockResolvedValue({
      user: { id: "user-1", name: "User" },
      anime: {
        "1": {
          id: "1",
          status: "Done",
        },
      },
    });
    mockedGetAnimeList.mockResolvedValue([
      {
        mal_id: 1,
        url: "https://myanimelist.net/anime/1",
        title: "Cowboy Bebop",
        title_english: "Cowboy Bebop",
        type: "TV",
        episodes: 26,
        score: 8.7,
        genres: {},
        themes: {},
        demographics: {},
      },
    ] as any);

    const res = createResponse();
    await getScheduleTimeline(
      {
        user: { userId: "user-1", email: "u@example.com", name: "User" },
      } as any,
      res as any,
    );

    expect(mockedUpsertScheduleItems).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            mal_id: "1",
            watchStatus: "Done",
          }),
        ],
      }),
    );
  });

  it("does not add watchlist entries when adding anime to the schedule", async () => {
    const res = createResponse();
    await addToScheduleHandler(
      {
        user: { userId: "user-1", email: "u@example.com", name: "User" },
        body: {
          mal_ids: ["1"],
          episodes_per_day: 4,
        },
      } as any,
      res as any,
    );

    expect(mockedUpsertScheduleItems).toHaveBeenCalledWith("user-1", [
      { malId: "1", episodesPerDay: 4 },
    ]);
    expect(mockedUpsertAnimeWatchlist).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Added to schedule",
    });
  });
});
