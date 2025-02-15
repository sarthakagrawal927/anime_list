const { readJsonFile } = require('./utils');
const { 
    FILE_PATHS, 
    ANIME_FIELDS,
    DISTRIBUTION_RANGES,
    PERCENTILE_FIELDS
} = require('./config');

const getDistribution = (data, ranges, field) => {
    const distribution = ranges.map(range => ({ range, count: 0 }));
    data.forEach(item => {
        const value = item[field];
        const rangeIndex = ranges.findIndex((range, index) => 
            value >= range && (index === ranges.length - 1 || value < ranges[index + 1])
        );
        if (rangeIndex !== -1) {
            distribution[rangeIndex].count++;
        }
    });
    return distribution;
};

const getFieldCounts = (data, field) => {
    return Object.entries(data.reduce((acc, item) => {
        const values = Object.keys(item[field] || {});
        values.forEach(value => {
            acc[value] = (acc[value] || 0) + 1;
        });
        return acc;
    }, {}))
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
};

const getPercentiles = (data, field) => {
    const validValues = data
        .map(item => item[field])
        .filter(value => value !== undefined && value !== null)
        .sort((a, b) => b - a);

    const total = validValues.length;
    return {
        p999: validValues[Math.floor(total * 0.001)],
        p99: validValues[Math.floor(total * 0.01)],
        p95: validValues[Math.floor(total * 0.05)],
        p90: validValues[Math.floor(total * 0.1)],
        median: validValues[Math.floor(total * 0.5)],
        mean: validValues.reduce((sum, val) => sum + val, 0) / total
    };
};

const getAnimeStats = async (animeList = null) => {
    const data = animeList || await readJsonFile(FILE_PATHS.cleanedData);

    return {
        totalAnime: data.length,

        scoreDistribution: getDistribution(
            data,
            DISTRIBUTION_RANGES.score,
            ANIME_FIELDS.score
        ),

        membersDistribution: getDistribution(
            data,
            DISTRIBUTION_RANGES.members,
            ANIME_FIELDS.members
        ),

        favoritesDistribution: getDistribution(
            data,
            DISTRIBUTION_RANGES.favorites,
            ANIME_FIELDS.favorites
        ),

        percentiles: Object.entries(PERCENTILE_FIELDS).reduce((acc, [key, field]) => {
            acc[key] = getPercentiles(data, field);
            return acc;
        }, {}),

        genreCounts: getFieldCounts(data, ANIME_FIELDS.genres),
        themeCounts: getFieldCounts(data, ANIME_FIELDS.themes),
        demographicCounts: getFieldCounts(data, ANIME_FIELDS.demographics),

        yearDistribution: Object.entries(data.reduce((acc, item) => {
            if (item.year) {
                acc[item.year] = (acc[item.year] || 0) + 1;
            }
            return acc;
        }, {}))
        .sort((a, b) => a[0] - b[0])
        .map(([year, count]) => ({ year: parseInt(year), count })),

        typeDistribution: Object.entries(data.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {}))
        .map(([type, count]) => ({ type, count })),

        popularGenreCombinations: Object.entries(data.reduce((acc, item) => {
            const genres = Object.keys(item.genres || {}).sort();
            if (genres.length >= 2) {
                for (let i = 0; i < genres.length - 1; i++) {
                    for (let j = i + 1; j < genres.length; j++) {
                        const pair = `${genres[i]} + ${genres[j]}`;
                        acc[pair] = (acc[pair] || 0) + 1;
                    }
                }
            }
            return acc;
        }, {}))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([pair, count]) => ({ pair, count }))
    };
};

const printStats = (stats) => {
    console.log(stats)
};

module.exports = {
    getAnimeStats,
    printStats
};
