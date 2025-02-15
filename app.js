const express = require('express');
const { fetchAllAnimePages } = require('./api');
const { cleanExistingJsonFile, filterAnimeList } = require('./dataProcessor');
const { getAnimeStats } = require('./statistics');
const { FILTER_ACTIONS } = require('./utils');
const {
    SERVER_CONFIG,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LOG_MESSAGES,
    ANIME_FIELDS
} = require('./config');

const app = express();
const { port, routes } = SERVER_CONFIG;

// Middleware to parse JSON bodies
app.use(express.json());

// GET /api/stats - Get all anime stats
app.get(`${routes.base}${routes.stats}`, async (req, res) => {
    try {
        const stats = await getAnimeStats();
        res.json(stats);
    } catch (error) {
        console.error(ERROR_MESSAGES.fetchError, error);
        res.status(500).json({ error: ERROR_MESSAGES.fetchFailed });
    }
});

// POST /api/stats/filter - Get filtered anime stats
app.post(`${routes.base}${routes.filter}`, async (req, res) => {
    try {
        const filters = req.body.filters;
        if (!Array.isArray(filters)) {
            return res.status(400).json({ error: ERROR_MESSAGES.invalidFilters });
        }

        const filteredList = await filterAnimeList(filters);
        const stats = await getAnimeStats(filteredList);
        res.json({
            totalFiltered: filteredList.length,
            filters,
            stats
        });
    } catch (error) {
        console.error(ERROR_MESSAGES.filterError, error);
        res.status(500).json({ error: ERROR_MESSAGES.filterFailed });
    }
});

// POST /api/fetch - Fetch new anime data
app.post(`${routes.base}${routes.fetch}`, async (req, res) => {
    try {
        res.json({ message: SUCCESS_MESSAGES.fetchStarted });
        
        await fetchAllAnimePages();
        await cleanExistingJsonFile();
    } catch (error) {
        console.error(ERROR_MESSAGES.fetchError, error);
    }
});

// GET /api/filters - Get available filter actions
app.get(`${routes.base}${routes.filters}`, (req, res) => {
    res.json({
        availableActions: FILTER_ACTIONS,
        filterableFields: Object.values(ANIME_FIELDS),
        examples: [
            {
                description: 'Recent high-rated action anime',
                filters: [
                    { field: ANIME_FIELDS.year, value: 2020, action: FILTER_ACTIONS.GREATER_THAN_OR_EQUALS },
                    { field: ANIME_FIELDS.score, value: 7, action: FILTER_ACTIONS.GREATER_THAN_OR_EQUALS },
                    { field: ANIME_FIELDS.genres, value: ['Action'], action: FILTER_ACTIONS.INCLUDES_ALL }
                ]
            }
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: ERROR_MESSAGES.serverError });
});

// Start the server
app.listen(port, () => {
    console.log(LOG_MESSAGES.serverStart + port);
    console.log(LOG_MESSAGES.availableEndpoints);
    Object.values(LOG_MESSAGES.endpoints).forEach(endpoint => console.log(endpoint));
});
