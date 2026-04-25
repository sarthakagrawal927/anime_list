# agents.md — anime_list (MAL Explorer)

## Purpose
Anime/manga discovery platform with 14,800+ titles, multi-field filtering, personal watchlists, schedule tracking, and daily auto-sync from MyAnimeList via Jikan API.

## Stack
- Framework: Next.js 16 (App Router) + Express 5 (run concurrently via `concurrently`)
- Language: TypeScript (full stack)
- Styling: Tailwind CSS v4 + shadcn/ui
- DB: Turso (libSQL) — anime data + user watchlists; also Cloudflare Worker (Hono) with daily cron
- Auth: Google OAuth 2.0 + JWT (`jose` + `google-auth-library`)
- Testing: Jest (unit), Playwright (e2e)
- Deploy: Vercel (frontend + Express via `vercel.json`) + Cloudflare Worker (`wrangler deploy`)
- Package manager: pnpm

## Repo structure
```
app/                     # Next.js App Router pages
components/              # React components (AnimeCard, FilterBuilder, StatsCharts, WatchlistView)
  ui/                    # shadcn/ui primitives
lib/                     # Frontend utils (auth.tsx, api.ts, types.ts)
src/                     # Express backend (port 8080)
  app.ts                 # Express factory (helmet, cors, rate-limit, compression)
  config.ts              # Enums: AnimeField, FilterAction, Genre, WatchStatus
  dataProcessor.ts       # Core filter engine + scoring algorithm
  statistics.ts          # Aggregation/analytics
  controllers/           # Route handlers (anime, manga, schedule, animeDetail)
  routes/                # animeRoutes, mangaRoutes, authRoutes
  db/                    # Turso client, watchlist CRUD, users, migrations
  store/                 # In-memory cache (stale-while-revalidate, <1ms)
  middleware/            # auth.ts (JWT), rateLimit.ts, validation.ts
  services/              # anilistStatusSync.ts, dataLoader.ts
  types/                 # anime.ts, manga.ts, watchlist.ts
  validators/            # Zod schemas for all API inputs
  worker.ts              # Cloudflare Worker entry (Hono, daily cron @ 3 AM UTC)
scripts/                 # seed-watchlist.ts, restore-legacy-tags.ts
server.ts                # Express entry point
cleaned_anime_data.json  # ~17MB processed dataset (committed)
cleaned_manga_data.json  # ~23MB processed dataset (committed)
```

## Key commands
```bash
pnpm dev              # Both backend (tsx watch server.ts) + frontend (next dev) via concurrently
pnpm dev:be           # Backend only (Express port 8080)
pnpm dev:fe           # Frontend only (Next.js port 3000)
pnpm build            # Next.js production build
pnpm test             # Jest unit tests
pnpm test:e2e:anime-detail  # Playwright e2e
pnpm db:seed          # Seed Turso from JSON data
pnpm db:update        # Update anime data from Jikan API
pnpm db:quarterly-sync  # Full quarterly data sync
pnpm dev:worker       # Cloudflare Worker local dev
pnpm deploy:worker    # Deploy Cloudflare Worker
```

## Architecture notes
- **Dual backend**: Express (primary, port 8080) + Cloudflare Worker (Hono, edge). Worker runs daily cron @ 3 AM UTC for DB refresh.
- **In-memory cache**: 14,800+ anime loaded on startup into in-memory store with stale-while-revalidate. All searches <1ms.
- **Scoring algorithm**: log-scale prevents mega-popular titles from dominating — `log10(score)*10 + log10(members/10000) + log10(favorites/100)`.
- **Daily auto-update**: GitHub Actions `update-anime-data.yml` hits Jikan API daily at midnight UTC. `quarterly-anime-sync.yml` for full refresh.
- **Watch statuses**: `Watching`, `Completed`, `Deferred`, `Avoiding`, `BRR`.
- **Rate limit**: 100 req/min per IP.
- **Worker secrets** via `wrangler secret put`: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`.
- Husky pre-push hook configured.

## Active context
