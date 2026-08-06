import { execSync, spawn } from 'node:child_process';

const PREVIEW_URL = 'http://localhost:4321';
const READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;

function isWindows(): boolean {
  return process.platform === 'win32';
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Not up yet — keep polling.
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`Preview server did not become ready at ${url} within ${timeoutMs}ms`);
}

/**
 * `astro preview` was observed to self-detach immediately on Windows (the
 * CLI process returns control to the shell while a separate daemon keeps
 * serving) — but that behavior is not guaranteed cross-platform, and
 * `execSync('npx astro preview')` blocking indefinitely on a runner where
 * it does *not* self-detach was confirmed hanging real CI (Linux runners).
 * Spawning it ourselves as an explicit detached background process and
 * polling the URL for readiness avoids depending on that CLI behavior
 * entirely — this works the same way regardless of platform.
 */
export default async function globalSetup(): Promise<void> {
  // Defensive: clear out any stale daemon from a previous crashed/interrupted
  // run before starting a fresh one on the same port.
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // Nothing was running — expected on a clean run.
  }

  execSync('npm run build', { stdio: 'inherit' });

  const child = isWindows()
    ? spawn('npx astro preview', { shell: true, stdio: 'ignore' })
    : spawn('npx', ['astro', 'preview'], { detached: true, stdio: 'ignore' });
  child.unref();

  await waitForReady(PREVIEW_URL, READY_TIMEOUT_MS);
}
