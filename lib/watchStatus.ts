const DEFAULT_TAG_COLORS: Record<string, string> = {
  Watching: "#10b981",
  Done: "#3b82f6",
};

const TAG_COLOR_PALETTE = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
] as const;

export const DEFAULT_WATCH_TAGS = Object.entries(DEFAULT_TAG_COLORS).map(
  ([tag, color]) => ({ tag, color, count: 0 }),
);

const colorPattern = /^#[0-9A-Fa-f]{6}$/;

const hashTag = (tag: string): number => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getDefaultTagColor = (tag: string): string => {
  const defaultColor = DEFAULT_TAG_COLORS[tag];
  if (defaultColor) return defaultColor;
  return TAG_COLOR_PALETTE[hashTag(tag) % TAG_COLOR_PALETTE.length];
};

export const resolveTagColor = (tag: string, color?: string | null): string => {
  if (color && colorPattern.test(color.trim())) {
    return color.trim().toLowerCase();
  }
  return getDefaultTagColor(tag);
};

export const toRgba = (hex: string, alpha: number): string => {
  const safeHex = resolveTagColor("fallback", hex).slice(1);
  const r = parseInt(safeHex.slice(0, 2), 16);
  const g = parseInt(safeHex.slice(2, 4), 16);
  const b = parseInt(safeHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
