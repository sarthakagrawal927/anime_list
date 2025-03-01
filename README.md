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
- Integrate with [web](https://lovable.dev/projects/5bb8d65f-b1ff-4281-900e-55330c69b13a)

## Some random Idea I had 3yrs back
Algorithm that provides movies that are most similar to what you have inputted, considers genres and tags as shared my IMDb.
We can make a extensive list of common tags for all movies then take an array of binary for tags. For example we decide to go with 50 tags , and movie A has only first 3 tags attached to it.
Then string for it would be
1110000......

Similarly we can do it for genres (maybe instead of 1 we can keep it in order of dominance)
I think this should let me implement a real fast algorithm for this app. XOR op.

Keep all the titles in a sorted (simple string sort might do ? ) array, when fetching new titles add them according to thier rank. This will give the results blazingly fast.

An app that takes movie name and gets its information and computes whether I should watch or not.

Subpart: an app that shows shared films between 2 actors.

