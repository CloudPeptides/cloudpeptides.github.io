import { execSync } from 'node:child_process';

export default function globalTeardown(): void {
  try {
    execSync('npx astro preview stop', { stdio: 'inherit' });
  } catch {
    // Already stopped, or never started — nothing more to clean up.
  }
}
