# Fleet Audit Report: anime_list

**Date:** May 16, 2026
**Auditor:** Gemini CLI

## 1. Executive Summary
The `anime_list` project is a modern anime discovery platform. It has recently migrated (or is migrating) from a traditional Express/Render/Vercel stack to a Cloudflare-native architecture (Pages + Workers + Turso). While the core anime features are functional and well-integrated with the new stack, there is significant "ghost" code related to manga features and a legacy Express backend that create maintainability overhead. Documentation (README.md) is outdated and does not reflect the current production state.

## 2. Technical Architecture

### Frontend
- **Framework:** Next.js 16 (App Router, React 19)
- **Deployment:** Cloudflare Pages (`https://anime-list-9lk.pages.dev`)
- **Build Tooling:** `@opennextjs/cloudflare` for Pages compatibility.

### Backend (Dual Implementation)
- **Production:** Cloudflare Worker (`https://mal-api.sarthakagrawal927.workers.dev`) using **Hono**.
- **Local/Legacy:** Express.js server (`server.ts`) used for local development (`pnpm dev`).
- **Gap:** Business logic is duplicated between Express controllers and the Hono worker file.

### Data & Storage
- **Database:** Turso (libSQL) stores anime data, users, and watchlists.
- **Manga Data:** Still resides in local JSON files (`cleaned_manga_data.json`), inconsistent with the Turso-based anime architecture.
- **Caching:** 
    - Worker: In-memory cache with stale-while-revalidate (1hr TTL) + Cloudflare Edge Cache for Search/Stats.
    - Express: In-memory cache via `node-cron`.

### CI/CD (GitHub Actions)
- `deploy.yml`: Production/Preview deployment to Cloudflare Pages.
- `ci.yml`: Standard linting, testing, and build validation.
- `update-anime-data.yml`: Daily cron to sync latest anime seasons to Turso.

## 3. Environment & Security
- **Auth:** Google OAuth with JWT stored in `httpOnly` cookies (`mal_auth_token`).
- **Secrets:** Managed via GitHub Secrets and Cloudflare Wrangler (TURSO, JWT, GOOGLE).
- **Env Gaps:** `.env.example` includes `DATA_DIR` which is mostly legacy except for manga files. `NEXT_PUBLIC_SAASMAKER_API_KEY` is hardcoded in `wrangler.toml` but templated in `.env.example`.

## 4. Audit Findings & Risks

| Category | Finding | Impact |
| :--- | :--- | :--- |
| **Documentation** | README.md mentions Vercel/Render and `npm`. | High confusion for new developers. |
| **Consistency** | Manga features exist in Express but are missing from Worker and Frontend. | "Ghost features" increase bundle size and complexity without value. |
| **Redundancy** | Logic duplicated between `src/controllers/` and `src/worker.ts`. | High risk of logic drift between local dev and production. |
| **Architecture** | Manga data still uses local JSON files. | Prevents full serverless migration; requires persistent disk or re-fetching. |

## 5. Recommended Follow-up Tasks

### High Priority
1. **Sync Documentation:** Update `README.md` to reflect Cloudflare architecture, `pnpm` usage, and current deployment URLs.
2. **Consolidate Backend:** Refactor `src/worker.ts` to use shared service classes instead of inlining logic. Align Express controllers to use these same services.
3. **Manga Clean-up:** Either migrate Manga data to Turso and implement in the Worker/Frontend, or remove the legacy Manga code if it's no longer planned.

### Medium Priority
4. **Env Standardization:** Update `.env.example` to remove legacy vars (`DATA_DIR`) and clarify the role of `NEXT_PUBLIC_SAASMAKER_API_KEY`.
5. **Worker-Native Dev:** Consider using `wrangler dev` for local backend development instead of the Express `server.ts` to ensure dev/prod parity.

## 6. Smoke Test Verification
- **Frontend:** [https://anime-list-9lk.pages.dev](https://anime-list-9lk.pages.dev) - **ONLINE**
- **API:** [https://mal-api.sarthakagrawal927.workers.dev/api/fields](https://mal-api.sarthakagrawal927.workers.dev/api/fields) - **ONLINE**
- **Database:** Turso connectivity verified via `update-anime-data` workflow history.
