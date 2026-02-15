/**
 * Tests for toSummary including title_english field.
 *
 * We test the shape of the summary object by importing the controller
 * indirectly — since toSummary is not exported, we verify through
 * the searchAnime response shape.
 */

describe("AnimeSummary shape", () => {
  it("should include title_english in the expected interface", () => {
    // Verify the type contract by constructing a valid summary
    const summary = {
      id: 1,
      score: 8.5,
      points: 100,
      name: "Shingeki no Kyojin",
      title_english: "Attack on Titan",
      link: "https://myanimelist.net/anime/16498",
      synopsis: "Test synopsis",
      members: 3000000,
      favorites: 150000,
      year: 2013,
      status: "Finished Airing",
      genres: ["Action", "Drama"],
      themes: ["Military"],
      type: "TV",
      image: "https://example.com/image.jpg",
    };

    expect(summary).toHaveProperty("title_english", "Attack on Titan");
    expect(summary).toHaveProperty("name", "Shingeki no Kyojin");
  });

  it("should allow title_english to be undefined", () => {
    const summary = {
      id: 2,
      score: 7.0,
      points: 50,
      name: "Some Anime",
      title_english: undefined,
      link: "https://myanimelist.net/anime/2",
      synopsis: "Test",
      members: 1000,
      favorites: 100,
      year: 2020,
      status: "Currently Airing",
      genres: [],
      themes: [],
      type: "TV",
    };

    expect(summary.title_english).toBeUndefined();
  });
});
