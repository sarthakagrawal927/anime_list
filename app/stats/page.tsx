"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCharts from "@/components/StatsCharts";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

export default function StatsPage() {
  const { user } = useAuth();
  const [includeStatuses, setIncludeStatuses] = useState<string[]>([]);

  // When logged in and statuses selected, hide everything EXCEPT selected statuses
  // This means hideWatched = all statuses NOT in includeStatuses
  const hideWatched = user && includeStatuses.length > 0
    ? STATUS_OPTIONS.filter((s) => !includeStatuses.includes(s))
    : [];

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats", hideWatched],
    queryFn: () => getStats(hideWatched),
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
          {STATUS_OPTIONS.map((status) => {
            const active = includeStatuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleIncludeStatus(status)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all duration-200",
                  active
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {status}
              </button>
            );
          })}
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
