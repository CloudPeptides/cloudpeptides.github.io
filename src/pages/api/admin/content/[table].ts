/**
 * Generic, allow-listed editorial CRUD route — POST (create)/PATCH
 * (update)/DELETE for the nine content-editing tables in
 * src/lib/admin/mutations.ts's TABLE_REGISTRY. `compounds.status` and
 * `claims` deletion have their own dedicated, narrower routes (see
 * that file's header comment for exactly why).
 *
 * Every write goes through a client scoped to the CALLER'S OWN verified
 * JWT (src/lib/auth.ts's createUserScopedClient) — Postgres RLS is the
 * real authorization boundary, exactly as CLAUDE.md §8 requires for
 * ordinary editorial actions. The role checks below are a second,
 * defense-in-depth layer that turns an opaque RLS rejection into a
 * clear 403 — never a substitute for RLS, and never using the
 * service-role key (this route never imports createServiceClient).
 *
 * src/middleware.ts has already confirmed the caller is signed in with
 * at least 'contributor' before this file ever runs (every /api/admin/*
 * path is gated there) — Astro.locals.session is guaranteed non-null.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { readBodyWithLimit } from '../../../../lib/request-limits';
import { pickAllowed, TABLE_REGISTRY } from '../../../../lib/admin/mutations';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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
  const { error, count } = await client
    .from(config.table)
    .delete({ count: 'exact' })
    .match(searchValues);

  if (error) {
    return json(
      { success: false, error: 'Could not delete this record. Check your permissions.' },
      400,
    );
  }
  if (!count) {
    return json({ success: false, error: 'Record not found.' }, 404);
  }
  return json({ success: true }, 200);
};
