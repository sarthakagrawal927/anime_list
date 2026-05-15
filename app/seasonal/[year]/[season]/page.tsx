import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSeason, isSeason, SEASON_ORDER } from "@/lib/seasonal-data";

export const dynamic = "force-dynamic";

const SEASON_LABEL: Record<string, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};

interface Params {
  year: string;
  season: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { year, season } = await params;
  const label = SEASON_LABEL[season] ?? season;
  return {
    title: `${label} ${year}`,
    description: `Every anime that aired in ${label} ${year}, ranked by score.`,
  };
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { year: yearStr, season } = await params;
  const year = Number(yearStr);
  if (!Number.isFinite(year) || !isSeason(season)) notFound();

  const items = await getSeason(year, season);
  if (items.length === 0) notFound();

  const label = SEASON_LABEL[season];
  const idx = SEASON_ORDER.indexOf(season);
  const prevSeason = idx === 0 ? SEASON_ORDER[3] : SEASON_ORDER[idx - 1];
  const prevYear = idx === 0 ? year - 1 : year;
  const nextSeason = idx === 3 ? SEASON_ORDER[0] : SEASON_ORDER[idx + 1];
  const nextYear = idx === 3 ? year + 1 : year;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/seasonal"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← All seasons
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            {label} {year}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} titles, ranked by MAL score.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href={`/seasonal/${prevYear}/${prevSeason}`}
            className="rounded-md border px-3 py-1.5 hover:bg-muted/40"
          >
            ← {SEASON_LABEL[prevSeason]} {prevYear}
          </Link>
          <Link
            href={`/seasonal/${nextYear}/${nextSeason}`}
            className="rounded-md border px-3 py-1.5 hover:bg-muted/40"
          >
            {SEASON_LABEL[nextSeason]} {nextYear} →
          </Link>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((a) => (
          <li
            key={a.mal_id}
            className="rounded-lg border bg-card overflow-hidden flex flex-col"
          >
            <Link
              href={`/anime/${a.mal_id}`}
              className="block aspect-[3/4] relative bg-muted/30"
            >
              {a.image ? (
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover"
                />
              ) : null}
            </Link>
            <div className="p-3 flex-1 flex flex-col gap-1">
              <Link
                href={`/anime/${a.mal_id}`}
                className="text-sm font-medium leading-snug line-clamp-2 hover:underline"
              >
                {a.title_english ?? a.title}
              </Link>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
                <span>{a.type ?? "—"}</span>
                <span className="tabular-nums">
                  {a.score != null ? a.score.toFixed(2) : "—"}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
