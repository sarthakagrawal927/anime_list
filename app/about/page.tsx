import Link from "next/link";

export const metadata = {
  title: "About — MAL Explorer",
  description:
    "Anime / manga discovery on top of MyAnimeList and AniList data, with multi-field filters, watchlist sync, and auto-updates.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← Home
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">About</h1>
      <p className="mt-4 text-sm leading-7">
        MAL Explorer is a faster, focused way to discover anime and
        manga on top of the public MAL and AniList APIs. Filter by
        score, type, genre, year, status, and members in one query;
        rank by a log-scale popularity formula so cult titles aren&apos;t
        buried under mega-popular ones; sync your watchlist.
      </p>

      <h2 className="mt-8 text-base font-semibold">What you can do</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>Filter the 14,800-title catalogue across multiple dimensions in one URL.</li>
        <li>Keep a personal watchlist with statuses: Watching, Completed, Deferred, Avoiding, BRR.</li>
        <li>Sync with MAL or AniList — your watchlist stays in step with the platform you already use.</li>
        <li>Surprise yourself with <Link href="/random" className="underline">/random</Link> or <Link href="/genre/action" className="underline">/genre/[genre]</Link>.</li>
        <li>Check what&apos;s airing this week on <Link href="/schedule" className="underline">/schedule</Link>.</li>
      </ul>

      <h2 className="mt-8 text-base font-semibold">How it stays fresh</h2>
      <p className="mt-2 text-sm leading-7">
        A daily GitHub Action pulls deltas from the Jikan API at midnight UTC.
        A separate quarterly job does a full refresh. An always-warm in-memory
        cache means searches are sub-millisecond once the server is up.
      </p>

      <h2 className="mt-8 text-base font-semibold">Privacy</h2>
      <p className="mt-2 text-sm leading-7">
        Sign-in is Google OAuth. Your watchlist is private to your account.
        We don&apos;t share, sell, or analytics-tag anything. See <Link href="/terms" className="underline">/terms</Link> for the rest.
      </p>
    </main>
  );
}
