"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { EnrichedWatchlistItem } from "@/lib/types";
import { getEnrichedWatchlist, addToWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUSES = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

const STATUS_STYLES: Record<string, { dot: string; active: string }> = {
  Watching: {
    dot: "bg-emerald-400",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  Completed: {
    dot: "bg-blue-400",
    active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  Deferred: {
    dot: "bg-yellow-400",
    active: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  Avoiding: {
    dot: "bg-red-400",
    active: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  BRR: {
    dot: "bg-purple-400",
    active: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
};

function WatchlistSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Sign in to view your watchlist</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your watchlist is personal and synced across devices
        </p>
      </div>
    );
  }

  if (loading) return <WatchlistSkeleton />;
  if (error) return <p className="text-destructive text-sm">{error}</p>;

  const filtered = items.filter((item) => item.watchStatus === activeTab);

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((status) => {
          const count = items.filter((item) => item.watchStatus === status).length;
          const isActive = activeTab === status;
          const style = STATUS_STYLES[status];
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                isActive
                  ? style.active
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", style.dot)} />
              {status}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No anime with status &ldquo;{activeTab}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <Card key={item.mal_id} className="overflow-hidden flex flex-row p-0 hover:border-primary/30 transition-colors">
              {item.image ? (
                <div className="relative w-[85px] min-h-[120px] shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="85px"
                  />
                </div>
              ) : (
                <div className="w-[85px] min-h-[120px] shrink-0 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No img</span>
                </div>
              )}

              <div className="flex-1 p-3 flex flex-col gap-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                  )}
                  {item.type && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {item.type}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  {item.score && (
                    <span>
                      <span className={cn(
                        "font-medium",
                        item.score >= 8 ? "text-emerald-400" : item.score >= 6 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {item.score}
                      </span>
                    </span>
                  )}
                  {item.year && <span>{item.year}</span>}
                  {item.episodes && <span>{item.episodes} eps</span>}
                </div>

                {item.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.genres.slice(0, 4).map((g) => (
                      <Badge key={g} variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  <select
                    value={item.watchStatus}
                    onChange={(e) => handleStatusChange(item.mal_id, e.target.value)}
                    className="h-7 rounded-lg border border-input bg-secondary px-2 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
