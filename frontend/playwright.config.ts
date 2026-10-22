import { defineConfig, devices } from '@playwright/test';

const API_PORT = 3100;
const WEB_PORT = 4300;

/**
 * End-to-end tests against the real backend (in-memory database) and the
 * Angular dev server. Run with `npm run e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-results',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'npm --prefix ../backend run start:e2e',
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
      env: {
        PORT: String(API_PORT),
        CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
        TEST_CONTROL: 'true',
        DATABASE_URL: '',
      },
    },
    {
      command: `npx ng serve --configuration e2e --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
