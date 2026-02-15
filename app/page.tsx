import { Suspense } from "react";
import FilterBuilder from "@/components/FilterBuilder";
import { ResultsGridSkeleton } from "@/components/ResultsGrid";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Discover Anime</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search and filter across 15,000+ anime titles
        </p>
      </div>
      <Suspense fallback={<ResultsGridSkeleton />}>
        <FilterBuilder />
      </Suspense>
    </div>
  );
}
