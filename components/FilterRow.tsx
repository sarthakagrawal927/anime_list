"use client";

import type { SearchFilter, FieldOptions, FilterActions } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const GENRES = [
  "Comedy", "Action", "Fantasy", "Adventure", "Sci-Fi", "Drama", "Romance",
  "Supernatural", "Slice of Life", "Mystery", "Ecchi", "Sports", "Horror",
  "Avant Garde", "Suspense", "Award Winning", "Boys Love", "Gourmet", "Girls Love",
];

const THEMES = [
  "Music", "School", "Historical", "Mecha", "Military", "Adult Cast", "Parody",
  "Mythology", "Super Power", "Martial Arts", "Space", "Harem", "Psychological",
  "Isekai", "Anthropomorphic", "Detective", "Mahou Shoujo", "Strategy Game",
  "Team Sports", "Gore", "CGDCT", "Gag Humor", "Samurai", "Urban Fantasy",
  "Workplace", "Iyashikei", "Vampire", "Racing", "Time Travel", "Video Game",
  "Reincarnation", "Performing Arts", "Otaku Culture", "Love Polygon", "Pets",
  "Organized Crime", "Combat Sports", "Visual Arts", "Reverse Harem", "Survival",
  "Educational", "Childcare", "Delinquents", "Crossdressing", "High Stakes Game",
  "Medical", "Showbiz", "Love Status Quo", "Villainess",
];

const DEMOGRAPHICS = ["Shounen", "Shoujo", "Seinen", "Josei", "Kids"];

const SEASONS = ["winter", "spring", "summer", "fall"];
const TYPES = ["TV", "Movie", "OVA", "ONA", "Special", "Music"];
const VALUE_SELECT_FIELDS = new Set(["type", "season"]);
const TEXT_ACTIONS = ["CONTAINS", "EQUALS", "EXCLUDES"];
const ENUM_ACTIONS = ["EQUALS", "EXCLUDES"];

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  title_english: "English Title",
  synopsis: "Synopsis",
  score: "Score",
  scored_by: "Scored By",
  rank: "Rank",
  popularity: "Popularity",
  members: "Members",
  favorites: "Favorites",
  year: "Year",
  episodes: "Episodes",
  genres: "Genres",
  themes: "Themes",
  demographics: "Demographics",
  type: "Type",
  season: "Season",
};

const ACTION_LABELS: Record<string, string> = {
  EQUALS: "is",
  CONTAINS: "contains",
  EXCLUDES: "is not",
  GREATER_THAN: "greater than",
  GREATER_THAN_OR_EQUALS: "at least",
  LESS_THAN: "less than",
  LESS_THAN_OR_EQUALS: "at most",
  INCLUDES_ALL: "includes all",
  INCLUDES_ANY: "includes any",
};

interface Props {
  filter: SearchFilter;
  index: number;
  fields: FieldOptions;
  actions: FilterActions;
  onChange: (index: number, filter: SearchFilter) => void;
  onRemove: (index: number) => void;
}

function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? humanize(field);
}

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanize(action.toLowerCase());
}

function isValueSelectField(field: string): boolean {
  return VALUE_SELECT_FIELDS.has(field);
}

function getActionsForField(
  field: string,
  fields: FieldOptions,
  actions: FilterActions
): string[] {
  if (fields.numeric.includes(field)) return [...actions.comparison];
  if (fields.array.includes(field)) return [...actions.array];
  if (isValueSelectField(field)) return [...ENUM_ACTIONS];
  return [...TEXT_ACTIONS];
}

function isArrayField(field: string, fields: FieldOptions): boolean {
  return fields.array.includes(field);
}

function getDefaultAction(
  field: string,
  fields: FieldOptions,
  actions: FilterActions
): string {
  if (fields.numeric.includes(field)) {
    return field === "rank" || field === "popularity"
      ? "LESS_THAN_OR_EQUALS"
      : "GREATER_THAN_OR_EQUALS";
  }

  if (fields.array.includes(field)) {
    return actions.array.includes("INCLUDES_ANY")
      ? "INCLUDES_ANY"
      : actions.array[0] || "INCLUDES_ANY";
  }

  if (isValueSelectField(field)) {
    return "EQUALS";
  }

  return "CONTAINS";
}

