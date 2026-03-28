# Security Audit — mal
**Date**: 2026-03-28 | **Status**: Paused

## Secrets in Git History
- Commit `35437e3` touched secret-sensitive file paths (SaaS Maker SDK integration).
- `.env.local` is **tracked in git** and contains `NEXT_PUBLIC_SAASMAKER_API_KEY`. Remove and rotate if sensitive.

## Credentials on Disk
- `.env` contains **live Turso auth token**, Google Client ID, JWT secret, and CRON secret. File is gitignored -- OK.
- `.env.local` contains a SaaS Maker public API key. File is **NOT gitignored** and is committed.
- `src/worker.ts:70` has a hardcoded fallback JWT secret: `mal-explorer-dev-secret-change-in-prod`.

## Deployment
- **Cloudflare Workers** via `wrangler.toml` (secrets managed via `wrangler secret put`).
- **Vercel** frontend at `anime-explorer-mal.vercel.app`.
- CORS is properly scoped to Vercel origin + localhost (not wildcard).

## Code Security
- `dangerouslySetInnerHTML` in `app/layout.tsx` -- used for static JSON-LD structured data only. **Low risk**.
- Rate limiting present on Express path (`src/app.ts`). Helmet + compression enabled.
- No hardcoded `sk-*` keys or raw passwords found in source.

## Action Items
- [ ] Remove `.env.local` from git tracking: `git rm --cached .env.local` and add to `.gitignore`
- [ ] Rotate Turso auth token in `.env` (exposed on disk, verify not in any prior commit)
- [ ] Replace hardcoded JWT fallback in `src/worker.ts:70` with a startup error if env var is missing
- [ ] Rotate `CRON_SECRET` in `.env` as a precaution
