#!/usr/bin/env node
/**
 * Custom-format `pg_dump` of the Supabase project that becomes
 * production (`riuxojncmnhogclrhoys` — production-cutover-plan.md §1:
 * no separate production project, this existing one transitions
 * directly), independent of Supabase's own backup system
 * (production-cutover-plan.md §12: "a backup that depends on the same
 * provider you're protecting against isn't a complete backup story").
 *
 * **Updated 2026-08-08 — this is now the ONLY backup this project
 * will have**, not a supplement to a Pro-tier automatic one: the
 * Free tier includes no automatic/point-in-time backups at all. Can
 * and should be run now, ahead of cutover, as many times as useful;
 * production-cutover-plan.md §12 and production-cutover-checklist.md
 * both require one verified, restorable run of this immediately
 * before DNS cuts over — not optional.
 *
 * **Updated again 2026-08-08 — uses the native PostgreSQL 17 client
 * tools (scripts/lib/pg-tools.mjs), not Docker or `supabase start`.**
 * Explicit decision: Docker Desktop's engine is unreachable from this
 * repo's automated tooling sessions (a session-isolation issue, not a
 * missing install), and exposing its daemon over an unauthenticated
 * TCP port to work around that was explicitly declined. Native
 * pg_dump/pg_restore/psql/createdb/dropdb avoid the dependency
 * entirely — see scripts/migration/restore-verify-backup.mjs for the
 * matching restore-and-verify half of this workflow.
 *
 * Custom format (`-Fc`), not plain SQL — required for
 * pg_restore-based restoration (restore-verify-backup.mjs) and
 * supports selective/parallel restore if ever needed.
 *
 * Run manually, locally, never in CI:
 *   PROD_DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres" \
 *     node scripts/migration/backup-production.mjs
 *
 * PROD_DATABASE_URL is that project's direct Postgres connection
 * string (Supabase dashboard → Project Settings → Database →
 * Connection string) — a genuine database credential, never printed,
 * logged, or committed by this script; store the resulting .dump file
 * itself somewhere encrypted, outside this repo (backups/ is
 * gitignored specifically so an accidental `git add` doesn't commit
 * it, but gitignored is not the same as "safe to leave lying around"
 * — move it to real encrypted storage after this runs).
 *
 * Verify, don't just trust, that a dump actually restores — run
 * scripts/migration/restore-verify-backup.mjs against the file this
 * script just produced before treating the backup gate as satisfied.
 *
 * Restore procedure (only if actually needed — never fix forward
 * against production with the service-role key under time pressure):
 *   pg_restore --no-owner --no-privileges -d "$PROD_DATABASE_URL" \
 *     backups/production-<timestamp>.dump
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvePgTool } from '../lib/pg-tools.mjs';

const DATABASE_URL = process.env.PROD_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing PROD_DATABASE_URL.');
  process.exit(1);
}

const pgDump = resolvePgTool('pg_dump');
try {
  execFileSync(pgDump, ['--version'], { stdio: 'ignore' });
} catch {
  console.error(
    `pg_dump was not found (looked for it at "${pgDump}"). Install the PostgreSQL client tools and ensure pg_dump is on PATH (or installed at the standard Windows location), then re-run.`,
  );
  process.exit(1);
}

const backupsDir = new URL('../../backups/', import.meta.url);
if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = new URL(`production-${timestamp}.dump`, backupsDir);
const outputPath = fileURLToPath(outputFile);

console.log(`Dumping production database to ${outputPath}...`);
// execFileSync's argv-array form never puts DATABASE_URL on a shell
// command line — passed as a single argv entry, not interpolated into
// a shell string, so it can't leak via process-list inspection the
// way a shell-interpolated `pg_dump $DATABASE_URL` invocation could.
execFileSync(
  pgDump,
  ['--no-owner', '--no-privileges', '--format=custom', DATABASE_URL, '-f', outputPath],
  { stdio: 'inherit' },
);

const { size } = statSync(outputPath);
const checksum = createHash('sha256').update(readFileSync(outputPath)).digest('hex');

console.log(`\nDone: ${outputPath}`);
console.log(`Size: ${size.toLocaleString()} bytes`);
console.log(`SHA-256: ${checksum}`);
console.log(
  'Move this file to encrypted storage outside this repo — gitignored is not the same as safely stored.',
);
