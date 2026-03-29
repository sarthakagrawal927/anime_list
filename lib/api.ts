import type {
  FieldOptions,
  FilterActions,
  SearchResponse,
  SearchFilter,
  AnimeStats,
  WatchlistData,
  EnrichedWatchlistResponse,
  WatchlistTag,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
  if (res.status === 401) {
    localStorage.removeItem("mal_auth");
    window.dispatchEvent(new Event("mal_auth_expired"));
    throw new Error("Session expired. Please sign in again.");
  }
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
    offset?: number;
    sortBy?: string;
    airing?: "yes" | "no" | "any";
    hideWatched?: string[];
    includeWatched?: string[];
  } = {}
): Promise<SearchResponse> {
  return fetchJson(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      filters,
      pagesize: opts.pagesize ?? 20,
      offset: opts.offset ?? 0,
      sortBy: opts.sortBy,
      airing: opts.airing ?? "any",
      hideWatched: opts.hideWatched ?? [],
      includeWatched: opts.includeWatched ?? [],
    }),
  });
}

export function getStats(opts: {
  hideWatched?: string[];
  includeWatched?: string[];
} = {}): Promise<AnimeStats> {
  const params = new URLSearchParams();
  if (opts.hideWatched && opts.hideWatched.length > 0) {
    params.set("hideWatched", opts.hideWatched.join(","));
  }
  if (opts.includeWatched && opts.includeWatched.length > 0) {
    params.set("includeWatched", opts.includeWatched.join(","));
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";
  return fetchJson(`${BASE}/stats${suffix}`, { headers: authHeaders() });
}

export function getWatchlist(status?: string): Promise<WatchlistData> {
  const url = status ? `${BASE}/watchlist?status=${status}` : `${BASE}/watchlist`;
  return fetchJson(url, { headers: authHeaders() });
}

export function addToWatchlist(
  malIds: number[],
  status: string,
  tagColor?: string,
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watched/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ mal_ids: malIds, status, tagColor }),
  });
}

export function removeFromWatchlist(
  malIds: number[]
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watched/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ mal_ids: malIds }),
  });
}

export function getEnrichedWatchlist(): Promise<EnrichedWatchlistResponse> {
  return fetchJson(`${BASE}/watchlist/enriched`, { headers: authHeaders() });
}

export function getWatchlistTags(): Promise<{ tags: WatchlistTag[] }> {
  return fetchJson(`${BASE}/watchlist/tags`, { headers: authHeaders() });
}

export function saveWatchlistTag(
  tag: string,
  color?: string,
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watchlist/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ tag, color }),
  });
}

export function updateWatchlistTag(
  tagId: string,
  payload: { tag?: string; color?: string },
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watchlist/tags/${tagId}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export function deleteWatchlistTag(
  tagId: string,
  moveToTagId?: string,
): Promise<{ success: boolean; message: string }> {
  return fetchJson(`${BASE}/watchlist/tags/${tagId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ moveToTagId }),
  });
}

export function getLastUpdated(): Promise<{ lastUpdated: string | null }> {
  return fetchJson(`${BASE}/last-updated`);
}

export interface ChangelogEntry {
  date: string;
  title: string;
  title_english: string | null;
  type: string | null;
  mal_id: number;
}

export function getChangelog(limit = 200): Promise<{ changes: ChangelogEntry[] }> {
  return fetchJson(`${BASE}/changelog?limit=${limit}`);
}
