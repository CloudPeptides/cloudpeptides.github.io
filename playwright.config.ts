import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Chromium only for Phase 1A — see docs/implementation-log.md for the
  // documented cross-browser expansion path (add firefox/webkit projects
  // + their CI install/cache entries once a real need justifies the
  // added CI time).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
