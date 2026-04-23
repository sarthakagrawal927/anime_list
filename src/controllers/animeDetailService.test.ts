import axios from "axios";
import {
  getAnimeRecommendationsCache,
  getAnimeRelationsCache,
  upsertAnimeRecommendationsCache,
  upsertAnimeRelationsCache,
} from "../db/animeDetailCache";
import { getAnimeDetailSupplementalData } from "./animeDetailService";

jest.mock("axios");
jest.mock("../db/animeDetailCache", () => ({
  getAnimeRecommendationsCache: jest.fn(),
  getAnimeRelationsCache: jest.fn(),
  upsertAnimeRecommendationsCache: jest.fn(),
  upsertAnimeRelationsCache: jest.fn(),
}));

const mockedAxios = jest.mocked(axios);
const mockedGetRelationsCache = jest.mocked(getAnimeRelationsCache);
const mockedGetRecommendationsCache = jest.mocked(getAnimeRecommendationsCache);
const mockedUpsertRelationsCache = jest.mocked(upsertAnimeRelationsCache);
const mockedUpsertRecommendationsCache = jest.mocked(upsertAnimeRecommendationsCache);

describe("animeDetailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses fresh cached relations and recommendations without calling Jikan", async () => {
    const now = new Date().toISOString();
    mockedGetRelationsCache.mockResolvedValue({
      malId: 1,
      data: [{ relation: "Sequel", entries: [{ mal_id: 2, type: "anime", name: "B", url: "u" }] }],
      fetchedAt: now,
    });
    mockedGetRecommendationsCache.mockResolvedValue({
      malId: 1,
      data: [{ entry: { mal_id: 3, title: "C", url: "v" }, votes: 42 }],
      fetchedAt: now,
    });

    const result = await getAnimeDetailSupplementalData(1);

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(result).toEqual({
      relations: [{ relation: "Sequel", entries: [{ mal_id: 2, type: "anime", name: "B", url: "u" }] }],
      recommendations: [{ entry: { mal_id: 3, title: "C", url: "v" }, votes: 42 }],
    });
  });

  it("refreshes stale cache from Jikan and persists normalized payloads", async () => {
    mockedGetRelationsCache.mockResolvedValue({
      malId: 1,
      data: [],
      fetchedAt: "2000-01-01T00:00:00.000Z",
    });
    mockedGetRecommendationsCache.mockResolvedValue({
      malId: 1,
      data: [],
      fetchedAt: "2000-01-01T00:00:00.000Z",
    });

    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith("/relations")) {
        return {
          data: {
            data: [
              {
                relation: "Prequel",
                entry: [
                  {
                    mal_id: 10,
                    type: "anime",
                    name: "Origin",
                    url: "https://example.com/origin",
                  },
                ],
              },
            ],
          },
        };
      }

      return {
        data: {
          data: [
            {
              entry: {
                mal_id: 11,
                title: "Similar Show",
                url: "https://example.com/similar",
                images: {
                  webp: { image_url: "https://example.com/similar.webp" },
                },
              },
              votes: 17,
            },
          ],
        },
      };
    });

    const result = await getAnimeDetailSupplementalData(1);

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedUpsertRelationsCache).toHaveBeenCalledWith(1, [
      {
        relation: "Prequel",
        entries: [
          {
            mal_id: 10,
            type: "anime",
            name: "Origin",
            url: "https://example.com/origin",
          },
        ],
      },
    ]);
    expect(mockedUpsertRecommendationsCache).toHaveBeenCalledWith(1, [
      {
        entry: {
          mal_id: 11,
          title: "Similar Show",
          url: "https://example.com/similar",
          image: "https://example.com/similar.webp",
        },
        votes: 17,
      },
    ]);
    expect(result.relations).toHaveLength(1);
    expect(result.recommendations).toHaveLength(1);
  });

  it("falls back to stale cached data when Jikan refresh fails", async () => {
    mockedGetRelationsCache.mockResolvedValue({
      malId: 1,
      data: [{ relation: "Side story", entries: [{ mal_id: 4, type: "anime", name: "D", url: "x" }] }],
      fetchedAt: "2000-01-01T00:00:00.000Z",
    });
    mockedGetRecommendationsCache.mockResolvedValue({
      malId: 1,
      data: [{ entry: { mal_id: 5, title: "E", url: "y" }, votes: 3 }],
      fetchedAt: "2000-01-01T00:00:00.000Z",
    });
    mockedAxios.get.mockRejectedValue(new Error("network"));

    const result = await getAnimeDetailSupplementalData(1);

    expect(result).toEqual({
      relations: [{ relation: "Side story", entries: [{ mal_id: 4, type: "anime", name: "D", url: "x" }] }],
      recommendations: [{ entry: { mal_id: 5, title: "E", url: "y" }, votes: 3 }],
    });
    expect(mockedUpsertRelationsCache).not.toHaveBeenCalled();
    expect(mockedUpsertRecommendationsCache).not.toHaveBeenCalled();
  });
});
