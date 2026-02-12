"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCharts from "@/components/StatsCharts";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const HIDE_OPTIONS = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

export default function StatsPage() {
  const { user } = useAuth();
  const [hideWatched, setHideWatched] = useState<string[]>([]);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats", hideWatched],
    queryFn: () => getStats(hideWatched),
  });

  const toggleHideWatched = (status: string) => {
    setHideWatched((prev) =>
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
          <span className="text-xs text-muted-foreground">Exclude from stats:</span>
          {HIDE_OPTIONS.map((status) => {
            const active = hideWatched.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleHideWatched(status)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all duration-200",
                  active
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {status}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading statistics...</p>
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
