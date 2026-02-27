export const WATCH_STATUSES = ["Watching", "Completed", "Dropped", "Delaying", "BRR"] as const;

export type WatchStatusType = (typeof WATCH_STATUSES)[number];

export const STATUS_COLORS: Record<WatchStatusType, string> = {
  Watching: "bg-emerald-500",
  Completed: "bg-blue-500",
  Dropped: "bg-yellow-500",
  Delaying: "bg-red-500",
  BRR: "bg-purple-500",
};

export const STATUS_STYLES: Record<WatchStatusType, { dot: string; active: string }> = {
  Watching: {
    dot: "bg-emerald-400",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  Completed: {
    dot: "bg-blue-400",
    active: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  Dropped: {
    dot: "bg-yellow-400",
    active: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  Delaying: {
    dot: "bg-red-400",
    active: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  BRR: {
    dot: "bg-purple-400",
    active: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
};
