import type { AnimeSummary } from "../types";

describe("AnimeSummary type", () => {
  it("should accept object with title_english", () => {
    const anime: AnimeSummary = {
      id: 1,
      score: 9.0,
      points: 200,
      name: "Fullmetal Alchemist: Brotherhood",
      title_english: "Fullmetal Alchemist: Brotherhood",
      link: "https://myanimelist.net/anime/5114",
      synopsis: "Test",
      members: 3000000,
      favorites: 200000,
      year: 2009,
      status: "Finished Airing",
      genres: ["Action", "Adventure"],
      themes: ["Military"],
      type: "TV",
      image: "https://example.com/fma.jpg",
    };

    expect(anime.title_english).toBe("Fullmetal Alchemist: Brotherhood");
  });

  it("should accept object without title_english (optional)", () => {
    const anime: AnimeSummary = {
      id: 2,
      score: 8.0,
      points: 100,
      name: "Test Anime",
      link: "https://example.com",
      synopsis: "Test",
      members: 1000,
      favorites: 50,
      year: 2020,
      status: "Finished Airing",
      genres: [],
      themes: [],
      type: "TV",
    };

    expect(anime.title_english).toBeUndefined();
  });

  it("should prefer English title when available", () => {
    const anime: AnimeSummary = {
      id: 3,
      score: 8.5,
      points: 150,
      name: "Shingeki no Kyojin",
      title_english: "Attack on Titan",
      link: "https://example.com",
      synopsis: "Test",
      members: 2000000,
      favorites: 100000,
      year: 2013,
      status: "Finished Airing",
      genres: ["Action"],
      themes: [],
      type: "TV",
    };

    const displayTitle = anime.title_english || anime.name;
    expect(displayTitle).toBe("Attack on Titan");
  });

  it("should fall back to name when title_english is absent", () => {
    const anime: AnimeSummary = {
      id: 4,
      score: 7.5,
      points: 80,
      name: "Kimetsu no Yaiba",
      link: "https://example.com",
      synopsis: "Test",
      members: 1500000,
      favorites: 80000,
      year: 2019,
      status: "Finished Airing",
      genres: ["Action"],
      themes: [],
      type: "TV",
    };

    const displayTitle = anime.title_english || anime.name;
    expect(displayTitle).toBe("Kimetsu no Yaiba");
  });
});
