/**
 * Generic, allow-listed editorial CRUD route — POST (create)/PATCH
 * (update)/DELETE for the nine content-editing tables in
 * src/lib/admin/mutations.ts's TABLE_REGISTRY. `compounds.status` and
 * `claims` deletion have their own dedicated, narrower routes (see
 * that file's header comment for exactly why).
 *
 * Every WRITE goes through a client scoped to the CALLER'S OWN verified
 * JWT (src/lib/auth.ts's createUserScopedClient) — Postgres RLS is the
 * real authorization boundary, exactly as CLAUDE.md §8 requires for
 * ordinary editorial actions. The role checks below are a second,
 * defense-in-depth layer that turns an opaque RLS rejection into a
 * clear 403 — never a substitute for RLS.
 *
 * Research CMS gap-fill (2026-08-10): every successful write is now
 * also recorded to audit_log (same pattern already used by
 * src/pages/api/admin/products/[id].ts and the COA/user-role routes) —
 * this is the ONE thing that genuinely needs the service-role key here
 * (audit_log has no client write policy at all, by design), used ONLY
 * for that one insert, never for the actual data mutation above it.
 * Extends record_content_revision()'s existing but narrower coverage
 * (compounds-row-only full-JSON snapshots) to all nine editorial
 * tables — claims/sources/studies/regulatory_records edits previously
 * left zero trace of who changed what. Best-effort: an audit-log
 * failure is logged but never masks the outcome of the write it
 * describes, matching every other audit call site in this codebase.
 *
 * src/middleware.ts has already confirmed the caller is signed in with
 * at least 'contributor' before this file ever runs (every /api/admin/*
 * path is gated there) — Astro.locals.session is guaranteed non-null.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import {
  createServiceClient,
  createUserScopedClient,
  hasMinRole,
  isSameOriginRequest,
  type Session,
} from '../../../../lib/auth';
import { readBodyWithLimit } from '../../../../lib/request-limits';
import { pickAllowed, TABLE_REGISTRY } from '../../../../lib/admin/mutations';
import { writeAuditLog } from '../../../../lib/admin/users';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** First key column's value, if it looks like a uuid — audit_log.target_id
 * is a uuid column, so composite-key tables (claim_sources,
 * stack_components, source_identifiers) can't have their full key
 * stored there; the complete key values always go in `detail` instead,
 * regardless. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function targetIdFrom(keyColumns: string[], row: Record<string, unknown>): string | undefined {
  const value = row[keyColumns[0]];
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

async function auditWrite(
  session: Session,
  action: string,
  table: string,
  keyColumns: string[],
  keyRow: Record<string, unknown>,
  detail: Record<string, unknown>,
): Promise<void> {
  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action,
      target_table: table,
      target_id: targetIdFrom(keyColumns, keyRow),
      detail,
    });
  } catch (err) {
    console.error(`${table} ${action} audit log failed:`, err instanceof Error ? err.message : err);
  }
}

/** Field-level from/to diff, restricted to the columns actually
 * submitted in this request — mirrors src/pages/api/admin/products/
 * [id].ts's own change-tracking exactly, generalized across every
 * table's own column set instead of one hardcoded list. */
function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): Record<string, { from: unknown; to: unknown }> {
  const changed: Record<string, { from: unknown; to: unknown }> = {};
  for (const f of fields) {
    if (before[f] !== after[f]) changed[f] = { from: before[f], to: after[f] };
  }
  return changed;
}

async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  const bodyRead = await readBodyWithLimit(request, 65_536);
  if (!bodyRead.ok) return null;
  try {
    const parsed = JSON.parse(bodyRead.text || '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function keyValuesFrom(
  source: Record<string, unknown>,
  keyColumns: string[],
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  for (const col of keyColumns) {
    const value = source[col];
    if (value === undefined || value === null || value === '') return null;
    out[col] = value;
  }
  return out;
}

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!; // guaranteed by middleware for /api/admin/*
  const config = TABLE_REGISTRY[params.table ?? ''];
  if (!config) return json({ success: false, error: 'Unknown resource.' }, 404);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, config.minRoleWrite)) {
    return json({ success: false, error: 'You do not have permission to do this.' }, 403);
  }

  const body = await parseBody(request);
  if (!body) return json({ success: false, error: 'Invalid request body.' }, 400);

  const validation = config.validate(body);
  if (!validation.valid) {
    return json({ success: false, error: validation.error ?? 'Invalid input.' }, 400);
  }

  const insertRow = pickAllowed(body, config.insertableColumns);
  const client = createUserScopedClient(session.accessToken);
  const { data, error } = await client.from(config.table).insert(insertRow).select().maybeSingle();

  if (error) {
    // RLS rejections and constraint violations both land here — never
    // leak the raw Postgres error text (may describe internal schema
    // details), just a generic, honest failure.
    return json(
      { success: false, error: 'Could not create this record. Check your permissions and input.' },
      400,
    );
  }
  await auditWrite(
    session,
    `${config.table}_created`,
    config.table,
    config.keyColumns,
    data as Record<string, unknown>,
    { row: insertRow },
  );
  return json({ success: true, data }, 201);
};