function getValueOptions(field: string): string[] | null {
  if (field === "genres") return GENRES;
  if (field === "themes") return THEMES;
  if (field === "demographics") return DEMOGRAPHICS;
  if (field === "season") return SEASONS;
  if (field === "type") return TYPES;
  return null;
}

export default function FilterRow({
  filter,
  index,
  fields,
  actions,
  onChange,
  onRemove,
}: Props) {
  const allFields = [...fields.numeric, ...fields.array, ...fields.string];
  const availableActions = getActionsForField(filter.field, fields, actions);
  const isArray = isArrayField(filter.field, fields);
  const valueOptions = getValueOptions(filter.field);
  const fallbackAction =
    availableActions[0] || getDefaultAction(filter.field, fields, actions);
  const normalizedAction = availableActions.includes(filter.action)
    ? filter.action
    : fallbackAction;
  const normalizedValue = isArray
    ? Array.isArray(filter.value)
      ? filter.value
      : []
    : Array.isArray(filter.value)
      ? filter.value[0] ?? ""
      : filter.value;
  const normalizedFilter: SearchFilter = {
    ...filter,
    action: normalizedAction,
    value: normalizedValue,
  };

  const handleFieldChange = (field: string) => {
    onChange(index, {
      ...normalizedFilter,
      field,
      action: getDefaultAction(field, fields, actions),
      value: isArrayField(field, fields) ? [] : "",
    });
  };

  const handleValueChange = (value: string) => {
    if (isArray) {
      const current = Array.isArray(normalizedFilter.value)
        ? normalizedFilter.value
        : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange(index, { ...normalizedFilter, value: updated });
    } else if (fields.numeric.includes(filter.field)) {
      onChange(index, {
        ...normalizedFilter,
        value: value === "" ? "" : Number(value),
      });
    } else {
      onChange(index, { ...normalizedFilter, value });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 rounded-lg border border-border bg-card p-3">
      {/* Field and Action selectors - stack on mobile, row on desktop */}
      <div className="flex gap-2 w-full sm:w-auto">
        <select
          value={normalizedFilter.field}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="h-9 sm:h-8 rounded-md border border-input bg-background px-2 text-sm flex-1 sm:flex-initial sm:min-w-[120px]"
        >
          {allFields.map((f) => (
            <option key={f} value={f}>
              {getFieldLabel(f)}
            </option>
          ))}
        </select>

        <select
          value={normalizedFilter.action}
          onChange={(e) =>
            onChange(index, { ...normalizedFilter, action: e.target.value })
          }
          className="h-9 sm:h-8 rounded-md border border-input bg-background px-2 text-sm flex-1 sm:flex-initial sm:min-w-[140px]"
        >
          {availableActions.map((a) => (
            <option key={a} value={a}>
              {getActionLabel(a)}
            </option>
          ))}
        </select>
      </div>

      {/* Value input/selector - full width on mobile */}
      {isArray && valueOptions ? (
        <div className="flex flex-wrap gap-1.5 flex-1">
          {valueOptions.map((opt) => {
            const selected = Array.isArray(filter.value) && filter.value.includes(opt);
            return (
              <Badge
                key={opt}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer text-xs font-normal h-7"
                onClick={() => handleValueChange(opt)}
              >
                {opt}
              </Badge>
            );
          })}
        </div>
      ) : valueOptions ? (
        <select
          value={typeof normalizedFilter.value === "string" ? normalizedFilter.value : ""}
          onChange={(e) => handleValueChange(e.target.value)}
          className="h-9 sm:h-8 rounded-md border border-input bg-background px-2 text-sm w-full sm:flex-1"
        >
          <option value="">Select...</option>
          {valueOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <Input
          type={fields.numeric.includes(filter.field) ? "number" : "text"}
          value={normalizedFilter.value as string | number}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Value..."
          className="h-9 sm:h-8 w-full sm:flex-1"
        />
      )}

      {/* Remove button - full width on mobile, shrink on desktop */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="text-destructive hover:text-destructive w-full sm:w-auto sm:shrink-0 h-9 sm:h-8"
      >
        Remove
      </Button>
    </div>
  );
}
