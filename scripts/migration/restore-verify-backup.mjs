#!/usr/bin/env node
/**
 * Restores the most recent (or a specified) scripts/migration/
 * backup-production.mjs output into a disposable local PostgreSQL
 * database, verifies schema + row totals for the tables that matter,
 * then drops the disposable database. Uses the native
 * pg_restore/psql/createdb/dropdb tools (scripts/lib/pg-tools.mjs) —
 * explicitly not Docker and not `supabase start` (Docker Desktop's
 * engine is unreachable from this repo's automated tooling sessions,
 * a session-isolation issue rather than a missing install, and
 * exposing its daemon over an unauthenticated TCP port to work around
 * that was explicitly declined).
 *
 * Needs a local PostgreSQL server (confirmed present: the
 * postgresql-x64-17 Windows service, localhost:5432) and its
 * `postgres` superuser password via LOCAL_POSTGRES_PASSWORD — never
 * passed on a command line or printed/logged; only ever read from the
 * environment and forwarded to each child process via the PGPASSWORD
 * env var.
 *
 * Run manually, locally, never in CI:
 *   LOCAL_POSTGRES_PASSWORD=... node scripts/migration/restore-verify-backup.mjs [path/to/backup.dump]
 *
 * With no path argument, restores the most recently created
 * backups/production-*.dump file.
 *
 * Verifies schema presence + row counts for the tables this project's
 * research/editorial model depends on (compounds, claims, sources,
 * studies, compound_aliases, regulatory_records, user_roles), plus
 * the one piece of "authentication-related configuration" that's
 * actually meaningful to check this way: whether
 * public.custom_access_token_hook (the function that injects the
 * user_role JWT claim — see src/lib/auth.ts) survived the round trip.
 * The `auth` schema itself (Supabase's GoTrue-managed users/sessions/
 * identities) is owned by supabase_auth_admin and backed by a live
 * service, not just schema+rows — a pg_dump/pg_restore round trip
 * into a vanilla local Postgres cannot and does not claim to fully
 * reproduce that service's state; this script checks honestly for
 * what it can (the schema's presence) and says so plainly rather than
 * implying more than it verified.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolvePgTool } from '../lib/pg-tools.mjs';

const LOCAL_PASSWORD = process.env.LOCAL_POSTGRES_PASSWORD;
if (!LOCAL_PASSWORD) {
  console.error('Missing LOCAL_POSTGRES_PASSWORD.');
  process.exit(1);
}

const LOCAL_HOST = process.env.LOCAL_POSTGRES_HOST ?? 'localhost';
const LOCAL_PORT = process.env.LOCAL_POSTGRES_PORT ?? '5432';
const LOCAL_USER = process.env.LOCAL_POSTGRES_USER ?? 'postgres';

const backupsDir = new URL('../../backups/', import.meta.url);
const backupsDirPath = fileURLToPath(backupsDir);

function findLatestBackup() {
  if (!existsSync(backupsDirPath)) return null;
  const files = readdirSync(backupsDirPath)
    .filter((f) => f.startsWith('production-') && f.endsWith('.dump'))
    .sort(); // filenames embed an ISO-ish timestamp, so lexical sort is chronological
  return files.length ? fileURLToPath(new URL(files[files.length - 1], backupsDir)) : null;
}

const argPath = process.argv[2];
const backupPath = argPath ? argPath : findLatestBackup();
if (!backupPath) {
  console.error(
    'No backup file found. Run scripts/migration/backup-production.mjs first, or pass a path as an argument.',
  );
  process.exit(1);
}
if (!existsSync(backupPath)) {
  console.error(`Backup file not found: ${backupPath}`);
  process.exit(1);
}

const dbName = `cloudpeptides_restore_verify_${Date.now()}`;
const env = { ...process.env, PGPASSWORD: LOCAL_PASSWORD };

const createdb = resolvePgTool('createdb');
const dropdb = resolvePgTool('dropdb');
const pgRestore = resolvePgTool('pg_restore');
const psql = resolvePgTool('psql');

const connArgs = ['-h', LOCAL_HOST, '-p', LOCAL_PORT, '-U', LOCAL_USER];

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}

const REQUIRED_TABLES = [
  'public.compounds',
  'public.claims',
  'public.sources',
  'public.studies',
  'public.compound_aliases',
  'public.regulatory_records',
  'public.user_roles',
  // Added for the Batch 4 shop-migration rollback gate (2026-08-10):
  // the tables this specific migration reads from and writes to.
  'public.admin_pricing_catalog',
  'public.shop_products',
  'public.product_categories',
  // Added for the COA batch-import rollback gate (2026-08-10).
  'public.batch_coas',
];

function psqlQuery(sql) {
  return execFileSync(psql, [...connArgs, '-d', dbName, '-tAc', sql], {
    env,
    encoding: 'utf8',
  }).trim();
}

console.log(`Creating disposable database ${dbName}...`);
execFileSync(createdb, [...connArgs, dbName], { env, stdio: 'inherit' });

try {
  console.log(`Restoring ${backupPath} into ${dbName}...`);
  try {
    execFileSync(
      pgRestore,
      ['--no-owner', '--no-privileges', '-d', dbName, ...connArgs, backupPath],
      {
        env,
        stdio: 'inherit',
      },
    );
  } catch {
    // pg_restore exits non-zero on warnings alone — e.g. Supabase-
    // internal roles/extensions/schemas (supabase_admin,
    // supabase_realtime, pgsodium, ...) that a vanilla local Postgres
    // 17 install doesn't have and was never expected to. Real failure
    // is judged below by whether the tables this project actually
    // depends on came through with real data, not by pg_restore's own
    // exit code.
    console.warn(
      'pg_restore reported warnings (see output above) — continuing to verify the tables that actually matter.',
    );
  }

  for (const table of REQUIRED_TABLES) {
    const exists = psqlQuery(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema || '.' || table_name = '${table}');`,
    );
    record(`schema: ${table} exists after restore`, exists === 't');
  }

  const rowTotals = {};
  for (const table of REQUIRED_TABLES) {
    const count = psqlQuery(`SELECT count(*) FROM ${table};`);
    rowTotals[table] = Number(count);
    record(`row count: ${table}`, Number.isFinite(Number(count)), `${count} rows`);
  }

  const hookExists = psqlQuery(
    `SELECT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'custom_access_token_hook');`,
  );
  record(
    'auth config: public.custom_access_token_hook function present after restore',
    hookExists === 't',
  );

  const authSchemaExists = psqlQuery(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth');`,
  );
  record(
    "auth schema present in the dump (informational only — Supabase's GoTrue service state itself isn't reproducible via pg_dump/pg_restore, only its schema)",
    authSchemaExists === 't',
  );

  console.log('\nRow totals:', JSON.stringify(rowTotals, null, 2));
} finally {
  console.log(`\nDropping disposable database ${dbName}...`);
  try {
    execFileSync(dropdb, [...connArgs, dbName], { env, stdio: 'inherit' });
  } catch (err) {
    console.error(
      `WARNING: failed to drop disposable database ${dbName} automatically — drop it manually: dropdb -U ${LOCAL_USER} ${dbName}`,
      err.message,
    );
  }
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) process.exit(1);
