"use client";

import type { SearchResponse } from "@/lib/types";
import AnimeCard from "./AnimeCard";

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-lg bg-muted" />
      <div className="mt-2 space-y-1.5">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function ResultsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function ResultsGrid({ results }: { results: SearchResponse }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {results.totalFiltered.toLocaleString()} anime found
        {results.filteredList.length < results.totalFiltered &&
          ` (showing ${results.filteredList.length})`}
      </p>

      {results.filteredList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
          {results.filteredList.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <span className="text-muted-foreground text-xl">?</span>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No anime found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your filters or search for something different
          </p>
        </div>
      )}
    </div>
  );
}
