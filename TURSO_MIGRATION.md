# Turso Database Migration Guide

## Overview

Anime data storage has been migrated from JSON files to Turso (SQLite) database for:
- **Persistence** on Render's free tier (JSON files are ephemeral)
- **Better performance** with indexed queries
- **Automatic cron updates** without file system issues

## Migration Steps

### 1. Run Database Migrations

```bash
npm run db:seed
```

This will:
- Create the `anime_data` table in Turso
- Import existing JSON data into the database
- Create indexes for fast queries

### 2. Test Locally

```bash
# Start the backend
npm run dev:be

# The server will load anime data from Turso
```

### 3. Deploy to Render

The changes are already configured in `render.yaml`:

```yaml
services:
  - type: web
    name: mal-api
    # ... web service config

  - type: cron
    name: mal-anime-updater
    schedule: "0 0 * * *"  # Daily at midnight UTC
    dockerCommand: npm run db:update
```

**Important**: Make sure your Render environment has these variables:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

### 4. Manual Update (if needed)

```bash
# Update anime data manually (fetches latest 2 seasons)
npm run db:update
```

## What Changed

### Before (JSON-based)
```
anime_data.json → cleaned_anime_data.json → In-memory cache
```

### After (Turso-based)
```
MAL API → Turso database → In-memory cache (5min TTL)
```

### Key Files Modified

1. **`src/db/animeData.ts`** - New database operations
2. **`src/db/migrations.ts`** - Database schema
3. **`src/store/animeStore.ts`** - Now loads from Turso with auto-refresh
4. **`src/api.ts`** - Writes directly to Turso
5. **`src/services/dataLoader.ts`** - Simplified to load from DB
6. **`src/scripts/updateAnimeData.ts`** - Cron job script

### Cron Job

Runs **daily at midnight UTC** on Render to fetch the latest two anime seasons and update the database.

## Troubleshooting

### "No anime data in database"
Run: `npm run db:seed`

### Stale data in API responses
The in-memory cache auto-refreshes every 5 minutes, or you can restart the server.

### Cron job not running
Check Render dashboard → "mal-anime-updater" service logs
