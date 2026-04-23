import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { AnimeSummary } from "@/lib/types";

const mockInvalidateQueries = jest.fn();
const mockMutate = jest.fn();
let mockUser: { id: string } | null = null;
let mockWatchlistData = {
  user: { id: "u1", name: "user" },
  anime: {} as Record<string, { status: string }>,
};

// Mock dependencies
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "watchlist" && queryKey[1] === "tags") {
      return { data: { tags: [] } };
    }
    if (queryKey[0] === "watchlist") {
      return { data: mockWatchlistData };
    }
    return { data: undefined };
  },
  useMutation: () => ({ mutate: mockMutate, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@/lib/api", () => ({
  addToWatchlist: jest.fn(),
  addToSchedule: jest.fn(),
  getWatchlist: jest.fn().mockResolvedValue({ user: { id: "u1", name: "user" }, anime: {} }),
  getWatchlistTags: jest.fn().mockResolvedValue({ tags: [] }),
}));

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ user: mockUser }),
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
  beforeEach(() => {
    mockUser = null;
    mockWatchlistData = {
      user: { id: "u1", name: "user" },
      anime: {},
    };
    mockInvalidateQueries.mockClear();
    mockMutate.mockClear();
  });

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

  it("routes internal detail links to the anime page", () => {
    render(<AnimeCard anime={baseAnime} />);

    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/anime/1")).toBe(true);
  });

  it("keeps an external MAL link available", () => {
    render(<AnimeCard anime={baseAnime} />);

    expect(
      screen.getByRole("link", { name: "Open Shingeki no Kyojin on MyAnimeList" }),
    ).toHaveAttribute("href", "https://myanimelist.net/anime/16498");
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

  it("keeps the watchlist control editable for anime already in the watchlist", () => {
    mockUser = { id: "u1" };
    mockWatchlistData = {
      user: { id: "u1", name: "user" },
      anime: {
        "1": { status: "Watching" },
      },
    };

    render(<AnimeCard anime={baseAnime} />);

    expect(
      screen.getByRole("button", { name: "Edit watchlist status: Watching" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Watching")).toBeInTheDocument();
  });
});
