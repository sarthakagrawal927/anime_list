# Anime Statistics API

A TypeScript-based REST API for analyzing anime data from MyAnimeList. The API provides statistical insights about anime, including score distributions, popularity metrics, and genre analysis.

## Features

- **Data Collection**: Fetches anime data from MyAnimeList API
- **Statistical Analysis**:
  - Score and popularity distributions
  - Member and favorite counts
  - Genre, theme, and demographic analysis
  - Year and type distributions
  - Popular genre combinations
- **Filtering System**: Advanced filtering capabilities with:
  - Numeric comparisons (>, >=, <, <=, =)
  - Array operations (includes, excludes)
  - String matching

## Project Structure

```
src/
├── controllers/     # Route handlers
├── types/          # TypeScript interfaces and types
├── validators/     # Input validation logic
├── routes/         # API route definitions
├── api.ts          # External API integration
├── config.ts       # Configuration and constants
├── statistics.ts   # Statistical calculations
└── app.ts          # Main application entry
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm run start
   ```

## API Endpoints

- `GET /api/stats`: Get all anime statistics
- `POST /api/stats/filter`: Get filtered anime statistics
- `POST /api/fetch`: Fetch new anime data
- `GET /api/filters`: Get available filter options

## Example Filter

```json
{
  "filters": [
    {
      "field": "year",
      "value": 2020,
      "action": "GREATER_THAN_OR_EQUALS"
    },
    {
      "field": "score",
      "value": 7,
      "action": "GREATER_THAN_OR_EQUALS"
    },
    {
      "field": "genres",
      "value": ["Action"],
      "action": "INCLUDES_ALL"
    }
  ]
}
```

## Scripts

- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build TypeScript to JavaScript
- `npm run start`: Run the built application
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run clean`: Clean build directory

## Technologies

- TypeScript
- Express.js
- Node.js
- MyAnimeList API


## Future Improvements

- While calculating score, also consider user's past watching history with given filters
- Make a web version to better visualize the statistics
- Improve formulae to allow representation of smaller anime
- Filter/Sort based on user's list (including its status)
- Optimise new fetch logic
- Use an actual DB, once multi user support is added