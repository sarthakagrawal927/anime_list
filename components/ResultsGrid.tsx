"use client";

import type { SearchResponse } from "@/lib/types";
import AnimeCard from "./AnimeCard";

export default function ResultsGrid({ results }: { results: SearchResponse }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {results.totalFiltered.toLocaleString()} anime matched your filters (showing{" "}
        {results.filteredList.length})
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {results.filteredList.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>

      {results.filteredList.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No anime found matching your filters. Try adjusting your criteria.
        </div>
      )}
    </div>
  );
}
