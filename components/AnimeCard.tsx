"use client";

import { useState } from "react";
import Image from "next/image";
import type { AnimeSummary } from "@/lib/types";
import { addToWatchlist } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden flex">
      {anime.image ? (
        <div className="relative w-[100px] min-h-[140px] shrink-0">
          <Image
            src={anime.image}
            alt={anime.name}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
      ) : (
        <div className="w-[100px] min-h-[140px] shrink-0 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-xs">No image</span>
        </div>
      )}

      <div className="flex-1 p-3 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <a
            href={anime.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline font-semibold text-sm leading-tight truncate"
          >
            {anime.name}
          </a>
          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded shrink-0">
            {anime.type || "?"}
          </span>
        </div>

        <div className="flex gap-3 text-xs text-gray-400">
          {anime.score > 0 && (
            <span>
              Score: <span className="text-yellow-400">{anime.score}</span>
            </span>
          )}
          {anime.year > 0 && <span>{anime.year}</span>}
          {anime.members > 0 && (
            <span>{(anime.members / 1000).toFixed(0)}k members</span>
          )}
          {anime.points > 0 && (
            <span className="text-green-400">{anime.points} pts</span>
          )}
        </div>

        {anime.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {anime.genres.map((g) => (
              <span
                key={g}
                className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {anime.synopsis && (
          <p className="text-xs text-gray-500 line-clamp-2">{anime.synopsis}</p>
        )}

        {user && (
          <div className="mt-auto pt-1.5 border-t border-gray-800">
            {added ? (
              <span className="text-xs text-green-400">Added to watchlist</span>
            ) : (
              <div className="flex gap-1 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleAdd(s)}
                    disabled={adding}
                    className="text-xs px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
