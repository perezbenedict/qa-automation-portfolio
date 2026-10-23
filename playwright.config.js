// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Keep CI parallelism bounded while allowing all browser projects to run. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'https://playwright.dev',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
  },

  /*
   * Each test file belongs to exactly one target, so nothing runs twice:
   * tests/api is the DummyJSON suite, tests/example.spec.js and
   * tests/quality/docs-quality.spec.js are the playwright.dev docs smoke,
   * and everything else is SauceDemo UI work.
   */
  projects: [
    /* DummyJSON suite, run once with no browser (request fixture only). */
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.js',
    },

    /* playwright.dev documentation smoke, run once on desktop Chromium. */
    {
      name: 'docs',
      testMatch: ['**/example.spec.js', '**/quality/docs-quality.spec.js'],
      use: { ...devices['Desktop Chrome'] },
    },

    /* Complete SauceDemo UI suite: tests/ui plus the quality checks. */
    {
      name: 'chromium',
      testIgnore: ['**/api/**', '**/example.spec.js', '**/quality/docs-quality.spec.js'],
      use: { ...devices['Desktop Chrome'] },
    },

    /* Core workflows in the other desktop engines. */
    {
      name: 'firefox',
      testMatch: ['**/ui/**/*.spec.js', '**/quality/storefront-quality.spec.js'],
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testMatch: ['**/ui/**/*.spec.js', '**/quality/storefront-quality.spec.js'],
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile-critical subset: responsive, storefront, and the main journeys. */
    {
      name: 'Mobile Chrome',
      testMatch: [
        '**/quality/responsive.spec.js',
        '**/quality/storefront-quality.spec.js',
        '**/ui/authentication.spec.js',
        '**/ui/cart.spec.js',
        '**/ui/checkout.spec.js',
      ],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testMatch: [
        '**/quality/responsive.spec.js',
        '**/quality/storefront-quality.spec.js',
        '**/ui/authentication.spec.js',
        '**/ui/cart.spec.js',
        '**/ui/checkout.spec.js',
      ],
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
