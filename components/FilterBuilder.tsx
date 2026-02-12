"use client";

import { useState, useEffect } from "react";
import type {
  SearchFilter,
  FieldOptions,
  FilterActions,
  SearchResponse,
} from "@/lib/types";
import { getFields, getFilterActions, searchAnime } from "@/lib/api";
import FilterRow from "./FilterRow";
import ResultsGrid from "./ResultsGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const DEFAULT_FILTER: SearchFilter = {
  field: "score",
  action: "GREATER_THAN",
  value: 7,
};

export default function FilterBuilder() {
  const [fields, setFields] = useState<FieldOptions | null>(null);
  const [actions, setActions] = useState<FilterActions | null>(null);
  const [filters, setFilters] = useState<SearchFilter[]>([{ ...DEFAULT_FILTER }]);
  const [pagesize, setPagesize] = useState(20);
  const [sortBy, setSortBy] = useState<string>("");
  const [airing, setAiring] = useState<"yes" | "no" | "any">("any");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFields(), getFilterActions()]).then(([f, a]) => {
      setFields(f);
      setActions(a);
    });
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    const validFilters = filters.filter((f) => {
      if (Array.isArray(f.value)) return f.value.length > 0;
      return f.value !== "" && f.value !== undefined;
    });
    setLoading(true);
    setError(null);
    try {
      const data = await searchAnime(validFilters, {
        pagesize,
        sortBy: sortBy || undefined,
        airing,
      });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (index: number, filter: SearchFilter) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? filter : f)));
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { ...DEFAULT_FILTER }]);
  };

  if (!fields || !actions) {
    return <p className="text-muted-foreground">Loading filters...</p>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="space-y-2">
          {filters.map((filter, i) => (
            <FilterRow
              key={i}
              filter={filter}
              index={i}
              fields={fields}
              actions={actions}
              onChange={updateFilter}
              onRemove={removeFilter}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={addFilter}>
            + Add Filter
          </Button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Sort by (default)</option>
            {fields.numeric.map((f) => (
              <option key={f} value={f}>
                Sort: {f}
              </option>
            ))}
          </select>

          <select
            value={airing}
            onChange={(e) => setAiring(e.target.value as "yes" | "no" | "any")}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="any">Airing: Any</option>
            <option value="yes">Currently Airing</option>
            <option value="no">Not Airing</option>
          </select>

          <select
            value={pagesize}
            onChange={(e) => setPagesize(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                Show {n}
              </option>
            ))}
          </select>

          <Button onClick={handleSearch} disabled={loading} size="sm">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {results && <ResultsGrid results={results} />}
    </div>
  );
}
