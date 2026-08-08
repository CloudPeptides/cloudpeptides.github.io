/**
 * Admin COA metadata edit + status transition (publish/unpublish/
 * archive) — one route, unlike compounds' deliberately-separate status
 * route, because a COA has no equivalent of Blueprint v2 §17's
 * multi-field pre-publish readiness check; the only "is this ready to
 * publish" gate is "does it have the fields every COA is required to
 * have," already enforced at creation time (src/pages/api/admin/
 * coas/index.ts) and re-checked below defensively.
 *
 * Same authorization posture as every other admin content route:
 * caller's own JWT (createUserScopedClient), RLS
 * (batch_coas_all_admin) as the real boundary, hasMinRole() here as
 * defense-in-depth for a clear 403.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EDITABLE_TEXT_FIELDS = [
  'peptide_name',
  'batch_identifier',
  'testing_lab',
  'verification_url',
  'notes',
  'purity_result',
] as const;

const STATUSES = ['draft', 'published', 'archived'] as const;
type Status = (typeof STATUSES)[number];

export const PATCH: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const id = params.id;
  if (!id) return json({ success: false, error: 'Missing COA id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);
  const { data: current, error: fetchError } = await client
    .from('batch_coas')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !current) {
    return json({ success: false, error: 'COA not found.' }, 404);
  }

  const update: Record<string, unknown> = {};

  for (const field of EDITABLE_TEXT_FIELDS) {
    if (field in input) {
      const maxLen = field === 'notes' ? 4000 : field === 'verification_url' ? 500 : 200;
      const value = sanitizeText(input[field], maxLen);
      if (value && !isSingleLineSafe(value) && field !== 'notes') {
        return json({ success: false, error: 'Invalid characters in submitted fields.' }, 400);
      }
      update[field] = value || null;
    }
  }
  if ('test_date' in input) {
    const testDate = sanitizeText(input.test_date, 20);
    if (testDate && !/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
      return json({ success: false, error: 'Test date must be a valid date.' }, 400);
    }
    update.test_date = testDate || null;
  }

  let statusChanged = false;
  if ('status' in input) {
    const targetStatus = input.status;
    if (typeof targetStatus !== 'string' || !STATUSES.includes(targetStatus as Status)) {
      return json({ success: false, error: 'Invalid status.' }, 400);
    }
    const merged = { ...current, ...update };
    if (targetStatus === 'published') {
      const blockers: string[] = [];
      if (!merged.peptide_name) blockers.push('Peptide name is required to publish.');
      if (!merged.testing_lab) blockers.push('Testing lab is required to publish.');
      if (!merged.test_date) blockers.push('Test date is required to publish.');
      if (!merged.file_path) blockers.push('A file is required to publish.');
      if (blockers.length > 0) {
        return json({ success: false, error: 'This COA is not ready to publish.', blockers }, 400);
      }
      if (current.status !== 'published') update.published_at = new Date().toISOString();
    }
    if (targetStatus === 'archived' && current.status !== 'archived') {
      update.archived_at = new Date().toISOString();
    }
    update.status = targetStatus;
    statusChanged = true;
  }

  if (Object.keys(update).length === 0) {
    return json({ success: false, error: 'No changes were submitted.' }, 400);
  }

  const { data, error } = await client
    .from('batch_coas')
    .update(update)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error || !data) {
    return json(
      { success: false, error: 'Could not update this COA. Check your permissions and input.' },
      400,
    );
  }

  return json({ success: true, data, statusChanged }, 200);
};
