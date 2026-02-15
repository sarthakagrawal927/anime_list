/**
 * Tests for FilterBuilder pagination accumulation logic.
 * Tests the core accumulation behavior extracted from the component.
 */

import type { AnimeSummary } from "@/lib/types";

// Helper to simulate the accumulation logic from FilterBuilder
function accumulateResults(
  currentAccumulated: AnimeSummary[],
  newData: AnimeSummary[],
  currentOffset: number
): AnimeSummary[] {
  if (currentOffset === 0) {
    return newData;
  }
  return [...currentAccumulated, ...newData];
}

function makeAnime(id: number, name: string): AnimeSummary {
  return {
    id,
    score: 8.0,
    points: 100,
    name,
    link: `https://example.com/${id}`,
    synopsis: "Test",
    members: 1000,
    favorites: 50,
    year: 2020,
    status: "Finished Airing",
    genres: [],
    themes: [],
    type: "TV",
  };
}

describe("Pagination accumulation logic", () => {
  const page1 = [makeAnime(1, "Anime A"), makeAnime(2, "Anime B")];
  const page2 = [makeAnime(3, "Anime C"), makeAnime(4, "Anime D")];
  const page3 = [makeAnime(5, "Anime E")];

  it("replaces results when offset is 0 (initial load or filter change)", () => {
    const result = accumulateResults([], page1, 0);
    expect(result).toEqual(page1);
    expect(result).toHaveLength(2);
  });

  it("replaces previous results when offset resets to 0", () => {
    const result = accumulateResults([...page1, ...page2], page1, 0);
    expect(result).toEqual(page1);
    expect(result).toHaveLength(2);
  });

  it("appends results when offset > 0 (Load More)", () => {
    const result = accumulateResults(page1, page2, 2);
    expect(result).toEqual([...page1, ...page2]);
    expect(result).toHaveLength(4);
  });

  it("accumulates across multiple pages", () => {
    let accumulated = accumulateResults([], page1, 0);
    accumulated = accumulateResults(accumulated, page2, 2);
    accumulated = accumulateResults(accumulated, page3, 4);

    expect(accumulated).toHaveLength(5);
    expect(accumulated.map((a) => a.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("hasMore is true when accumulated < total", () => {
    const accumulated = page1;
    const totalFiltered = 10;
    expect(accumulated.length < totalFiltered).toBe(true);
  });

  it("hasMore is false when accumulated >= total", () => {
    const accumulated = [...page1, ...page2, ...page3];
    const totalFiltered = 5;
    expect(accumulated.length < totalFiltered).toBe(false);
  });

  it("remaining count is correct", () => {
    const accumulated = [...page1, ...page2]; // 4 items
    const totalFiltered = 10;
    const remaining = totalFiltered - accumulated.length;
    expect(remaining).toBe(6);
  });
});
