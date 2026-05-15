import { NextResponse } from "next/server";

import { getSeason, isSeason } from "@/lib/seasonal-data";

export const dynamic = "force-dynamic";

/**
 * Public JSON of a season's anime, ranked by score. Lets external tools
 * (RSS bots, recommender experiments, fan sites) read a single season
 * without scraping the HTML.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ year: string; season: string }> },
) {
  const { year: yearStr, season } = await ctx.params;
  const year = Number(yearStr);
  if (!Number.isFinite(year) || !isSeason(season)) {
    return NextResponse.json({ error: "invalid_season" }, { status: 400 });
  }

  const items = await getSeason(year, season);
  return NextResponse.json(
    { year, season, count: items.length, items, generatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
