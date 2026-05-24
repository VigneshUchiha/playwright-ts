import { defineConfig } from '@playwright/test';
import { ENV, ACTIVE_ENV } from '@config/env.config';

process.stdout.write(`[playwright-ts] Running with environment: ${ACTIVE_ENV}\n`);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/node_modules/**', '**/dist/**'],
  fullyParallel: true,
  forbidOnly: ENV.CI,
  retries: ENV.CI ? 2 : 0,
  workers: ENV.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  globalSetup: require.resolve('./src/utils/allureSetup.ts'),

  reporter: [
    ['list'],
    ['allure-playwright', { detail: false, suiteTitle: true }],
  ],

  use: {
    actionTimeout: ENV.ACTION_TIMEOUT,
    navigationTimeout: ENV.NAVIGATION_TIMEOUT,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'unit',
      testMatch: 'tests/unit/**/*.spec.ts',
      use: {},
    },
  ],

  outputDir: 'test-results',
});
