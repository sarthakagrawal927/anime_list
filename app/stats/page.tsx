"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCharts from "@/components/StatsCharts";
import { getStats, getWatchlistTags } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { resolveTagColor, toRgba } from "@/lib/watchStatus";

export default function StatsPage() {
  const { user } = useAuth();
  const [includeStatuses, setIncludeStatuses] = useState<string[]>([]);

  const { data: tagsData } = useQuery({
    queryKey: ["watchlist", "tags"],
    queryFn: () => getWatchlistTags(),
    enabled: !!user,
  });

  const availableTags = tagsData?.tags ?? [];

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats", includeStatuses],
    queryFn: () =>
      getStats({
        includeWatched: includeStatuses,
      }),
  });

  const toggleIncludeStatus = (status: string) => {
    setIncludeStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anime database distributions and percentiles
        </p>
      </div>

      {user && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Include only from:</span>
          {availableTags.map((tag) => {
            const active = includeStatuses.includes(tag.tag);
            const color = resolveTagColor(tag.tag, tag.color);
            return (
              <button
                key={tag.tag}
                onClick={() => toggleIncludeStatus(tag.tag)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all duration-200",
                  active
                    ? ""
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  active
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
                {tag.tag}
              </button>
            );
          })}
          {availableTags.length === 0 && (
            <span className="text-xs text-muted-foreground">
              No tags yet
            </span>
          )}
          {includeStatuses.length > 0 && (
            <button
              onClick={() => setIncludeStatuses([])}
              className="text-xs px-2.5 py-1 rounded-full text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Failed to load stats"}
        </p>
      ) : stats ? (
        <StatsCharts stats={stats} />
      ) : (
        <p className="text-muted-foreground">
          Unable to load statistics. Make sure anime data has been fetched.
        </p>
      )}
    </div>
  );
}
