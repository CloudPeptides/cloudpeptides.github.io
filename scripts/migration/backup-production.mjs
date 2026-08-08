#!/usr/bin/env node
/**
 * PREPARED, NOT RUN. Plain SQL dump of the production Supabase
 * database, independent of Supabase's own backup system
 * (production-cutover-plan.md §12: "a backup that depends on the same
 * provider you're protecting against isn't a complete backup story").
 * Cannot be executed yet — no production Supabase project exists.
 *
 * Intended use: once immediately after the data migration
 * (export-published-for-production.mjs) completes, and again
 * immediately before DNS cuts over — a clean, known-good restore point
 * bracketing the actual switch (production-cutover-plan.md §12).
 *
 * Requires the `pg_dump` client (PostgreSQL client tools) on the
 * machine running this — not bundled with this repo's own
 * dependencies, since it's a system tool, not an npm package.
 *
 * Run manually, locally, never in CI:
 *   PROD_DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres" \
 *     node scripts/migration/backup-production.mjs
 *
 * PROD_DATABASE_URL is the production project's direct Postgres
 * connection string (Supabase dashboard → Project Settings →
 * Database → Connection string) — a genuine database credential,
 * never printed, logged, or committed by this script; store the
 * resulting .sql file itself somewhere encrypted, outside this repo
 * (backups/ is gitignored specifically so an accidental `git add`
 * doesn't commit it, but gitignored is not the same as "safe to leave
 * lying around" — move it to real encrypted storage after this runs).
 *
 * Restore procedure (only if actually needed — never fix forward
 * against production with the service-role key under time pressure):
 *   psql "$PROD_DATABASE_URL" < backups/production-<timestamp>.sql
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const DATABASE_URL = process.env.PROD_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing PROD_DATABASE_URL.');
  process.exit(1);
}

try {
  execFileSync('pg_dump', ['--version'], { stdio: 'ignore' });
} catch {
  console.error(
    'pg_dump was not found on this machine. Install the PostgreSQL client tools (e.g. `brew install libpq` / `apt install postgresql-client`) and ensure pg_dump is on PATH, then re-run.',
  );
  process.exit(1);
}

const backupsDir = new URL('../../backups/', import.meta.url);
if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = new URL(`production-${timestamp}.sql`, backupsDir);

console.log(`Dumping production database to ${outputFile.pathname}...`);
// execFileSync's `input`/argv-array form never puts DATABASE_URL on a
// shell command line — passed as a single argv entry, not interpolated
// into a shell string, so it can't leak via process-list inspection
// the way a shell-interpolated `pg_dump $DATABASE_URL` invocation could.
execFileSync(
  'pg_dump',
  ['--no-owner', '--no-privileges', '--format=plain', DATABASE_URL, '-f', outputFile.pathname],
  {
    stdio: 'inherit',
  },
);

console.log(`\nDone: ${outputFile.pathname}`);
console.log(
  'Move this file to encrypted storage outside this repo — gitignored is not the same as safely stored.',
);
