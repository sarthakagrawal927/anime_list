import { WatchStatus } from "../config";

export const hideWatchedItems = async <T extends { mal_id: number }, TWatchlist>(
  list: T[],
  statuses: WatchStatus[],
  loadList: () => Promise<TWatchlist | null>,
  select: (watchlist: TWatchlist) => Record<string, { status: WatchStatus }>
): Promise<T[]> => {
  if (!statuses.length) return list;
  const watchlist = await loadList();
  if (!watchlist) return list;

  const entries = select(watchlist);
  return list.filter((item) => {
    const entry = entries[item.mal_id.toString()];
    return !entry || !statuses.includes(entry.status);
  });
};

// For stats: include ONLY watchlisted items with specific statuses
export const includeOnlyWatchedItems = async <T extends { mal_id: number }, TWatchlist>(
  list: T[],
  statuses: WatchStatus[],
  loadList: () => Promise<TWatchlist | null>,
  select: (watchlist: TWatchlist) => Record<string, { status: WatchStatus }>
): Promise<T[]> => {
  if (!statuses.length) return list;
  const watchlist = await loadList();
  if (!watchlist) return list;

  const entries = select(watchlist);
  return list.filter((item) => {
    const entry = entries[item.mal_id.toString()];
    // Only include items that ARE in watchlist AND have allowed status
    return entry && statuses.includes(entry.status);
  });
};

export const takePage = <T>(items: T[], count: number, offset = 0): T[] =>
  items.slice(offset, offset + count);

