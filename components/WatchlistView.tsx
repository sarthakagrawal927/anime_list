"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EnrichedWatchlistItem } from "@/lib/types";
import { addToWatchlist, getEnrichedWatchlist, getWatchlistTags, removeFromWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDefaultTagColor, resolveTagColor, toRgba } from "@/lib/watchStatus";

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
  const [activeTab, setActiveTab] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["watchlist", "enriched"],
    queryFn: () => getEnrichedWatchlist(),
    enabled: !!user,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["watchlist", "tags"],
    queryFn: () => getWatchlistTags(),
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ malId, status, tagColor }: { malId: string; status: string; tagColor?: string }) =>
      addToWatchlist([Number(malId)], status, tagColor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist", "tags"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (malId: string) =>
      removeFromWatchlist([Number(malId)]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist", "tags"] });
    },
  });

  const items: EnrichedWatchlistItem[] = data?.items ?? [];
  const tags = tagsData?.tags ?? [];
  const tagColorMap = useMemo(
    () => new Map(tags.map((tag) => [tag.tag, resolveTagColor(tag.tag, tag.color)])),
    [tags],
  );

  useEffect(() => {
    if (!tags.length) {
      setActiveTab("");
      return;
    }
    if (!activeTab || !tags.some((tag) => tag.tag === activeTab)) {
      setActiveTab(tags[0].tag);
    }
  }, [tags, activeTab]);

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

  if (isLoading) return <WatchlistSkeleton />;
  if (error) return <p className="text-destructive text-sm">{error instanceof Error ? error.message : "Failed to load watchlist"}</p>;

  const filtered = activeTab
    ? items.filter((item) => item.watchStatus === activeTab)
    : items;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {tags.map((tag) => {
          const isActive = activeTab === tag.tag;
          const color = resolveTagColor(tag.tag, tag.color);
          return (
            <button
              key={tag.tag}
              onClick={() => setActiveTab(tag.tag)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
                isActive ? "" : "text-muted-foreground hover:text-foreground"
              )}
              style={
                isActive
                  ? {
                      color,
                      borderColor: toRgba(color, 0.45),
                      backgroundColor: toRgba(color, 0.15),
                    }
                  : {
                      color,
                      borderColor: toRgba(color, 0.3),
                    }
              }
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {tag.tag}
              <span className="text-xs opacity-60">({tag.count})</span>
            </button>
          );
        })}
        {tags.length === 0 && (
          <span className="text-sm text-muted-foreground">No tags yet</span>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {activeTab ? `No anime with tag "${activeTab}"` : "No anime in watchlist yet"}
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
                    onChange={(e) => {
                      if (e.target.value === "REMOVE") {
                        removeMutation.mutate(item.mal_id);
                        return;
                      }
                      if (e.target.value === "__NEW_TAG__") {
                        const customTag = window.prompt("New tag name");
                        if (!customTag || !customTag.trim()) return;
                        const tag = customTag.trim();
                        const color = getDefaultTagColor(tag);
                        statusMutation.mutate({ malId: item.mal_id, status: tag, tagColor: color });
                        setActiveTab(tag);
                        return;
                      }
                      statusMutation.mutate({
                        malId: item.mal_id,
                        status: e.target.value,
                        tagColor: tagColorMap.get(e.target.value),
                      });
                    }}
                    disabled={statusMutation.isPending || removeMutation.isPending}
                    className="h-7 rounded-lg border border-input bg-secondary px-2 text-xs"
                  >
                    {tags.map((tag) => (
                      <option key={tag.tag} value={tag.tag}>{tag.tag}</option>
                    ))}
                    <option value="__NEW_TAG__">+ New tag...</option>
                    <option value="REMOVE" className="text-destructive">Remove from watchlist</option>
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

