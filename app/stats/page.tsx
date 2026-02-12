"use client";

import { useQuery } from "@tanstack/react-query";
import StatsCharts from "@/components/StatsCharts";
import { getStats } from "@/lib/api";

export default function StatsPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anime database distributions and percentiles
        </p>
      </div>
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
