"use client";

import { useState, useEffect } from "react";
import StatsCharts from "@/components/StatsCharts";
import { getStats } from "@/lib/api";
import type { AnimeStats } from "@/lib/types";

export default function StatsPage() {
  const [stats, setStats] = useState<AnimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Anime database distributions and percentiles
        </p>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading statistics...</p>
      ) : error ? (
        <p className="text-destructive text-sm">{error}</p>
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
