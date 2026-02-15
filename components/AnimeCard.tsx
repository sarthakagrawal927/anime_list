"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnimeSummary } from "@/lib/types";
import { addToWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

const STATUS_COLORS: Record<string, string> = {
  Watching: "bg-emerald-500",
  Completed: "bg-blue-500",
  Deferred: "bg-yellow-500",
  Avoiding: "bg-red-500",
  BRR: "bg-purple-500",
};

export default function AnimeCard({ anime }: { anime: AnimeSummary }) {
  const [added, setAdded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: string) => addToWatchlist([anime.id], status),
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const handleAdd = (status: string) => {
    setShowMenu(false);
    mutation.mutate(status);
  };

  const scoreColor =
    anime.score >= 8
      ? "text-emerald-400"
      : anime.score >= 6
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="group relative">
      {/* Poster image */}
      <a
        href={anime.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted">
          {anime.image ? (
            <Image
              src={anime.image}
              alt={anime.title_english || anime.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 185px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Score badge - always visible */}
          {anime.score > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <span className={`text-xs font-bold ${scoreColor}`}>
                {anime.score.toFixed(1)}
              </span>
            </div>
          )}

          {/* Type badge */}
          {anime.type && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <span className="text-[10px] font-medium text-white/90">
                {anime.type}
              </span>
            </div>
          )}

          {/* Hover overlay with details */}
          <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {anime.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
            {anime.synopsis && (
              <p className="text-[11px] text-white/80 line-clamp-3 leading-relaxed">
                {anime.synopsis}
              </p>
            )}
          </div>
        </div>
      </a>

      {/* Title and metadata below poster */}
      <div className="mt-2 space-y-0.5">
        <a
          href={anime.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors"
        >
          {anime.title_english || anime.name}
        </a>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {anime.year > 0 && <span>{anime.year}</span>}
          {anime.members > 0 && (
            <span>{(anime.members / 1000).toFixed(0)}k users</span>
          )}
        </div>
      </div>

      {/* Add to watchlist - top right on hover */}
      {user && !added && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              disabled={mutation.isPending}
              className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg leading-none shadow-lg hover:scale-110 transition-transform"
            >
              +
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-popover border border-border rounded-lg shadow-xl py-1 w-32 z-20">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAdd(s);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${STATUS_COLORS[s]}`}
                    />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {added && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-emerald-500/90 text-white text-[10px]">
            Added
          </Badge>
        </div>
      )}
    </div>
  );
}
