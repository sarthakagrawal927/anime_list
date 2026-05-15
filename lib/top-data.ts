import { promises as fs } from "fs";
import path from "path";

export type TopOrder = "score" | "members";

export interface TopAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  type: string | null;
  episodes: number | null;
  score: number | null;
  members: number | null;
  rank: number | null;
  image: string | null;
  year: number | null;
  season: string | null;
}

type RawAnime = TopAnime & { scored_by?: number | null };

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

export function isTopOrder(v: unknown): v is TopOrder {
  return v === "score" || v === "members";
}

/**
 * Top N by score. Cuts noisy under-rated titles (fewer than 5k scorers)
 * so the chart doesn't surface obscure shows with three perfect ratings.
 */
export async function getTopByScore(n = 200): Promise<TopAnime[]> {
  const all = await loadAll();
  return all
    .filter((a) => a.score != null && (a.scored_by ?? 0) >= 5000)
    .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))
    .slice(0, n)
    .map(project);
}

/** Top N by absolute MAL member count. */
export async function getTopByMembers(n = 200): Promise<TopAnime[]> {
  const all = await loadAll();
  return all
    .filter((a) => a.members != null)
    .sort((x, y) => (y.members ?? 0) - (x.members ?? 0))
    .slice(0, n)
    .map(project);
}

function project(a: RawAnime): TopAnime {
  return {
    mal_id: a.mal_id,
    title: a.title,
    title_english: a.title_english ?? null,
    type: a.type ?? null,
    episodes: a.episodes ?? null,
    score: a.score ?? null,
    members: a.members ?? null,
    rank: a.rank ?? null,
    image: a.image ?? null,
    year: a.year ?? null,
    season: a.season ?? null,
  };
}
