"use client";

import { useState } from "react";
import Image from "next/image";
import type { AnimeSummary } from "@/lib/types";
import { addToWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUSES = ["Watching", "Completed", "Deferred", "Avoiding", "BRR"];

export default function AnimeCard({ anime }: { anime: AnimeSummary }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();

  const handleAdd = async (status: string) => {
    setAdding(true);
    try {
      await addToWatchlist([anime.id], status);
      setAdded(true);
    } catch {
      alert("Failed to add to watchlist. Are you signed in?");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-row p-0">
      {anime.image ? (
        <div className="relative w-[100px] min-h-[150px] shrink-0">
          <Image
            src={anime.image}
            alt={anime.name}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
      ) : (
        <div className="w-[100px] min-h-[150px] shrink-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-xs">No image</span>
        </div>
      )}

      <div className="flex-1 p-3 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <a
            href={anime.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold text-sm leading-tight truncate"
          >
            {anime.name}
          </a>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {anime.type || "?"}
          </Badge>
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          {anime.score > 0 && (
            <span>
              Score: <span className="text-yellow-400 font-medium">{anime.score}</span>
            </span>
          )}
          {anime.year > 0 && <span>{anime.year}</span>}
          {anime.members > 0 && (
            <span>{(anime.members / 1000).toFixed(0)}k members</span>
          )}
          {anime.points > 0 && (
            <span className="text-emerald-400">{anime.points} pts</span>
          )}
        </div>

        {anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.genres.map((g) => (
              <Badge key={g} variant="outline" className="text-xs font-normal px-1.5 py-0">
                {g}
              </Badge>
            ))}
          </div>
        )}

        {anime.synopsis && (
          <p className="text-xs text-muted-foreground line-clamp-2">{anime.synopsis}</p>
        )}

        {user && (
          <div className="mt-auto pt-2 border-t border-border">
            {added ? (
              <span className="text-xs text-emerald-400">Added to watchlist</span>
            ) : (
              <div className="flex gap-1 flex-wrap">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAdd(s)}
                    disabled={adding}
                    className="h-6 text-xs px-2"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
