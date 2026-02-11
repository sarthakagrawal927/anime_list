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
  }, []);

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
    return <div className="text-gray-500">Loading filters...</div>;
  }

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={addFilter}
          className="text-sm px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
        >
          + Add Filter
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200"
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
          className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200"
        >
          <option value="any">Airing: Any</option>
          <option value="yes">Currently Airing</option>
          <option value="no">Not Airing</option>
        </select>

        <select
          value={pagesize}
          onChange={(e) => setPagesize(Number(e.target.value))}
          className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              Show {n}
            </option>
          ))}
        </select>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {results && <ResultsGrid results={results} />}
    </div>
  );
}
