import { definePlaywrightConfig } from '@saas-maker/test-config/playwright';

export default definePlaywrightConfig({
  testDir: './e2e',
  baseURL: process.env.E2E_BASE_URL || 'https://anime-explorer-mal.vercel.app',
  viewportMatrix: false,
});
