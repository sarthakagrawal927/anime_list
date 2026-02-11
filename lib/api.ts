import type {
  FieldOptions,
  FilterActions,
  SearchResponse,
  SearchFilter,
  AnimeStats,
  WatchlistData,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const BASE = `${API_URL}/api`;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getFields(): Promise<FieldOptions> {
  return fetchJson(`${BASE}/fields`);
}

export function getFilterActions(): Promise<FilterActions> {
  return fetchJson(`${BASE}/filters`);
}

export function searchAnime(
  filters: SearchFilter[],
  opts: {
    pagesize?: number;
    sortBy?: string;
    airing?: "yes" | "no" | "any";
    hideWatched?: string[];
  } = {}
): Promise<SearchResponse> {
  return fetchJson(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filters,
      pagesize: opts.pagesize ?? 20,
      sortBy: opts.sortBy,
      airing: opts.airing ?? "any",
      hideWatched: opts.hideWatched ?? [],
    }),
  });
}

export function getStats(): Promise<AnimeStats> {
  return fetchJson(`${BASE}/stats`);
}

export function getWatchlist(status?: string): Promise<WatchlistData> {
  const url = status ? `${BASE}/watchlist?status=${status}` : `${BASE}/watchlist`;
  return fetchJson(url);
}

export function addToWatchlist(
  malIds: number[],
  status: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watched/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mal_ids: malIds, status }),
  });
}
