import { defineConfig, devices } from '@playwright/test';

const frontendPort = 4173;
const backendPort = 8001;
const frontendBaseUrl = `http://127.0.0.1:${frontendPort}`;
const backendBaseUrl = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: frontendBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node ./scripts/start-playwright-backend.mjs',
      url: `${backendBaseUrl}/health`,
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: 'node ./scripts/start-playwright-frontend.mjs',
      url: frontendBaseUrl,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
