# MAL Explorer

A modern anime discovery platform that helps you find your next favorite show. Search through 15,000+ anime titles with powerful filtering, explore statistics, and track your watchlist with Google sign-in.

**Live Demo**: [anime-explorer-mal.vercel.app](https://anime-explorer-mal.vercel.app)

## What It Does

- **Smart Search**: Filter anime by score, year, genres, themes, and more with an intuitive filter builder
- **Rich Statistics**: Explore trends, distributions, and popular genre combinations across the entire dataset
- **Personal Watchlists**: Track what you're watching, completed, or planning to watch with Google authentication
- **Custom Ranking**: Results sorted by a balanced algorithm that considers both quality and popularity

## Tech Stack

**Frontend**
- Next.js 15 with React 19
- TailwindCSS 4 + shadcn/ui components
- TanStack Query for data caching

**Backend**
- Express.js with TypeScript
- Turso (libSQL) database
- MyAnimeList data via Jikan API

## Quick Start

### Prerequisites
- Node.js 18+
- A Turso account (free tier works great)
- Google OAuth credentials

### Setup

1. Clone and install:
```bash
git clone <repository-url>
cd mal
npm install
```

2. Create a `.env` file:
```env
TURSO_DATABASE_URL=your-database-url
TURSO_AUTH_TOKEN=your-auth-token
JWT_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-client-id
PORT=8080
```

3. Start the development server:
```bash
npm run dev
```

This runs both the backend (port 8080) and frontend (port 3000) concurrently.

4. Open http://localhost:3000 in your browser

## Usage

### Searching for Anime
1. Use the filter builder to add conditions (e.g., "Score >= 8", "Genres include Action")
2. Click quick genre chips for instant filters
3. Toggle between currently airing and finished anime
4. Click "Search" to see results

### Managing Your Watchlist
1. Sign in with Google (top-right corner)
2. Hover over any anime card and click the status button
3. Choose: Watching, Completed, Deferred, Avoiding, or BRR (Bad Rating Ratio)
4. Visit the Watchlist page to view all your anime organized by status

### Viewing Statistics
1. Navigate to the Stats page
2. Toggle "Include only" to focus on specific watchlist categories
3. Explore score distributions, popular genres, and trending combinations

## Project Structure

```
mal/
├── app/              # Next.js pages (search, stats, watchlist)
├── components/       # React UI components
├── lib/              # Frontend utilities
├── src/              # Backend code
│   ├── controllers/  # API request handlers
│   ├── db/          # Database operations
│   ├── routes/      # API routes
│   └── validators/  # Input validation
├── server.ts        # Backend entry point
└── package.json     # Dependencies and scripts
```

## Development

### Available Scripts

```bash
npm run dev        # Run both backend and frontend
npm run dev:be     # Backend only
npm run dev:fe     # Frontend only
npm run build      # Build for production
npm start          # Start production server
```

### Testing the API

Use the provided `.http` files with a REST Client:
- `anime-api.http` - Test anime endpoints
- `manga-api.http` - Test manga endpoints

## Deployment

### Frontend (Vercel)
- Automatically deploys when you push to the main branch
- Set environment variables in Vercel dashboard

### Backend (Docker)
```bash
docker build -t mal-backend .
docker run -p 8080:8080 --env-file .env mal-backend
```

## Features in Detail

### Advanced Filtering
- Numeric comparisons (score, year, members, favorites, episodes)
- Array operations (genres/themes: includes all, includes any, excludes)
- Text search (title, synopsis)
- Multiple filters that work together

### Smart Sorting
Results are ranked using a custom algorithm that:
- Balances quality (MAL score) with popularity (members + favorites)
- Uses logarithmic scaling to give smaller anime a fair chance
- Prevents mega-popular shows from dominating every search

### Performance
- Search through 18,000 items in ~100ms
- Data cached in memory for instant filtering
- Pagination for smooth browsing
- React Query caching for fast navigation

## Contributing

This is a personal project, but feedback and suggestions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Share interesting filter combinations
- Suggest new features

## Roadmap

- Recommendations based on watchlist
- Enhanced scoring algorithm using watch history
- More visualizations and statistics
- Social features (share filters, compare watchlists)

## License

ISC

## Author

Sarthak Agrawal

---

**Note**: This project uses MyAnimeList data via the Jikan API. It is not affiliated with or endorsed by MyAnimeList.net.

**For AI Agents**: See [AGENTS.md](AGENTS.md) for comprehensive development documentation including architecture, patterns, and technical decisions.
