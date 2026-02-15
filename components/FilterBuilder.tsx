"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryState, parseAsString, parseAsStringLiteral, parseAsArrayOf, parseAsInteger, parseAsJson } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import type {
  SearchFilter,
  SearchResponse,
} from "@/lib/types";
import { getFields, getFilterActions, searchAnime } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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
  { value: "score", label: "Score" },
  { value: "members", label: "Popularity" },
  { value: "year", label: "Year" },
  { value: "favorites", label: "Favorites" },
  { value: "", label: "Relevance" },
];

const HIDE_WATCHED_OPTIONS = [
  "Watching", "Completed", "Deferred", "Avoiding", "BRR",
];

const filtersParser = parseAsJson<SearchFilter[]>((v) => {
  if (!Array.isArray(v)) return null;
  return v as SearchFilter[];
});

export default function FilterBuilder() {
  const { user } = useAuth();
  const [filters, setFilters] = useQueryState("af", filtersParser.withDefault([{ ...DEFAULT_FILTER }]));
  const [searchText, setSearchText] = useQueryState("q", parseAsString.withDefault(""));
  const [sortBy, setSortBy] = useQueryState("sort", parseAsString.withDefault("score"));
  const [airing, setAiring] = useQueryState("airing", parseAsStringLiteral(["yes", "no", "any"] as const).withDefault("any"));
  const [selectedGenres, setSelectedGenres] = useQueryState("genres", parseAsArrayOf(parseAsString).withDefault([]));
  const [hideWatched, setHideWatched] = useQueryState("hide", parseAsArrayOf(parseAsString).withDefault([]));
  const [pagesize, setPagesize] = useQueryState("pagesize", parseAsInteger.withDefault(20));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));

  // Local input for instant UI, debounce URL param update
  const [inputValue, setInputValue] = useState(searchText);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    // Sync local input when URL param changes externally (back/forward nav)
    setInputValue(searchText);
  }, [searchText]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchText(value);
      setCurrentPage(1);
    }, 300);
  };

  // Auto-open advanced panel if URL contains non-default filters
  const hasCustomFilters = filters.length > 1 ||
    (filters.length === 1 && (filters[0].field !== "score" || filters[0].action !== "GREATER_THAN" || filters[0].value !== 7));
  const [showAdvanced, setShowAdvanced] = useState(hasCustomFilters);

  // Reset to page 1 whenever called — used by all filter mutations
  const resetPage = () => setCurrentPage(1);

  const { data: fields } = useQuery({
    queryKey: ["fields"],
    queryFn: getFields,
  });

  const { data: actions } = useQuery({
    queryKey: ["filterActions"],
    queryFn: getFilterActions,
  });

  const offset = (currentPage - 1) * pagesize;

  const buildSearchOpts = useCallback(() => {
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

    // Only apply advanced filters if the section is expanded
    if (showAdvanced) {
      const validAdvanced = filters.filter((f) => {
        if (Array.isArray(f.value)) return f.value.length > 0;
        return f.value !== "" && f.value !== undefined;
      });
      allFilters.push(...validAdvanced);
    }

    return {
      filters: allFilters,
      opts: {
        pagesize,
        offset,
        sortBy: sortBy || undefined,
        airing,
        hideWatched,
      },
    };
  }, [filters, pagesize, offset, sortBy, airing, selectedGenres, searchText, hideWatched, showAdvanced]);

  // Create stable query key from filter params
  const filterKey = JSON.stringify(buildSearchOpts());

  const { data, isLoading: loading, isFetching, error } = useQuery<SearchResponse>({
    queryKey: ["search", filterKey],
    queryFn: () => {
      const { filters: f, opts } = buildSearchOpts();
      return searchAnime(f, opts);
    },
    placeholderData: (prev) => prev,
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
    resetPage();
  };

  const toggleHideWatched = (status: string) => {
    setHideWatched((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    resetPage();
  };

  const updateFilter = (index: number, filter: SearchFilter) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? filter : f)));
    resetPage();
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
    resetPage();
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { ...DEFAULT_FILTER }]);
    resetPage();
  };

  const clearAll = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInputValue("");
    setSelectedGenres([]);
    setSearchText("");
    setFilters([{ ...DEFAULT_FILTER }]);
    setSortBy("score");
    setAiring("any");
    setHideWatched([]);
    setShowAdvanced(false);
    setCurrentPage(1);
  };

  const activeFilterCount =
    selectedGenres.length +
    (searchText ? 1 : 0) +
    hideWatched.length +
    (showAdvanced ? filters.filter((f) => {
      if (Array.isArray(f.value)) return f.value.length > 0;
      return f.value !== "" && f.value !== undefined;
    }).length : 0);

  const totalFiltered = data?.totalFiltered || 0;
  const totalPages = Math.ceil(totalFiltered / pagesize);
  const hasNext = currentPage < totalPages;
  const hasPrev = currentPage > 1;

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
            aria-label="Search anime"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                setSearchText(inputValue);
                resetPage();
              }
            }}
            className="pl-9 h-9 bg-secondary border-0"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
          aria-label="Sort by"
          className="h-9 rounded-lg bg-secondary border-0 px-3 text-sm text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={pagesize}
          onChange={(e) => { setPagesize(Number(e.target.value)); resetPage(); }}
          aria-label="Results per page"
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
              aria-pressed={selected}
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

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* Airing status tags */}
        <button
          onClick={() => { setAiring(airing === "yes" ? "any" : "yes"); resetPage(); }}
          aria-pressed={airing === "yes"}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full transition-all duration-200",
            airing === "yes"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          Airing
        </button>
        <button
          onClick={() => { setAiring(airing === "no" ? "any" : "no"); resetPage(); }}
          aria-pressed={airing === "no"}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full transition-all duration-200",
            airing === "no"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          )}
        >
          Finished
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        <button
          onClick={() => { setShowAdvanced(!showAdvanced); resetPage(); }}
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

      {/* Hide watched (only when logged in) */}
      {user && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Hide watched:</span>
          {HIDE_WATCHED_OPTIONS.map((status) => {
            const active = hideWatched.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleHideWatched(status)}
                aria-pressed={active}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all duration-200",
                  active
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
              >
                {status}
              </button>
            );
          })}
        </div>
      )}

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

      {loading && !data ? (
        <ResultsGridSkeleton />
      ) : data ? (
        <>
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                Showing {offset + 1}–{Math.min(offset + data.filteredList.length, totalFiltered)} of {totalFiltered.toLocaleString()} results
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            <ResultsGrid results={data} />
          </div>
          {totalPages > 1 && (
            <div className="sticky bottom-0 z-10 flex items-center justify-center gap-3 py-3 bg-background/95 backdrop-blur-sm border-t border-border -mx-4 px-4 sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:py-2 sm:pb-8">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!hasPrev || isFetching}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasNext || isFetching}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
