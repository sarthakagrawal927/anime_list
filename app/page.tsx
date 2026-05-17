import { Suspense } from "react";
import FilterBuilder from "@/components/FilterBuilder";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResultsGridSkeleton } from "@/components/ResultsGrid";

export default function SearchPage() {
  return (
    <Suspense fallback={<ResultsGridSkeleton />}>
      <ErrorBoundary>
        <FilterBuilder />
      </ErrorBoundary>
    </Suspense>
  );
}
