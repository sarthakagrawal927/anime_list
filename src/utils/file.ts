import { promises as fs } from 'fs';

/**
 * Delay execution for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Read and parse a JSON file
 */
export const readJsonFile = async <T>(filename: string): Promise<T | null> => {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

/**
 * Write data to a JSON file
 */
export const writeJsonFile = async <T>(filename: string, data: T): Promise<boolean> => {
    try {
        await fs.writeFile(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};
