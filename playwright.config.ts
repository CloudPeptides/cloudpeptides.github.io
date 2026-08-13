import { defineConfig, devices } from '@playwright/test';
import { RESEARCHER_STORAGE_STATE } from './tests/e2e/global-setup';

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
    // Mandatory researcher-account gate (2026-08-13): every page except
    // a small public allow-list now requires a signed-in session
    // (src/middleware.ts) — global-setup.ts signs in a dedicated,
    // already-certified test account via the real /api/account/login
    // route and saves its cookies here so every spec starts already
    // past the gate, matching how a real researcher actually reaches
    // this content. Specs that test the gate/login/registration flow
    // itself override this per-file with `test.use({ storageState: {
    // cookies: [], origins: [] } })`.
    storageState: RESEARCHER_STORAGE_STATE,
  },
  // Chromium only for Phase 1A — see docs/implementation-log.md for the
  // documented cross-browser expansion path (add firefox/webkit projects
  // + their CI install/cache entries once a real need justifies the
  // added CI time).
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
