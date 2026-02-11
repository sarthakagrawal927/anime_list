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
        <h1 className="text-2xl font-bold text-gray-100">Statistics</h1>
        <p className="text-sm text-gray-400 mt-1">
          Anime database distributions and percentiles
        </p>
      </div>
      {loading ? (
        <div className="text-gray-500">Loading statistics...</div>
      ) : error ? (
        <div className="text-red-400">{error}</div>
      ) : stats ? (
        <StatsCharts stats={stats} />
      ) : (
        <div className="text-gray-500">
          Unable to load statistics. Make sure anime data has been fetched.
        </div>
      )}
    </div>
  );
}
