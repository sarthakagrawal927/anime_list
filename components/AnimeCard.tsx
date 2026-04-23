"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import type { AnimeSummary } from "@/lib/types";
import { addToWatchlist, addToSchedule, getWatchlist, getWatchlistTags } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_WATCH_TAGS, resolveTagColor } from "@/lib/watchStatus";
import { getAnimeDetailHref } from "@/lib/utils";

export default function AnimeCard({ anime }: { anime: AnimeSummary }) {
  const [scheduled, setScheduled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [customColor, setCustomColor] = useState("#10b981");
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => getWatchlist(),
    enabled: !!user,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["watchlist", "tags"],
    queryFn: () => getWatchlistTags(),
    enabled: !!user,
  });

  const availableTags = tagsData?.tags?.length ? tagsData.tags : DEFAULT_WATCH_TAGS;
  const persistedStatus = watchlistData?.anime?.[String(anime.id)]?.status ?? null;
  const currentStatus = optimisticStatus ?? persistedStatus;
  const currentStatusColor = useMemo(() => {
    if (!currentStatus) return null;
    const matchingTag = availableTags.find((tag) => tag.tag === currentStatus);
    return resolveTagColor(currentStatus, matchingTag?.color);
  }, [availableTags, currentStatus]);

  const mutation = useMutation({
    mutationFn: ({
      status,
      tagColor,
    }: {
      status: string;
      tagColor?: string;
    }) => addToWatchlist([anime.id], status, tagColor),
    onSuccess: () => {
      setCustomTag("");
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["watchlist", "tags"] });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: () => addToSchedule([anime.id]),
    onSuccess: () => {
      setScheduled(true);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  const handleAdd = (status: string, tagColor?: string) => {
    const previousStatus = currentStatus;
    setShowMenu(false);
    setOptimisticStatus(status);
    mutation.mutate(
      { status, tagColor },
      {
        onError: () => {
          setOptimisticStatus(previousStatus);
        },
      },
    );
  };

  const scoreColor =
    anime.score >= 8
      ? "text-emerald-400"
      : anime.score >= 6
        ? "text-yellow-400"
        : "text-red-400";
  const title = anime.title_english || anime.name;
  const detailHref = getAnimeDetailHref(anime.id);

  return (
    <div className="group relative">
      {/* Poster image */}
      <Link href={detailHref} className="block">
        <div className="aspect-[2/3] relative overflow-hidden rounded-lg bg-muted">
          {anime.image ? (
            <Image
              src={anime.image}
              alt={title}
              fill
              quality={60}
              loading="lazy"
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
      </Link>

      {/* Title and metadata below poster */}
      <div className="mt-2 space-y-1">
        <div className="flex items-start gap-2">
          <Link
            href={detailHref}
            className="min-w-0 flex-1 text-sm font-medium text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors"
          >
            {title}
          </Link>
          <a
            href={anime.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${title} on MyAnimeList`}
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {anime.year > 0 && <span>{anime.year}</span>}
          {anime.members > 0 && (
            <span>{(anime.members / 1000).toFixed(0)}k users</span>
          )}
        </div>
      </div>

      {/* Add to watchlist - top right on hover */}
      {user && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              disabled={mutation.isPending}
              aria-label={currentStatus ? `Edit watchlist status: ${currentStatus}` : "Add to watchlist"}
              className="h-7 min-w-7 rounded-full text-primary-foreground flex items-center justify-center text-lg leading-none shadow-lg hover:scale-110 transition-transform px-2"
              style={
                currentStatusColor
                  ? { backgroundColor: currentStatusColor }
                  : undefined
              }
            >
              {mutation.isPending ? (
                <span className="animate-spin text-sm">...</span>
              ) : currentStatus ? (
                <span className="text-xs font-semibold">{currentStatus.slice(0, 1)}</span>
              ) : (
                "+"
              )}
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-popover border border-border rounded-lg shadow-xl py-1 w-52 z-20">
                {availableTags.map((tag) => {
                  const color = resolveTagColor(tag.tag, tag.color);
                  const isCurrentTag = currentStatus === tag.tag;
                  return (
                  <button
                    key={tag.tag}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAdd(tag.tag, tag.color);
                    }}
                    className="flex items-center justify-between gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {tag.tag}
                    </span>
                    {isCurrentTag && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Current
                      </span>
                    )}
                  </button>
                  );
                })}
                <div className="border-t border-border">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      scheduleMutation.mutate();
                    }}
                    disabled={scheduleMutation.isPending || scheduled}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors text-left disabled:opacity-50"
                  >
                    <svg className="h-2 w-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {scheduled ? "Scheduled" : "Add to Schedule"}
                  </button>
                </div>
                <div className="border-t border-border px-2 pt-2 pb-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="New tag"
                      className="h-7 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                    />
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-7 w-8 rounded border border-input bg-background p-0.5"
                      aria-label="Tag color"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const tag = customTag.trim();
                      if (!tag) return;
                      handleAdd(tag, customColor);
                    }}
                    className="h-7 w-full rounded-md bg-primary text-primary-foreground text-xs"
                  >
                    Add custom tag
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {currentStatus && (
        <div className="mt-1">
          <Badge
            className="text-[10px]"
            style={{
              backgroundColor: currentStatusColor ?? resolveTagColor(currentStatus),
              color: "#ffffff",
            }}
          >
            {currentStatus}
          </Badge>
        </div>
      )}
    </div>
  );
}
