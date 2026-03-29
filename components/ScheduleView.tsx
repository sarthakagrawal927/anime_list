"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EnrichedWatchlistItem, ScheduleItem, ScheduleTimelineDay } from "@/lib/types";
import {
  addToSchedule,
  getEnrichedWatchlist,
  getScheduleTimeline,
  removeFromSchedule,
  updateScheduleItem,
  reorderSchedule,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function DayLabel({ day, date }: { day: number; date: string }) {
  const isToday = date === new Date().toISOString().split("T")[0];
  return (
    <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
      {isToday ? "Today" : `Day ${day + 1}`} &middot; {formatDate(date)}
    </span>
  );
}

export default function ScheduleView() {
  const { user, loading: authLoading } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [defaultEpd, setDefaultEpd] = useState(3);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["schedule", "timeline"],
    queryFn: () => getScheduleTimeline(),
    enabled: !!user,
  });

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist", "enriched"],
    queryFn: () => getEnrichedWatchlist(),
    enabled: !!user && showPicker,
  });

  const addMutation = useMutation({
    mutationFn: ({ malIds, epd }: { malIds: number[]; epd: number }) =>
      addToSchedule(malIds, epd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
      setSelectedIds(new Set());
      setShowPicker(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ malId, episodesPerDay }: { malId: string; episodesPerDay: number }) =>
      updateScheduleItem(malId, episodesPerDay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (malIds: number[]) => removeFromSchedule(malIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (malIds: string[]) => reorderSchedule(malIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] });
    },
  });

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Sign in to plan your schedule</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Plan your anime watching calendar day by day
        </p>
      </div>
    );
  }

  if (isLoading) return <ScheduleSkeleton />;
  if (error) return <p className="text-destructive text-sm">{error instanceof Error ? error.message : "Failed to load schedule"}</p>;

  const items: ScheduleItem[] = data?.items ?? [];
  const timeline: ScheduleTimelineDay[] = data?.timeline ?? [];
  const stats = data?.stats;

  const scheduledIds = new Set(items.map((i) => i.mal_id));
  const availableWatchlist: EnrichedWatchlistItem[] = (watchlistData?.items ?? []).filter(
    (item) => !scheduledIds.has(item.mal_id),
  );

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const ordered = items.map((i) => i.mal_id);
    [ordered[index], ordered[newIndex]] = [ordered[newIndex], ordered[index]];
    reorderMutation.mutate(ordered);
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{items.length}</div>
            <div className="text-xs text-muted-foreground">Anime</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total_episodes}</div>
            <div className="text-xs text-muted-foreground">Episodes</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total_days}</div>
            <div className="text-xs text-muted-foreground">Days</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{formatDate(stats.finish_date)}</div>
            <div className="text-xs text-muted-foreground">Finish date</div>
          </Card>
        </div>
      )}

      {/* Queue header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Queue</h2>
        <button
          onClick={() => setShowPicker((prev) => !prev)}
          className="h-8 rounded-md px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {showPicker ? "Cancel" : "+ Add from Watchlist"}
        </button>
      </div>

      {/* Anime picker */}
      {showPicker && (
        <Card className="p-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-muted-foreground">Episodes/day:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={defaultEpd}
              onChange={(e) => setDefaultEpd(Math.max(1, Number(e.target.value) || 1))}
              className="h-7 w-16 rounded border border-input bg-background px-2 text-xs text-center"
            />
            <button
              onClick={() => {
                if (selectedIds.size === 0) return;
                addMutation.mutate({
                  malIds: Array.from(selectedIds).map(Number),
                  epd: defaultEpd,
                });
              }}
              disabled={selectedIds.size === 0 || addMutation.isPending}
              className="h-7 rounded-md px-3 text-xs bg-primary text-primary-foreground disabled:opacity-50"
            >
              Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
            </button>
          </div>

          {availableWatchlist.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              {watchlistData ? "All watchlist anime are already scheduled" : "Loading watchlist..."}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableWatchlist.map((item) => (
                <label
                  key={item.mal_id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors",
                    selectedIds.has(item.mal_id) && "bg-primary/10",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.mal_id)}
                    onChange={(e) => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(item.mal_id);
                        else next.delete(item.mal_id);
                        return next;
                      });
                    }}
                    className="rounded"
                  />
                  {item.image && (
                    <Image src={item.image} alt="" width={28} height={40} className="rounded object-cover" />
                  )}
                  <span className="text-sm truncate flex-1">{item.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {item.episodes ? `${item.episodes} eps` : "? eps"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{item.watchStatus}</Badge>
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Queue items */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No anime scheduled yet</p>
          <p className="text-xs mt-1">Add anime from your watchlist to start planning</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={item.mal_id} className="overflow-hidden flex flex-row p-0 hover:border-primary/30 transition-colors">
              {item.image ? (
                <div className="relative w-[60px] min-h-[80px] shrink-0">
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="60px" />
                </div>
              ) : (
                <div className="w-[60px] min-h-[80px] shrink-0 bg-muted" />
              )}

              <div className="flex-1 p-2.5 flex items-center gap-3 min-w-0">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {item.episodes && <span>{item.episodes} eps</span>}
                    {item.type && <span>{item.type}</span>}
                    {item.episodes && (
                      <span className="text-primary">
                        {Math.ceil(item.episodes / item.episodes_per_day)} days
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-muted-foreground">ep/day</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.episodes_per_day}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      updateMutation.mutate({ malId: item.mal_id, episodesPerDay: val });
                    }}
                    className="h-7 w-12 rounded border border-input bg-background px-1 text-xs text-center"
                  />
                </div>

                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0 || reorderMutation.isPending}
                    className="h-5 w-5 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                    aria-label="Move up"
                  >
                    &uarr;
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1 || reorderMutation.isPending}
                    className="h-5 w-5 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30"
                    aria-label="Move down"
                  >
                    &darr;
                  </button>
                </div>

                <button
                  onClick={() => removeMutation.mutate([Number(item.mal_id)])}
                  disabled={removeMutation.isPending}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  aria-label="Remove"
                >
                  &times;
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground pt-2">Timeline</h2>
          <div className="space-y-1.5">
            {timeline.map((day) => (
              <div key={day.day} className="flex gap-3 items-start">
                <div className="w-28 shrink-0 pt-1.5">
                  <DayLabel day={day.day} date={day.date} />
                </div>
                <div className="flex-1 space-y-1">
                  {day.entries.map((entry) => (
                    <div
                      key={entry.mal_id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                        entry.is_final_day
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/50",
                      )}
                    >
                      {entry.image && (
                        <Image src={entry.image} alt="" width={20} height={28} className="rounded object-cover shrink-0" />
                      )}
                      <span className="truncate flex-1">{entry.title}</span>
                      <Badge variant={entry.is_final_day ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {entry.episode_range[0] === entry.episode_range[1]
                          ? `Ep ${entry.episode_range[0]}`
                          : `Ep ${entry.episode_range[0]}-${entry.episode_range[1]}`}
                      </Badge>
                      {entry.is_final_day && (
                        <span className="text-[10px] text-primary font-medium shrink-0">Done</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
