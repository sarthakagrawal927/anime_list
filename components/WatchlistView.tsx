"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { EnrichedWatchlistItem } from "@/lib/types";
import { getEnrichedWatchlist, addToWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATUSES = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

export default function WatchlistView() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<EnrichedWatchlistItem[]>([]);
  const [activeTab, setActiveTab] = useState("Watching");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEnrichedWatchlist();
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const handleStatusChange = async (malId: string, newStatus: string) => {
    try {
      await addToWatchlist([Number(malId)], newStatus);
      await load();
    } catch {
      alert("Failed to update status");
    }
  };

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-gray-400 text-lg">Sign in to manage your watchlist</p>
        <p className="text-gray-600 text-sm">
          Your watchlist is personal and synced across devices
        </p>
      </div>
    );
  }

  if (loading) return <div className="text-gray-500">Loading watchlist...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  const filtered = items.filter((item) => item.watchStatus === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map((status) => {
          const count = items.filter((item) => item.watchStatus === status).length;
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
          No items with status &ldquo;{activeTab}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.mal_id}
              className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex"
            >
              {item.image ? (
                <div className="relative w-[80px] min-h-[120px] shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ) : (
                <div className="w-[80px] min-h-[120px] shrink-0 bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-600 text-xs">No img</span>
                </div>
              )}

              <div className="flex-1 p-3 flex flex-col gap-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-semibold text-sm leading-tight truncate"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-200 truncate">{item.title}</span>
                  )}
                  {item.type && (
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded shrink-0">
                      {item.type}
                    </span>
                  )}
                </div>

                <div className="flex gap-3 text-xs text-gray-400">
                  {item.score && (
                    <span>
                      Score: <span className="text-yellow-400">{item.score}</span>
                    </span>
                  )}
                  {item.year && <span>{item.year}</span>}
                  {item.episodes && <span>{item.episodes} eps</span>}
                  {item.members && (
                    <span>{(item.members / 1000).toFixed(0)}k members</span>
                  )}
                </div>

                {item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.genres.slice(0, 4).map((g) => (
                      <span
                        key={g}
                        className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  <select
                    value={item.watchStatus}
                    onChange={(e) =>
                      handleStatusChange(item.mal_id, e.target.value)
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
