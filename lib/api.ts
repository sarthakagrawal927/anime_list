import type {
  FieldOptions,
  FilterActions,
  SearchResponse,
  SearchFilter,
  AnimeStats,
  WatchlistData,
  EnrichedWatchlistResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const BASE = `${API_URL}/api`;

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("mal_auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.token || null;
    }
  } catch {}
  return null;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    headers: { "Content-Type": "application/json", ...authHeaders() },
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
  return fetchJson(url, { headers: authHeaders() });
}

export function addToWatchlist(
  malIds: number[],
  status: string
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watched/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ mal_ids: malIds, status }),
  });
}

export function getEnrichedWatchlist(): Promise<EnrichedWatchlistResponse> {
  return fetchJson(`${BASE}/watchlist/enriched`, { headers: authHeaders() });
}
