"use client";

import { useState, useEffect } from "react";
import type { WatchlistData, WatchedAnime } from "@/lib/types";
import { getWatchlist, addToWatchlist } from "@/lib/api";

const STATUSES = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

export default function WatchlistView() {
  const [data, setData] = useState<WatchlistData | null>(null);
  const [activeTab, setActiveTab] = useState("Watching");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const wl = await getWatchlist();
      setData(wl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await addToWatchlist([Number(id)], newStatus);
      await load();
    } catch {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="text-gray-500">Loading watchlist...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!data || !data.anime) {
    return <div className="text-gray-500">No watchlist data found.</div>;
  }

  const allItems = Object.entries(data.anime);
  const filtered = allItems.filter(([, item]) => item.status === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {STATUSES.map((status) => {
          const count = allItems.filter(([, item]) => item.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                activeTab === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-500 py-8 text-center">
          No items with status "{activeTab}"
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(([key, item]) => (
            <div
              key={key}
              className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">
                  {item.title || `ID: ${item.id || key}`}
                </div>
                {item.type && (
                  <div className="text-xs text-gray-500">
                    {item.type}{item.episodes ? ` - ${item.episodes} eps` : ""}
                  </div>
                )}
              </div>
              <select
                value={item.status}
                onChange={(e) =>
                  handleStatusChange(item.id || key, e.target.value)
                }
                className="bg-gray-800 text-xs rounded px-2 py-1 border border-gray-700 text-gray-200"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
