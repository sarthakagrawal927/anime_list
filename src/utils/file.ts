import fs from 'fs/promises';

export const readJsonFile = async (path: string): Promise<unknown> => {
  try {
    const data = await fs.readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    throw error;
  }
};

export const writeJsonFile = async (path: string, data: unknown): Promise<void> => {
  try {
    await fs.writeFile(path, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${path}:`, error);
    throw error;
  }
};

export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
