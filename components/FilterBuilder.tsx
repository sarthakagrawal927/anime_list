"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  SearchFilter,
  SearchResponse,
} from "@/lib/types";
import { getFields, getFilterActions, searchAnime } from "@/lib/api";
import FilterRow from "./FilterRow";
import ResultsGrid, { ResultsGridSkeleton } from "./ResultsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_FILTER: SearchFilter = {
  field: "score",
  action: "GREATER_THAN",
  value: 7,
};

const QUICK_GENRES = [
  "Action", "Comedy", "Drama", "Fantasy", "Romance", "Sci-Fi",
  "Slice of Life", "Adventure", "Mystery", "Horror", "Supernatural",
  "Sports", "Thriller",
];

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "score", label: "Score" },
  { value: "members", label: "Popularity" },
  { value: "year", label: "Year" },
  { value: "favorites", label: "Favorites" },
];

export default function FilterBuilder() {
  const [filters, setFilters] = useState<SearchFilter[]>([{ ...DEFAULT_FILTER }]);
  const [pagesize, setPagesize] = useState(20);
  const [sortBy, setSortBy] = useState<string>("");
  const [airing, setAiring] = useState<"yes" | "no" | "any">("any");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchKey, setSearchKey] = useState(0);

  const { data: fields } = useQuery({
    queryKey: ["fields"],
    queryFn: getFields,
  });

  const { data: actions } = useQuery({
    queryKey: ["filterActions"],
    queryFn: getFilterActions,
  });

  const buildFilters = useCallback((): {
    filters: SearchFilter[];
    opts: { pagesize: number; sortBy?: string; airing: "yes" | "no" | "any" };
  } => {
    const allFilters: SearchFilter[] = [];

    if (selectedGenres.length > 0) {
      allFilters.push({
        field: "genres",
        action: "INCLUDES_ALL",
        value: selectedGenres,
      });
    }

    if (searchText.trim()) {
      allFilters.push({
        field: "title",
        action: "CONTAINS",
        value: searchText.trim(),
      });
    }

    const validAdvanced = filters.filter((f) => {
      if (Array.isArray(f.value)) return f.value.length > 0;
      return f.value !== "" && f.value !== undefined;
    });
    allFilters.push(...validAdvanced);

    return {
      filters: allFilters,
      opts: { pagesize, sortBy: sortBy || undefined, airing },
    };
  }, [filters, pagesize, sortBy, airing, selectedGenres, searchText]);

  const { data: results, isLoading: loading, error } = useQuery<SearchResponse>({
    queryKey: ["search", searchKey],
    queryFn: () => {
      const { filters: f, opts } = buildFilters();
      return searchAnime(f, opts);
    },
  });

  const handleSearch = () => setSearchKey((k) => k + 1);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
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

  const clearAll = () => {
    setSelectedGenres([]);
    setSearchText("");
    setFilters([{ ...DEFAULT_FILTER }]);
    setSortBy("");
    setAiring("any");
  };

  const activeFilterCount =
    selectedGenres.length +
    (searchText ? 1 : 0) +
    filters.filter((f) => {
      if (Array.isArray(f.value)) return f.value.length > 0;
      return f.value !== "" && f.value !== undefined;
    }).length;

  if (!fields || !actions) {
    return <ResultsGridSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Search + Sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <Input
            placeholder="Search anime..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-9 bg-secondary border-0"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-lg bg-secondary border-0 px-3 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={airing}
          onChange={(e) => setAiring(e.target.value as "yes" | "no" | "any")}
          className="h-9 rounded-lg bg-secondary border-0 px-3 text-sm text-foreground"
        >
          <option value="any">All</option>
          <option value="yes">Airing</option>
          <option value="no">Finished</option>
        </select>

        <select
          value={pagesize}
          onChange={(e) => setPagesize(Number(e.target.value))}
          className="h-9 rounded-lg bg-secondary border-0 px-3 text-sm text-foreground"
        >
          {[20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} results
            </option>
          ))}
        </select>

        <Button
          onClick={handleSearch}
          disabled={loading}
          size="sm"
          className="h-9 px-5"
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Quick genre chips */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_GENRES.map((genre) => {
          const selected = selectedGenres.includes(genre);
          return (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full transition-all duration-200",
                selected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              )}
            >
              {genre}
            </button>
          );
        })}

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5",
            showAdvanced
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Advanced
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs px-3 py-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected genre badges */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedGenres.map((g) => (
            <Badge
              key={g}
              variant="default"
              className="gap-1 cursor-pointer"
              onClick={() => toggleGenre(g)}
            >
              {g}
              <span className="text-primary-foreground/60">&times;</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Advanced filter builder (collapsible) */}
      {showAdvanced && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={addFilter} className="h-7 text-xs gap-1">
              <span className="text-lg leading-none">+</span> Add Filter
            </Button>
          </div>
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
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error instanceof Error ? error.message : "Search failed"}</p>}

      {loading ? <ResultsGridSkeleton /> : results && <ResultsGrid results={results} />}
    </div>
  );
}
