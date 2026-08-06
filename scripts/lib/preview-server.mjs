import { execSync, spawn } from 'node:child_process';

const PREVIEW_URL = 'http://localhost:4321';
const READY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 300;

function isWindows() {
  return process.platform === 'win32';
}

async function waitForReady(url, timeoutMs) {
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
 * `astro preview` self-detaches immediately rather than staying in the
 * foreground (confirmed empirically, and confirmed hanging real CI when
 * relied upon via execSync — see tests/e2e/global-setup.ts for the full
 * history). Spawning it ourselves as an explicit detached background
 * process and polling for HTTP readiness avoids depending on that CLI
 * behavior — works the same way regardless of platform.
 */
export async function startPreviewServer({ build = true } = {}) {
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // Nothing was running — expected on a clean run.
  }

  if (build) {
    execSync('npm run build', { stdio: 'inherit' });
  }

  const child = isWindows()
    ? spawn('npx astro preview', { shell: true, stdio: 'ignore' })
    : spawn('npx', ['astro', 'preview'], { detached: true, stdio: 'ignore' });
  child.unref();

  await waitForReady(PREVIEW_URL, READY_TIMEOUT_MS);
  return PREVIEW_URL;
}

export function stopPreviewServer() {
  try {
    execSync('npx astro preview stop', { stdio: 'inherit' });
  } catch {
    // Already stopped, or never started — nothing more to clean up.
  }
}
