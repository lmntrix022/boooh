import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright simplifiée pour tests manuels
 * 
 * Usage:
 * 1. Terminal 1: npm run dev
 * 2. Terminal 2: npx playwright test --config=playwright.config.simple.ts
 */
export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Pas de webServer - doit être démarré manuellement
  // webServer: undefined,
});

