import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  getTopByMembers,
  getTopByScore,
  isTopOrder,
  type TopAnime,
  type TopOrder,
} from "@/lib/top-data";

export const metadata: Metadata = {
  title: "Top anime",
  description:
    "The 200 highest-scored and most-watched anime in the MAL catalogue. Switch between score and members rankings to compare critical reception vs popularity.",
};

interface SP {
  by?: string;
}

export default async function TopPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const order: TopOrder = isTopOrder(sp.by) ? sp.by : "score";
  const items: TopAnime[] =
    order === "score" ? await getTopByScore(200) : await getTopByMembers(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Top anime</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {order === "score"
            ? "200 highest-scored titles in the catalogue."
            : "200 most-watched titles by MAL member count."}
        </p>
      </div>

      <div className="inline-flex gap-2 text-xs">
        <Link
          href="/top?by=score"
          className={`rounded-md border px-3 py-1.5 ${
            order === "score" ? "bg-primary/15 text-primary border-primary/30" : "hover:bg-muted/40"
          }`}
        >
          By score
        </Link>
        <Link
          href="/top?by=members"
          className={`rounded-md border px-3 py-1.5 ${
            order === "members" ? "bg-primary/15 text-primary border-primary/30" : "hover:bg-muted/40"
          }`}
        >
          By popularity
        </Link>
      </div>

      <ol className="divide-y divide-border rounded-lg border bg-card">
        {items.map((a, i) => (
          <li key={a.mal_id} className="flex items-center gap-4 px-4 py-3">
            <div className="w-8 text-right tabular-nums text-xs font-mono text-muted-foreground">
              {i + 1}
            </div>
            <Link
              href={`/anime/${a.mal_id}`}
              className="block h-14 w-10 flex-shrink-0 relative bg-muted/30 rounded overflow-hidden"
            >
              {a.image ? (
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : null}
            </Link>
            <div className="flex-1 min-w-0">
              <Link
                href={`/anime/${a.mal_id}`}
                className="text-sm font-medium hover:underline line-clamp-1"
              >
                {a.title_english ?? a.title}
              </Link>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {a.type ?? "—"} · {a.year ?? "—"}{" "}
                {a.season ? `· ${a.season}` : ""}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="tabular-nums font-medium text-foreground">
                {order === "score"
                  ? a.score != null
                    ? a.score.toFixed(2)
                    : "—"
                  : a.members != null
                    ? a.members.toLocaleString()
                    : "—"}
              </div>
              <div className="tabular-nums text-muted-foreground">
                {order === "score"
                  ? a.members != null
                    ? `${(a.members / 1000).toFixed(0)}k`
                    : "—"
                  : a.score != null
                    ? a.score.toFixed(2)
                    : "—"}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
