/**
 * Resolves the native PostgreSQL client binaries (pg_dump, pg_restore,
 * psql, createdb, dropdb) used by scripts/migration/backup-production.mjs
 * and scripts/migration/restore-verify-backup.mjs.
 *
 * Prefers the known Windows install path for PostgreSQL 17
 * (C:\Program Files\PostgreSQL\17\bin — installed 2026-08-08
 * specifically so these scripts don't need Docker or `supabase start`)
 * when it exists, falling back to bare command names resolved via
 * PATH otherwise (macOS/Linux machines with the client tools already
 * on PATH, e.g. via `brew install libpq`/`apt install
 * postgresql-client`, or a differently-located Windows install).
 */
import { existsSync } from 'node:fs';

const WINDOWS_PG_BIN = String.raw`C:\Program Files\PostgreSQL\17\bin`;

export function resolvePgTool(name) {
  const winPath = `${WINDOWS_PG_BIN}\\${name}.exe`;
  if (process.platform === 'win32' && existsSync(winPath)) return winPath;
  return name;
}
