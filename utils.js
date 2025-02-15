const fs = require('fs').promises;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const readJsonFile = async (filename) => {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

const writeJsonFile = async (filename, data) => {
    try {
        await fs.writeFile(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

const FILTER_ACTIONS = {
    GREATER_THAN: 'GREATER_THAN',
    GREATER_THAN_OR_EQUALS: 'GREATER_THAN_OR_EQUALS',
    LESS_THAN: 'LESS_THAN',
    LESS_THAN_OR_EQUALS: 'LESS_THAN_OR_EQUALS',
    EQUALS: 'EQUALS',
    INCLUDES_ALL: 'INCLUDES_ALL',
    INCLUDES_ANY: 'INCLUDES_ANY',
    EXCLUDES: 'EXCLUDES'
};

module.exports = {
    delay,
    readJsonFile,
    writeJsonFile,
    FILTER_ACTIONS
};
