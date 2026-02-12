# AGENTS.md - Complete Development Guide for AI Agents

## Table of Contents
1. [Project Overview](#project-overview)
2. [Complete Architecture](#complete-architecture)
3. [File System Map](#file-system-map)
4. [Data Flow & Processing](#data-flow--processing)
5. [Development Patterns](#development-patterns)
6. [How to Make Changes](#how-to-make-changes)
7. [Technical Decisions](#technical-decisions)
8. [Common Tasks](#common-tasks)
9. [Debugging & Testing](#debugging--testing)
10. [Deployment](#deployment)

---

## Project Overview

### What This Project Does
MAL Explorer is a full-stack anime discovery and tracking platform that enables users to:
- Search through 15,000+ anime titles with sophisticated multi-field filtering
- View aggregate statistics across the entire dataset
- Maintain personal watchlists with Google OAuth authentication
- Sort results using a custom scoring algorithm that balances quality and popularity

### Primary Technologies
- **Frontend**: Next.js 15 (React 19, App Router), TailwindCSS 4, shadcn/ui, TanStack Query v5
- **Backend**: Express.js, TypeScript, Node.js with stale-while-revalidate in-memory caching
- **Database**: Turso (libSQL) for anime data (14,800+ titles) and user watchlists
- **Authentication**: Google OAuth 2.0 with JWT
- **Data Source**: MyAnimeList via Jikan API v4
- **Automation**: GitHub Actions for daily anime data updates (midnight UTC)
- **Deployment**: Vercel (frontend), Render (backend), Turso (database)

### Key Statistics
- Total commits: 90+
- Lines of code: ~10,000+ (excluding node_modules)
- Database size: 14,842 anime titles in Turso
- Search performance: <1ms (in-memory cache with stale-while-revalidate)
- Dataset: 14,800+ anime, auto-updated daily via GitHub Actions
- Cache strategy: 1-hour TTL, background refresh, 100% instant responses

### Project Evolution Timeline
1. **Initial**: Node.js script for data fetching (`f766faa`)
2. **v0.1**: Express API with in-memory storage (`7a0f64d`)
3. **v0.2**: TypeScript conversion and modular structure (`762670b`)
4. **v0.3**: Next.js frontend integration (`5b0bb53`)
5. **v0.4**: Google OAuth and multi-user support (`4313fec`)
6. **v0.5**: Turso database for persistence (`2245b75`)
7. **Current**: Full-featured app with advanced filtering, statistics, and watchlists (67 commits)

---

## Complete Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  Next.js 15 (App Router) + React 19 + TailwindCSS 4       │
│                                                             │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐        │
│  │   /page    │  │  /stats     │  │  /watchlist  │        │
│  │ (Search)   │  │ (Analytics) │  │ (Personal)   │        │
│  └────────────┘  └─────────────┘  └──────────────┘        │
│                                                             │
│  Components: FilterBuilder, AnimeCard, StatsCharts, etc.   │
│  State: TanStack Query (client cache + server sync)        │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│         Express.js + TypeScript (Port 8080)                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Routes Layer (animeRoutes, authRoutes, etc.)      │   │
│  └───────────────────┬─────────────────────────────────┘   │
│                      ▼                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Controllers (animeController, mangaController)     │   │
│  └───────────────────┬─────────────────────────────────┘   │
│                      ▼                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Business Logic (dataProcessor, statistics)         │   │
│  └───────────────────┬─────────────────────────────────┘   │
│                      ▼                                      │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ In-Memory Cache      │  │  Turso Database          │    │
│  │ - 14.8k anime        │  │  - Anime data (14.8k)    │    │
│  │ - 1hr TTL            │  │  - User watchlists       │    │
│  │ - Stale-while-       │  │  - Indexed queries       │    │
│  │   revalidate         │  │  - Auto-updated daily    │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                             │
│  External: Jikan API (MAL data) + Google OAuth             │
│  Automation: GitHub Actions (daily cron at midnight UTC)   │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Patterns (from 67 commits)

#### 1. Progressive Enhancement
- **Commit f766faa**: Started as simple Node.js script
- **Commit 7a0f64d**: Evolved to Express server
- **Commit 762670b**: TypeScript conversion for type safety
- **Commit 5b0bb53**: Next.js frontend integration
- **Commit 4313fec**: Google OAuth and multi-user support

**Pattern**: Always build incrementally, validate each layer before adding the next

#### 2. Data Management Evolution
- **Phase 1**: In-memory storage (`a2ff1da Use memory based storage`)
- **Phase 2**: JSON file persistence for anime/manga data
- **Phase 3**: Turso (libSQL) for user-specific data (`2245b75`)

**Why**: Large datasets (100MB+) perform better as in-memory JSON, user data needs database ACID guarantees

#### 3. Performance Optimization Focus
- **Commit 047a1d4**: Search optimization: 18k items in 17s → ~100ms
- **Commit 0862b99**: Incremental data loading on startup
- **Commit 38326dd**: React Query caching with stale-while-revalidate
- **Commit 1a3738a**: Pagination with load more

**Pattern**: Measure first, optimize bottlenecks, cache aggressively

#### 4. UI/UX Refinements
- **Commit 3f5ab12**: Complete rewrite with shadcn/ui
- **Commit addd966**: AniList-inspired navy-blue theme
- **Commit a2a5052**: Poster-style cards with hover effects
- **Commit 1f964af**: Color-coded watchlist tabs, skeleton loading

**Pattern**: Consistent design system, progressive disclosure, perceived performance

#### 5. Recent Major Improvements (Latest Commits)

**Database Migration to Turso**
- **Commits 6350f54, 190cb60, 3d37466**: Migrated anime data from JSON files to Turso database
- Created `anime_data` table with 14,842 titles, indexed for fast queries
- Implemented `upsertAnimeBatch()` for efficient bulk updates
- Added migration system for schema management

**Stale-While-Revalidate Caching**
- **Commit 40af8b7**: Implemented zero-latency cache refresh pattern
- Cache serves stale data instantly while refreshing in background
- 1-hour TTL with automatic background updates
- 100% of requests now <1ms (previously 0.1% suffered 1114ms Turso latency)

**GitHub Actions Automation**
- **Commits 68b6192, 6243ee4**: Daily cron job for anime data updates
- Runs at midnight UTC, fetches latest two seasons from Jikan API
- Directly updates Turso database (no Render dependency)
- Workflow: GitHub Actions → Turso DB → Render auto-refreshes from DB

**Stats Include-Only Filter Fix**
- **Commit e9596f5**: Fixed stats filter to show only watchlisted items
- Created `includeOnlyWatchedItems()` helper
- Prevents non-watchlisted anime from appearing in filtered stats
- Inverted UI logic from "exclude" to "include only" for clarity

**Pattern**: Performance optimization through strategic caching, automation for zero-maintenance updates, database-first approach for persistence

---

## File System Map

### Directory Structure
```
/Users/sarthakagrawal/Desktop/mal/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers, metadata
│   ├── page.tsx                 # Home page (search/discovery)
│   ├── stats/
│   │   ├── layout.tsx           # Stats page layout
│   │   └── page.tsx             # Statistics dashboard
│   └── watchlist/
│       └── page.tsx             # Personal watchlist page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── button.tsx           # Button component with variants
│   │   ├── card.tsx             # Card container
│   │   ├── tabs.tsx             # Tabbed interface
│   │   ├── select.tsx           # Dropdown select
│   │   ├── input.tsx            # Input field
│   │   ├── badge.tsx            # Badge/chip component
│   │   ├── dropdown-menu.tsx    # Dropdown menu
│   │   ├── avatar.tsx           # User avatar
│   │   └── separator.tsx        # Visual separator
│   ├── FilterBuilder.tsx        # Multi-row filter builder UI
│   ├── FilterRow.tsx            # Individual filter row component
│   ├── AnimeCard.tsx            # Poster-style anime card
│   ├── ResultsGrid.tsx          # Responsive grid layout
│   ├── StatsCharts.tsx          # Statistics visualizations
│   ├── WatchlistView.tsx        # Tabbed watchlist view
│   ├── Navigation.tsx           # Sticky nav bar with auth
│   └── GoogleSignInButton.tsx   # Google OAuth button
├── lib/                         # Frontend utilities
│   ├── auth.tsx                 # Auth context provider, JWT management
│   ├── query-provider.tsx       # TanStack Query configuration
│   ├── api.ts                   # API client functions
│   ├── types.ts                 # Frontend type definitions
│   └── utils.ts                 # Utility functions (cn, etc.)
├── src/                         # Backend source code
│   ├── app.ts                   # Express app factory
│   ├── config.ts                # Enums, constants, configuration
│   ├── dataProcessor.ts         # Core filtering and data transformation
│   ├── statistics.ts            # Aggregation and analytics functions
│   ├── api.ts                   # Jikan API integration
│   ├── controllers/             # Route handlers
│   │   ├── animeController.ts   # Anime endpoints
│   │   ├── mangaController.ts   # Manga endpoints
│   │   └── helpers.ts           # Shared controller utilities
│   ├── routes/                  # API route definitions
│   │   ├── animeRoutes.ts       # /api/search, /api/stats, etc.
│   │   ├── mangaRoutes.ts       # /api/manga/*
│   │   └── authRoutes.ts        # /api/auth/*
│   ├── db/                      # Database operations
│   │   ├── client.ts            # Turso libSQL client
│   │   ├── watchlist.ts         # Watchlist CRUD operations
│   │   ├── users.ts             # User management
│   │   └── migrations.ts        # Schema migrations
│   ├── validators/              # Zod validation schemas
│   │   ├── animeFilters.ts      # Anime filter validation
│   │   ├── mangaFilters.ts      # Manga filter validation
│   │   ├── watchedList.ts       # Watchlist payload validation
│   │   ├── commonFilters.ts     # Shared validation logic
│   │   └── filterSchemaFactory.ts # Reusable schema builder
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # JWT verification middleware
│   │   └── validation.ts        # Request validation middleware
│   ├── store/                   # In-memory data cache
│   │   ├── animeStore.ts        # Anime data store
│   │   └── mangaStore.ts        # Manga data store
│   ├── services/                # Business logic services
│   │   └── dataLoader.ts        # Load and cache JSON data
│   ├── types/                   # TypeScript type definitions
│   │   ├── anime.ts             # Anime-related types
│   │   ├── manga.ts             # Manga-related types
│   │   ├── watchlist.ts         # Watchlist types
│   │   └── statistics.ts        # Statistics types
│   └── utils/                   # Utility functions
│       ├── logger.ts            # Pino structured logging
│       ├── statistics.ts        # Stats calculation helpers
│       ├── functional.ts        # Pure utility functions
│       └── file.ts              # File I/O operations
├── scripts/                     # Utility scripts
│   └── seed-watchlist.ts        # Database seeding script
├── server.ts                    # Server entry point
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js build configuration
├── postcss.config.mjs           # PostCSS configuration
├── components.json              # shadcn/ui configuration
├── Dockerfile                   # Docker containerization
├── vercel.json                  # Vercel deployment config
├── .env                         # Environment variables
├── .gitignore                   # Git ignore patterns
├── .dockerignore                # Docker ignore patterns
├── anime-api.http               # API testing (REST Client)
├── manga-api.http               # Manga API testing
├── cleaned_anime_data.json      # Processed anime dataset (~17MB)
├── cleaned_manga_data.json      # Processed manga dataset (~23MB)
├── anime_data.json              # Raw anime data (~108MB)
└── manga_data.json              # Raw manga data (~85MB)
```

### Key Files Deep Dive

#### Frontend Files

**`/app/layout.tsx`** (Root Layout)
- Sets up HTML structure and metadata
- Wraps app with AuthProvider and QueryProvider
- Includes Navigation component
- Loads TailwindCSS and global styles
- Purpose: Application shell and provider hierarchy

**`/app/page.tsx`** (Home/Search Page)
- Main search and discovery interface
- Integrates FilterBuilder component
- Displays ResultsGrid with AnimeCard components
- Handles pagination and infinite scroll
- Quick genre chips for common filters
- Hide-watched toggle
- Purpose: Primary user interaction point

**`/components/FilterBuilder.tsx`** (Filter UI)
- Manages array of filter rows
- Add/remove filter functionality
- Field selection, action selection, value input
- Advanced filters expand/collapse
- Airing status toggle chips
- Submit button triggers search
- Purpose: User-friendly filter construction

**`/components/AnimeCard.tsx`** (Display Component)
- Poster-style card with cover image
- Hover effects reveal details
- Quick action buttons (watch status)
- Shows title, score, year, type, episodes
- Truncated synopsis on hover
- Links to MAL page
- Purpose: Primary data presentation unit

**`/lib/auth.tsx`** (Authentication Context)
- React context for auth state
- Google OAuth integration
- JWT token storage (localStorage)
- User profile management
- Login/logout functions
- Auto-refresh on app load
- Purpose: Centralized auth state

#### Backend Files

**`/src/app.ts`** (Express App Factory)
- Creates and configures Express app
- Middleware stack setup:
  1. Helmet (security headers)
  2. express.json() (body parsing)
  3. compression() (response compression)
  4. cors() (CORS handling with whitelist)
  5. rateLimit() (100 req/min per IP)
- Route registration
- Global error handler
- Purpose: Application configuration

**`/src/config.ts`** (Constants and Enums)
- AnimeField enum (mal_id, title, score, genres, etc.)
- FilterAction enum (EQUALS, GREATER_THAN, INCLUDES_ALL, etc.)
- Genre enum (all MAL genres: Comedy, Action, Fantasy, etc.)
- Theme enum (all MAL themes: Music, School, Isekai, etc.)
- WatchStatus enum (Watching, Completed, Deferred, Avoiding, BRR)
- API_CONFIG (Jikan API endpoints, rate limits)
- FILE_PATHS (data file locations)
- SERVER_CONFIG (port, routes)
- Purpose: Single source of truth for constants

**`/src/dataProcessor.ts`** (Core Business Logic)
- transformRawAnime(): Converts API data to internal format
- cleanAnimeData(): Filters valid entries
- getAnimeFieldValue(): Extracts field from anime object
- applyFilter(): Applies single filter to dataset
- applyFilters(): Chains multiple filters using reduce
- sortAnimeByPoints(): Custom scoring algorithm
  - Score: logarithmic normalization
  - Members: logarithmic normalization
  - Favorites: logarithmic normalization
  - Combined weighted formula
- Purpose: Data transformation and filtering engine

**`/src/statistics.ts`** (Analytics Engine)
- getAnimeStats(): Calculates aggregate statistics
  - Score distribution (7-8, 8-9, 9+)
  - Member distribution (100k-1M, 1M+)
  - Genre counts and average scores
  - Theme counts and average scores
  - Popular genre combinations
- getDistribution(): Bucketing algorithm
- Purpose: Insights and analytics generation

**`/src/db/watchlist.ts`** (Database Operations)
- initWatchlistTables(): Create tables if not exist
- getAnimeWatchlist(): Fetch user's anime watchlist
- upsertAnimeWatchlist(): Add/update watchlist entries (batch)
- getMangaWatchlist(): Fetch user's manga watchlist
- upsertMangaWatchlist(): Add/update manga watchlist
- Uses parameterized queries to prevent SQL injection
- Batch operations for performance
- Purpose: Watchlist persistence layer

**`/src/controllers/animeController.ts`** (HTTP Handlers)
- searchAnime(): POST /api/search
  - Validates filters with Zod
  - Applies filters to dataset
  - Sorts by custom algorithm
  - Paginates results
  - Returns anime + metadata
- getAnimeStats(): GET /api/stats
  - Calculates statistics
  - Optionally excludes watched anime
- getWatchlist(): GET /api/watchlist
  - Requires authentication
  - Returns user's watchlist
- addToWatchlist(): POST /api/watchlist/add
  - Requires authentication
  - Batch upsert to database
- Purpose: Request handling and response formatting

**`/src/services/dataLoader.ts`** (Data Loading)
- loadAnimeData(): Reads and caches anime JSON
- loadMangaData(): Reads and caches manga JSON
- Lazy loading pattern (load on first request or startup)
- Error handling with fallback
- Memory optimization
- Purpose: Efficient data loading

**`/src/validators/animeFilters.ts`** (Input Validation)
- Zod schemas for filter validation
- Field-specific value validation
- Action compatibility checks
- Type coercion and transformation
- Error messages for invalid input
- Purpose: Request safety and type guarantees

---

## Data Flow & Processing

### 1. Initial Data Loading (Server Startup)
```
server.ts (entry point)
    ↓
Load anime data: dataLoader.loadAnimeData()
    ↓ reads cleaned_anime_data.json (~17MB)
    ↓ parses JSON to AnimeItem[]
    ↓ stores in animeStore.data
    ↓
Load manga data: dataLoader.loadMangaData()
    ↓ reads cleaned_manga_data.json (~23MB)
    ↓ stores in mangaStore.data
    ↓
Initialize database: db.initWatchlistTables()
    ↓ CREATE TABLE IF NOT EXISTS anime_watchlist
    ↓ CREATE TABLE IF NOT EXISTS manga_watchlist
    ↓ CREATE TABLE IF NOT EXISTS users
    ↓
Start cron job: node-cron (daily 3 AM UTC)
    ↓ refreshes data from Jikan API
    ↓
Start listening on port 8080
```

### 2. Search Request Flow
```
User enters filters in FilterBuilder
    ↓
Clicks "Search" button
    ↓
Frontend: POST /api/search
    Body: {
      filters: [{ field, action, value }, ...],
      sortBy: "points",
      airing: "any",
      hideWatched: ["Completed"],
      pagesize: 20,
      offset: 0
    }
    ↓
Backend: animeRoutes.ts → animeController.searchAnime()
    ↓
Validate request body with Zod schema
    ↓
Get anime dataset: animeStore.getData()
    ↓
Get user's watchlist: db.getAnimeWatchlist(userId)
    ↓
Filter out watched anime (if hideWatched set)
    ↓
Apply each filter: dataProcessor.applyFilters()
    For each filter:
      - Extract field value: getAnimeFieldValue()
      - Apply action: EQUALS, GREATER_THAN, INCLUDES_ALL, etc.
      - Filter array
    ↓
Sort results: dataProcessor.sortAnimeByPoints()
    - Calculate custom score for each anime
    - Sort descending by score
    ↓
Paginate: slice(offset, offset + pagesize)
    ↓
Return response: { data: anime[], meta: { total, offset, pagesize } }
    ↓
Frontend: TanStack Query caches response
    ↓
Render ResultsGrid with AnimeCard components
```

### 3. Watchlist Update Flow
```
User hovers over AnimeCard
    ↓
Clicks watch status button (e.g., "Watching")
    ↓
Frontend: POST /api/watchlist/add
    Headers: { Authorization: Bearer <jwt_token> }
    Body: { mal_ids: ["12345"], status: "Watching" }
    ↓
Backend: middleware/auth.ts → verify JWT
    - Decode token
    - Verify with Google API
    - Attach user to request
    ↓
Controller: animeController.addToWatchlist()
    ↓
Database: db.upsertAnimeWatchlist(malIds, status, userId)
    - Batch INSERT ... ON CONFLICT DO UPDATE
    - Atomic operation
    ↓
Return success response
    ↓
Frontend: Invalidate watchlist query
    ↓
TanStack Query refetches watchlist
    ↓
UI updates to reflect new status
```

---

## Development Patterns

### Commit Message Conventions (from 67 commits)
- `feat:` - New features (38 uses)
  - Example: `feat: add Google OAuth, per-user watchlists, anime images`
- `fix:` - Bug fixes (17 uses)
  - Example: `fix: vendor tw-animate CSS locally to permanently fix dev CSS loading`
- `refactor:` - Code restructuring (7 uses)
  - Example: `refactor: rewrite all components with shadcn/ui`
- `style:` - Visual/CSS changes (1 use)
- `chore:` - Maintenance tasks

**Important**: Always use descriptive messages explaining "why" not just "what"

### Code Organization Principles

#### 1. Separation of Concerns
- Backend (`/src`) and frontend (`/app`, `/components`) are cleanly separated
- Controllers handle HTTP, data layer handles business logic
- Store pattern for in-memory caching
- Database layer abstracted behind functions

#### 2. Type Safety Everywhere
- Comprehensive TypeScript types in `/src/types`
- Zod validation for ALL API inputs
- Enums for constants (avoid magic strings)
- Type guards for runtime validation

Example:
```typescript
// Bad: Magic strings and any types
function filter(data: any, field: string) { ... }

// Good: Enums and explicit types
function filter(data: AnimeItem[], field: AnimeField): AnimeItem[] { ... }
```

#### 3. Functional Programming Style
- Pure functions in `utils/functional.ts`
- Filter composition with reusable predicates
- Immutable data transformations
- Map/filter/reduce over for loops

Example:
```typescript
// Good: Functional composition
const filterAnime = (anime: AnimeItem[], filters: Filter[]): AnimeItem[] =>
  filters.reduce((acc, filter) => applyFilter(acc, filter), anime);
```

#### 4. Performance First
- Data loaded once on startup, cached in memory
- React Query for client-side caching with stale-while-revalidate
- Pagination to avoid rendering large lists
- Lazy imports for heavy modules (`import()`)
- Logarithmic scoring normalization

#### 5. Error Handling
- Structured error messages in `config.ts`
- Global error handler in Express app
- Try-catch in all async functions
- Pino logger for structured logging
- User-friendly error messages in frontend

### Database Patterns

#### Parameterized Queries (prevent SQL injection)
```typescript
// Good: Parameterized
await db.execute({
  sql: "SELECT * FROM anime_watchlist WHERE user_id = ?",
  args: [userId],
});

// Bad: String interpolation
await db.execute(`SELECT * FROM anime_watchlist WHERE user_id = '${userId}'`);
```

#### Batch Operations for Performance
```typescript
// Good: Single batch operation
await db.batch(malIds.map(id => ({
  sql: "INSERT INTO anime_watchlist (user_id, mal_id, status) VALUES (?, ?, ?)",
  args: [userId, id, status]
})));

// Avoid: Loop with individual queries
for (const id of malIds) {
  await db.execute({ sql: "INSERT ...", args: [userId, id, status] });
}
```

---

## How to Make Changes

### Adding a New Filter Field

**Example**: Add "Duration" field to anime filters

1. **Update config** (`/src/config.ts`)
```typescript
export enum AnimeField {
  // ... existing fields
  Duration = "duration",
}
```

2. **Update data processor** (`/src/dataProcessor.ts`)
```typescript
const getAnimeFieldValue = (anime: AnimeItem, field: AnimeField): any => {
  switch (field) {
    // ... existing cases
    case AnimeField.Duration:
      return anime.duration;
    default:
      return undefined;
  }
};
```

3. **Update type definition** (`/src/types/anime.ts`)
```typescript
export interface AnimeItem {
  // ... existing fields
  duration?: number;
}
```

4. **Update frontend UI** (`/components/FilterBuilder.tsx`)
```typescript
const FIELD_OPTIONS = [
  { value: AnimeField.Score, label: "Score" },
  // ... existing
  { value: AnimeField.Duration, label: "Duration (minutes)" },
];
```

### Adding a New API Endpoint

**Example**: Add `/api/recommendations` endpoint

1. **Create controller** (`/src/controllers/recommendationsController.ts`)
```typescript
import { Request, Response } from "express";

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const recommendations = calculateRecommendations(userId);
    res.json({ data: recommendations });
  } catch (error) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
};
```

2. **Create route** (`/src/routes/recommendationsRoutes.ts`)
```typescript
import { Router } from "express";
import { getRecommendations } from "../controllers/recommendationsController";
import { authMiddleware } from "../middleware/auth";

const router = Router();
router.get("/recommendations", authMiddleware, getRecommendations);
export default router;
```

3. **Register route** (`/src/app.ts`)
```typescript
import recommendationsRoutes from "./routes/recommendationsRoutes";
app.use("/api", recommendationsRoutes);
```

### Database Schema Changes

**Example**: Add "notes" field to watchlist

1. **Write migration** (`/src/db/migrations.ts`)
```typescript
export const migrateWatchlistTables = async () => {
  const db = getDb();
  await db.execute(`
    ALTER TABLE anime_watchlist
    ADD COLUMN notes TEXT
  `);
  console.log("Migration complete: added notes column");
};
```

2. **Update type definition** (`/src/types/watchlist.ts`)
```typescript
export interface WatchedAnime {
  id: string;
  status: WatchStatus;
  notes?: string;
}
```

3. **Update database operations** (`/src/db/watchlist.ts`)
```typescript
export async function upsertAnimeWatchlist(
  malIds: string[],
  status: WatchStatus,
  notes?: string,
  userId: string = "default"
): Promise<void> {
  const db = getDb();
  const stmts = malIds.map((id) => ({
    sql: `INSERT INTO anime_watchlist (user_id, mal_id, status, notes)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, mal_id) DO UPDATE
          SET status = excluded.status, notes = excluded.notes`,
    args: [userId, id, status, notes || null],
  }));
  await db.batch(stmts);
}
```

---

## Technical Decisions

### Why These Technologies?

#### Next.js 15 (App Router)
- **Decision**: Use Next.js instead of vanilla React
- **Reasoning**:
  - Server-side rendering for better SEO
  - App Router for file-based routing
  - Built-in image optimization
  - Vercel deployment optimization
- **Trade-off**: Steeper learning curve vs Create React App
- **Commit**: `5b0bb53 feat: add Next.js web frontend`

#### Express.js Backend (Separate from Next.js)
- **Decision**: Separate Express backend instead of Next.js API routes
- **Reasoning**:
  - Large dataset (~100MB) loaded in memory
  - Complex filtering logic better in dedicated server
  - Easier to deploy backend separately (Docker, Render)
  - More control over server lifecycle (cron jobs)
- **Trade-off**: Additional complexity vs all-in-one Next.js
- **Commit**: `7a0f64d Make an express server`

#### JSON Files for Anime/Manga Data
- **Decision**: Store anime/manga data in JSON files, not database
- **Reasoning**:
  - Read-only data (fetched from MAL API)
  - 100MB+ dataset performs better in-memory
  - Filtering 18k items in ~100ms (vs DB query overhead)
  - No need for ACID properties
  - Simpler deployment (files included in Docker image)
- **Trade-off**: Higher memory usage (~200MB) vs disk/DB
- **Commit**: `047a1d4 Optimise animeSearch`

#### Turso (libSQL) for User Data
- **Decision**: Use Turso instead of PostgreSQL or MongoDB
- **Reasoning**:
  - Edge-optimized (low latency)
  - SQLite compatibility (familiar)
  - Free tier sufficient for personal project
  - Easy schema migrations
  - ACID guarantees for user data
- **Trade-off**: Less mature than Postgres vs lower cost
- **Commit**: `2245b75 feat: replace JSON watchlist with Turso`

#### TanStack Query (React Query)
- **Decision**: Use TanStack Query instead of useState/useEffect
- **Reasoning**:
  - Automatic caching and stale-while-revalidate
  - Eliminates boilerplate (loading states, error handling)
  - Query invalidation for data mutations
  - Optimistic updates
  - DevTools for debugging
- **Trade-off**: Additional dependency vs manual state management
- **Commit**: `38326dd feat: add React Query caching`

#### shadcn/ui Instead of Component Library
- **Decision**: Use shadcn/ui instead of Material-UI or Chakra UI
- **Reasoning**:
  - Copy-paste components (no package bloat)
  - Full customization (TailwindCSS-based)
  - Modern design system
  - TypeScript-first
  - Accessibility built-in (Radix UI primitives)
- **Trade-off**: Manual component management vs pre-packaged
- **Commit**: `3f5ab12 refactor: rewrite all components with shadcn/ui`

### Algorithm Decisions

#### Custom Scoring Algorithm
**Location**: `/src/dataProcessor.ts` - `sortAnimeByPoints()`

**Formula**:
```typescript
const scorePoints = Math.log10(anime.score || 1) * 10;
const memberPoints = Math.log10((anime.members || 1) / 10000);
const favPoints = Math.log10((anime.favorites || 1) / 100);
const totalPoints = scorePoints + memberPoints + favPoints;
```

**Reasoning**:
- **Logarithmic scaling**: Prevents mega-popular anime from dominating
- **Multi-factor**: Balances quality (score), popularity (members), fan love (favorites)
- **Normalization**: Dividers (10000, 100) normalize magnitudes

---

## Common Tasks

### Starting Development

```bash
# Terminal 1: Backend + Frontend (concurrently)
npm run dev

# OR separate terminals
npm run dev:be   # Backend only (port 8080)
npm run dev:fe   # Frontend only (port 3000)
```

### Testing the API

Use `.http` files with REST Client extension:

**`anime-api.http`**:
```http
POST http://localhost:8080/api/search
Content-Type: application/json

{
  "filters": [
    { "field": "score", "value": 8, "action": "GREATER_THAN_OR_EQUALS" }
  ],
  "pagesize": 10
}
```

### Deploying to Production

#### Frontend (Vercel)
1. Push to GitHub
2. Vercel auto-deploys from `main` branch
3. Production URL: https://anime-explorer-mal.vercel.app

#### Backend (Docker)
```bash
docker build -t mal-backend .
docker run -p 8080:8080 --env-file .env mal-backend
```

---

## Debugging & Testing

### Logging

#### Backend Logging (Pino)
```typescript
import { logger } from './utils/logger';

logger.info({ userId, action: 'search' }, 'User performed search');
logger.error({ error: err.message }, 'Failed to fetch data');
```

#### Frontend Logging (React Query DevTools)
- Automatically enabled in development mode
- Shows all queries and their states
- Access: Floating icon in bottom-right corner

---

## Deployment

### Environment Variables (Required)
```env
TURSO_DATABASE_URL    # Turso database connection string
TURSO_AUTH_TOKEN      # Turso authentication token
JWT_SECRET            # Secret for signing JWTs
GOOGLE_CLIENT_ID      # Google OAuth client ID
PORT                  # Server port (default: 8080)
NODE_ENV              # Environment (development/production)
DATA_DIR              # Data file directory (default: .)
```

---

## Quick Reference

### Important Commands
```bash
npm run dev          # Run backend + frontend concurrently
npm run dev:be       # Backend only (port 8080)
npm run dev:fe       # Frontend only (port 3000)
npm run build        # Build Next.js frontend
npm start            # Start production server
```

### Key URLs
- **Frontend (dev)**: http://localhost:3000
- **Backend (dev)**: http://localhost:8080
- **Production**: https://anime-explorer-mal.vercel.app
- **API Base**: `/api`

### Default Configuration
- **Backend Port**: 8080
- **Frontend Port**: 3000 (dev)
- **Database**: Turso (libSQL)
- **Data Refresh**: Daily at 3:00 AM UTC
- **Rate Limit**: 100 requests per minute per IP
- **Pagination**: 20 items per page (default)

### File Paths
- **Anime Data**: `/cleaned_anime_data.json` (~17MB)
- **Manga Data**: `/cleaned_manga_data.json` (~23MB)

### Common Filter Actions
- `EQUALS`, `GREATER_THAN`, `GREATER_THAN_OR_EQUALS`, `LESS_THAN`, `LESS_THAN_OR_EQUALS`
- `INCLUDES_ALL`, `INCLUDES_ANY`, `EXCLUDES`, `CONTAINS`

### Watch Statuses
- `Watching`, `Completed`, `Deferred`, `Avoiding`, `BRR` (Bad Rating Ratio)

---

## Final Notes for Agents

### When You Need to Understand Something
1. Start with this file (AGENTS.md) for high-level context
2. Check `/src/config.ts` for constants and enums
3. Read relevant files in `/src/types` for type definitions
4. Look at `/src/controllers` for API request handling
5. Check `/src/dataProcessor.ts` for core business logic
6. Review git history: `git log --oneline`

### When You Need to Make Changes
1. Understand the "why" behind the current implementation
2. Check if similar changes exist in git history
3. Update types first, then implementation
4. Follow existing patterns (don't introduce new styles)
5. Test with `.http` files before frontend integration

### Remember
- This is a personal project with 67 commits of evolution
- Every decision has a reason (documented in "Technical Decisions")
- Performance matters (in-memory data, caching, pagination)
- Type safety is paramount (TypeScript + Zod everywhere)
- Follow the established patterns (functional, immutable, composable)

**Last Updated**: 2026-02-13
**Coverage**: Complete project context, architecture, patterns, and workflows
