const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:backend',
      port: 3030,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'npm run start:frontend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