export const PATCH: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const config = TABLE_REGISTRY[params.table ?? ''];
  if (!config) return json({ success: false, error: 'Unknown resource.' }, 404);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, config.minRoleWrite)) {
    return json({ success: false, error: 'You do not have permission to do this.' }, 403);
  }

  const body = await parseBody(request);
  if (!body) return json({ success: false, error: 'Invalid request body.' }, 400);

  const keyValues = keyValuesFrom(body, config.keyColumns);
  if (!keyValues) {
    return json({ success: false, error: 'Missing identifier for this record.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);

  // Merge onto the current (RLS-visible) row so the shared validate()
  // function — written for a complete record — can correctly validate
  // a PARTIAL update without every caller having to resend every field.
  const { data: current, error: fetchError } = await client
    .from(config.table)
    .select('*')
    .match(keyValues)
    .maybeSingle();
  if (fetchError || !current) {
    return json({ success: false, error: 'Record not found.' }, 404);
  }

  const picked = pickAllowed(body, config.updatableColumns);
  if (Object.keys(picked).length === 0) {
    return json({ success: false, error: 'No editable fields were provided.' }, 400);
  }

  const merged = { ...current, ...picked };
  const validation = config.validate(merged);
  if (!validation.valid) {
    return json({ success: false, error: validation.error ?? 'Invalid input.' }, 400);
  }

  const { data, error } = await client
    .from(config.table)
    .update(picked)
    .match(keyValues)
    .select()
    .maybeSingle();

  if (error || !data) {
    return json(
      { success: false, error: 'Could not update this record. Check your permissions and input.' },
      400,
    );
  }
  const changed = diffFields(
    current as Record<string, unknown>,
    data as Record<string, unknown>,
    Object.keys(picked),
  );
  if (Object.keys(changed).length > 0) {
    await auditWrite(
      session,
      `${config.table}_updated`,
      config.table,
      config.keyColumns,
      keyValues,
      {
        changed,
      },
    );
  }
  return json({ success: true, data }, 200);
};

export const DELETE: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const config = TABLE_REGISTRY[params.table ?? ''];
  if (!config) return json({ success: false, error: 'Unknown resource.' }, 404);
  if (!config.minRoleDelete) {
    return json({ success: false, error: 'Deleting this kind of record is not supported.' }, 405);
  }
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, config.minRoleDelete)) {
    return json({ success: false, error: 'You do not have permission to do this.' }, 403);
  }

  const searchValues: Record<string, unknown> = {};
  for (const col of config.keyColumns) {
    const value = url.searchParams.get(col);
    if (!value) return json({ success: false, error: 'Missing identifier for this record.' }, 400);
    searchValues[col] = value;
  }

  const client = createUserScopedClient(session.accessToken);
  // .select() on a delete also returns the row(s) just removed — the
  // only way this route can capture "what the deleted content actually
  // was" for the audit trail, since after this point it's gone.
  const {
    data: deletedRows,
    error,
    count,
  } = await client.from(config.table).delete({ count: 'exact' }).match(searchValues).select();

  if (error) {
    return json(
      { success: false, error: 'Could not delete this record. Check your permissions.' },
      400,
    );
  }
  if (!count) {
    return json({ success: false, error: 'Record not found.' }, 404);
  }
  await auditWrite(
    session,
    `${config.table}_deleted`,
    config.table,
    config.keyColumns,
    searchValues,
    {
      deleted: deletedRows?.[0] ?? searchValues,
    },
  );
  return json({ success: true }, 200);
};
