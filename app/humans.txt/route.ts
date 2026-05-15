export const dynamic = "force-static";

const BODY = `/* TEAM */
Maintainer: Sarthak Agrawal
GitHub: sarthakagrawal927

/* THANKS */
MyAnimeList and AniList — the upstream data sources.
Jikan — the unofficial MAL API.

/* SITE */
Last updated: 2026-05-15
Software: Next.js, React, Express, Turso (libSQL), Cloudflare Worker (Hono cron)
`;

export function GET() {
  return new Response(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
