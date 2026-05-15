import type { Metadata } from "next";
import Link from "next/link";

import { listSeasonBuckets } from "@/lib/seasonal-data";

export const metadata: Metadata = {
  title: "Seasonal anime",
  description:
    "Browse anime by airing season. Every winter / spring / summer / fall lineup in the MAL catalogue, ranked by community size.",
};

const SEASON_LABEL: Record<string, string> = {
  winter: "Winter",
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
};

const SEASON_TINT: Record<string, string> = {
  winter: "bg-sky-500/10 text-sky-200 border-sky-500/30",
  spring: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  summer: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  fall: "bg-orange-500/10 text-orange-200 border-orange-500/30",
};

export default async function SeasonalIndex() {
  const buckets = await listSeasonBuckets();

  const byYear = new Map<number, typeof buckets>();
  for (const b of buckets) {
    const arr = byYear.get(b.year) ?? [];
    arr.push(b);
    byYear.set(b.year, arr);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Seasonal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every season of anime in the catalogue, ranked. Pick a year, pick a
          season, see what aired.
        </p>
      </div>

      <div className="space-y-8">
        {years.map((year) => {
          const seasons = byYear.get(year) ?? [];
          return (
            <section key={year}>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                {year}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {seasons.map((s) => {
                  const tint = SEASON_TINT[s.season] ?? "bg-muted/30";
                  return (
                    <Link
                      key={s.season}
                      href={`/seasonal/${s.year}/${s.season}`}
                      className={`rounded-lg border p-4 hover:bg-muted/40 transition ${tint}`}
                    >
                      <div className="text-sm font-semibold">
                        {SEASON_LABEL[s.season] ?? s.season}
                      </div>
                      <div className="text-xs opacity-80 mt-1">
                        {s.count} title{s.count === 1 ? "" : "s"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
