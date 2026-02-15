import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { AnimeSummary } from "@/lib/types";

// Mock dependencies
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  addToWatchlist: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: null }),
}));

// Import component after mocks
import AnimeCard from "../AnimeCard";

const baseAnime: AnimeSummary = {
  id: 1,
  score: 9.0,
  points: 200,
  name: "Shingeki no Kyojin",
  link: "https://myanimelist.net/anime/16498",
  synopsis: "Centuries ago, mankind was slaughtered to near extinction by monstrous humanoid creatures called Titans.",
  members: 3500000,
  favorites: 180000,
  year: 2013,
  status: "Finished Airing",
  genres: ["Action", "Drama"],
  themes: ["Military"],
  type: "TV",
  image: "https://example.com/aot.jpg",
};

describe("AnimeCard", () => {
  it("displays English title when title_english is provided", () => {
    const anime = { ...baseAnime, title_english: "Attack on Titan" };
    render(<AnimeCard anime={anime} />);

    expect(screen.getByText("Attack on Titan")).toBeInTheDocument();
  });

  it("falls back to Japanese name when title_english is undefined", () => {
    render(<AnimeCard anime={baseAnime} />);

    expect(screen.getByText("Shingeki no Kyojin")).toBeInTheDocument();
  });

  it("falls back to Japanese name when title_english is empty string", () => {
    const anime = { ...baseAnime, title_english: "" };
    render(<AnimeCard anime={anime} />);

    expect(screen.getByText("Shingeki no Kyojin")).toBeInTheDocument();
  });

  it("uses English title for image alt text", () => {
    const anime = { ...baseAnime, title_english: "Attack on Titan" };
    render(<AnimeCard anime={anime} />);

    const img = screen.getByAltText("Attack on Titan");
    expect(img).toBeInTheDocument();
  });

  it("uses Japanese name for image alt when no English title", () => {
    render(<AnimeCard anime={baseAnime} />);

    const img = screen.getByAltText("Shingeki no Kyojin");
    expect(img).toBeInTheDocument();
  });

  it("displays score badge", () => {
    render(<AnimeCard anime={baseAnime} />);

    expect(screen.getByText("9.0")).toBeInTheDocument();
  });

  it("displays year and member count", () => {
    render(<AnimeCard anime={baseAnime} />);

    expect(screen.getByText("2013")).toBeInTheDocument();
    expect(screen.getByText("3500k users")).toBeInTheDocument();
  });
});
