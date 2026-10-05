// Headless browser tests: tests/smoke (existing behaviour) and tests/tasks
// (pending task acceptance tests). The game is opened over file://; no server.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: { ...devices['Pixel 7'], headless: true },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
