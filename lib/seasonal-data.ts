import { promises as fs } from "fs";
import path from "path";

export interface SeasonAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  type: string | null;
  episodes: number | null;
  score: number | null;
  members: number | null;
  rank: number | null;
  image: string | null;
  synopsis: string | null;
  status: string | null;
  genres: string[];
}

export interface SeasonBucket {
  year: number;
  season: string;
  count: number;
  topImage: string | null;
}

type RawAnime = {
  mal_id: number;
  title?: string;
  title_english?: string | null;
  type?: string | null;
  episodes?: number | null;
  score?: number | null;
  members?: number | null;
  rank?: number | null;
  image?: string | null;
  synopsis?: string | null;
  status?: string | null;
  year?: number | null;
  season?: string | null;
  genres?: Record<string, number>;
};

let cache: RawAnime[] | null = null;
let cachePromise: Promise<RawAnime[]> | null = null;

async function loadAll(): Promise<RawAnime[]> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const file = path.join(process.cwd(), "cleaned_anime_data.json");
    const text = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(text) as RawAnime[];
    cache = parsed;
    return parsed;
  })();
  return cachePromise;
}

export const SEASON_ORDER = ["winter", "spring", "summer", "fall"] as const;
export type Season = (typeof SEASON_ORDER)[number];

export function isSeason(s: string): s is Season {
  return (SEASON_ORDER as readonly string[]).includes(s);
}

function project(a: RawAnime): SeasonAnime {
  return {
    mal_id: a.mal_id,
    title: a.title ?? "Untitled",
    title_english: a.title_english ?? null,
    type: a.type ?? null,
    episodes: a.episodes ?? null,
    score: a.score ?? null,
    members: a.members ?? null,
    rank: a.rank ?? null,
    image: a.image ?? null,
    synopsis: a.synopsis ?? null,
    status: a.status ?? null,
    genres: a.genres ? Object.keys(a.genres) : [],
  };
}

/** Returns one bucket per (year, season) with at least 1 entry. */
export async function listSeasonBuckets(): Promise<SeasonBucket[]> {
  const all = await loadAll();
  const byKey = new Map<string, { year: number; season: Season; items: RawAnime[] }>();

  for (const a of all) {
    if (!a.year || !a.season) continue;
    if (!isSeason(a.season)) continue;
    const key = `${a.year}-${a.season}`;
    let b = byKey.get(key);
    if (!b) {
      b = { year: a.year, season: a.season, items: [] };
      byKey.set(key, b);
    }
    b.items.push(a);
  }

  const buckets: SeasonBucket[] = [];
  for (const b of byKey.values()) {
    const top = [...b.items]
      .sort((x, y) => (y.members ?? 0) - (x.members ?? 0))[0];
    buckets.push({
      year: b.year,
      season: b.season,
      count: b.items.length,
      topImage: top?.image ?? null,
    });
  }

  buckets.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return SEASON_ORDER.indexOf(b.season as Season) - SEASON_ORDER.indexOf(a.season as Season);
  });

  return buckets;
}

/** Sorted by score desc, then members desc. */
export async function getSeason(year: number, season: Season): Promise<SeasonAnime[]> {
  const all = await loadAll();
  return all
    .filter((a) => a.year === year && a.season === season)
    .sort((x, y) => {
      const ds = (y.score ?? 0) - (x.score ?? 0);
      if (ds !== 0) return ds;
      return (y.members ?? 0) - (x.members ?? 0);
    })
    .map(project);
}

export async function listAllSeasonParams(): Promise<{ year: string; season: string }[]> {
  const buckets = await listSeasonBuckets();
  return buckets.map((b) => ({ year: String(b.year), season: b.season }));
}
