import { Suspense } from "react";
import FilterBuilder from "@/components/FilterBuilder";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResultsGridSkeleton } from "@/components/ResultsGrid";

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 pt-8">
      <div className="space-y-2">
        <h1 className="font-display font-black text-4xl uppercase tracking-tighter text-white italic">
          Discover <span className="text-primary text-glow">Anime</span>
        </h1>
        <p className="text-sm font-body text-white/50 uppercase tracking-widest font-bold">
          Search and filter across 15,000+ titles
        </p>
      </div>
      <Suspense fallback={<ResultsGridSkeleton />}>
        <ErrorBoundary>
          <FilterBuilder />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}
