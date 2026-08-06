import { execSync } from 'node:child_process';

/**
 * `astro preview` self-detaches immediately (confirmed empirically — it
 * returns control to the shell while a separate daemon process keeps
 * serving), so Playwright's built-in `webServer` process-tracking can't
 * reliably kill it afterward on every platform. Managing the build +
 * preview-server lifecycle explicitly here and in global-teardown.ts
 * instead of relying on that automatic teardown.
 */
export default function globalSetup(): void {
  // Defensive: clear out any stale daemon from a previous crashed/interrupted
  // run before starting a fresh one on the same port.
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // Nothing was running — expected on a clean run.
  }

  execSync('npm run build', { stdio: 'inherit' });
  // Returns once the server reports ready (astro preview's own behavior).
  execSync('npx astro preview', { stdio: 'inherit' });
}
