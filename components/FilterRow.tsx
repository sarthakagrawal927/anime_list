"use client";

import type { SearchFilter, FieldOptions, FilterActions } from "@/lib/types";

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

interface Props {
  filter: SearchFilter;
  index: number;
  fields: FieldOptions;
  actions: FilterActions;
  onChange: (index: number, filter: SearchFilter) => void;
  onRemove: (index: number) => void;
}

function getActionsForField(
  field: string,
  fields: FieldOptions,
  actions: FilterActions
): string[] {
  if (fields.numeric.includes(field)) return [...actions.comparison];
  if (fields.array.includes(field)) return [...actions.array];
  return ["EQUALS", "CONTAINS"];
}

function isArrayField(field: string, fields: FieldOptions): boolean {
  return fields.array.includes(field);
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

  const handleFieldChange = (field: string) => {
    const newActions = getActionsForField(field, fields, actions);
    const newIsArray = isArrayField(field, fields);
    onChange(index, {
      ...filter,
      field,
      action: newActions[0] || filter.action,
      value: newIsArray ? [] : "",
    });
  };

  const handleValueChange = (value: string) => {
    if (isArray) {
      const current = Array.isArray(filter.value) ? filter.value : [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange(index, { ...filter, value: updated });
    } else if (fields.numeric.includes(filter.field)) {
      onChange(index, { ...filter, value: value === "" ? "" : Number(value) });
    } else {
      onChange(index, { ...filter, value });
    }
  };

  return (
    <div className="flex items-start gap-2 bg-gray-900 p-3 rounded-lg border border-gray-800">
      <select
        value={filter.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200"
      >
        {allFields.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <select
        value={filter.action}
        onChange={(e) => onChange(index, { ...filter, action: e.target.value })}
        className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200"
      >
        {availableActions.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {isArray && valueOptions ? (
        <div className="flex flex-wrap gap-1 flex-1">
          {valueOptions.map((opt) => {
            const selected = Array.isArray(filter.value) && filter.value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleValueChange(opt)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : valueOptions ? (
        <select
          value={filter.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200 flex-1"
        >
          <option value="">Select...</option>
          {valueOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={fields.numeric.includes(filter.field) ? "number" : "text"}
          value={filter.value as string | number}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Value..."
          className="bg-gray-800 text-sm rounded px-2 py-1.5 border border-gray-700 text-gray-200 flex-1"
        />
      )}

      <button
        onClick={() => onRemove(index)}
        className="text-red-400 hover:text-red-300 px-2 py-1.5 text-sm shrink-0"
      >
        Remove
      </button>
    </div>
  );
}
