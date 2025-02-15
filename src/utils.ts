import { promises as fs } from 'fs';

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const readJsonFile = async (filename: string): Promise<any | null> => {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return null;
    }
};

export const writeJsonFile = async (filename: string, data: any): Promise<boolean> => {
    try {
        await fs.writeFile(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

export const FILTER_ACTIONS = {
    GREATER_THAN: 'GREATER_THAN',
    GREATER_THAN_OR_EQUALS: 'GREATER_THAN_OR_EQUALS',
    LESS_THAN: 'LESS_THAN',
    LESS_THAN_OR_EQUALS: 'LESS_THAN_OR_EQUALS',
    EQUALS: 'EQUALS',
    INCLUDES_ALL: 'INCLUDES_ALL',
    INCLUDES_ANY: 'INCLUDES_ANY',
    EXCLUDES: 'EXCLUDES'
} as const;

export type FilterAction = typeof FILTER_ACTIONS[keyof typeof FILTER_ACTIONS];
