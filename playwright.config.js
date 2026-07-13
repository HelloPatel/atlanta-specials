import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

/**
 * Playwright end-to-end configuration.
 *
 * These tests exercise the app's public, no-authentication surface (landing,
 * auth screens, routing, and protected-route redirects) against a real Vite
 * dev server. They are intentionally network-independent: the app boots without
 * Firebase credentials, so nothing here depends on live Firestore data.
 */
const PORT = Number(process.env.E2E_PORT || 5173);
const BASE_URL = `http://localhost:${PORT}`;
const hasAuthenticatedE2E = Boolean(
  process.env.E2E_EMAIL
  || existsSync(new URL('./.env.e2e.local', import.meta.url)),
);

const publicProjects = [
  {
    name: 'chromium',
    testIgnore: /app-.*\.spec\.js/,
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'mobile',
    testIgnore: /app-.*\.spec\.js/,
    use: { ...devices['Pixel 7'] },
  },
];

const authenticatedProjects = hasAuthenticatedE2E
  ? [
      {
        name: 'app-chromium',
        testMatch: /app-.*\.spec\.js/,
        use: {
          ...devices['Desktop Chrome'],
          storageState: '.playwright/auth.json',
        },
      },
      {
        name: 'app-mobile',
        testMatch: /app-.*\.spec\.js/,
        use: {
          ...devices['Pixel 7'],
          storageState: '.playwright/auth.json',
        },
      },
    ]
  : [];

const viteServer = {
  command: `"${process.execPath}" node_modules/vite/bin/vite.js --port ${PORT} --strictPort${hasAuthenticatedE2E ? ' --mode e2e' : ''}`,
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
};

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js/,
  globalSetup: hasAuthenticatedE2E ? './e2e/global-setup.js' : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [...publicProjects, ...authenticatedProjects],

  webServer: viteServer,
});
