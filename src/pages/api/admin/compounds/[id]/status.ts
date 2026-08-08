/**
 * Compound status-transition route — the ONE place a compound's status
 * ever changes (src/lib/admin/mutations.ts's TABLE_REGISTRY deliberately
 * excludes `status` from compounds' updatable columns so no other path
 * exists). This is where Blueprint v2 §17's pre-publish checks actually
 * run: moving to 'published' is refused outright (400, with the exact
 * blocker list) while any claim lacks a citation or a regulatory record
 * lacks a source — never silently allowed through.
 *
 * Still uses the caller's own verified JWT (createUserScopedClient) —
 * RLS is the real role boundary for *which* transitions a contributor
 * vs. editor can make (contributor: only between draft/in_review;
 * editor+: any transition, including publish/archive). This route adds
 * the content-completeness check RLS has no way to express, and sets
 * last_reviewed_at/reviewed_by on a successful publish (§17 step 4).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createUserScopedClient, isSameOriginRequest } from '../../../../../lib/auth';
import { readBodyWithLimit } from '../../../../../lib/request-limits';
import { getCompoundForEdit } from '../../../../../lib/admin/queries';
import { checkPublishReadiness, EDITORIAL_STATUSES } from '../../../../../lib/admin/validation';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const id = params.id;
  if (!id) return json({ success: false, error: 'Missing compound id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }

  const bodyRead = await readBodyWithLimit(request, 8_192);
  if (!bodyRead.ok) return json({ success: false, error: 'Invalid request body.' }, 400);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text || '{}');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const targetStatus = input.target_status;
  if (typeof targetStatus !== 'string' || !EDITORIAL_STATUSES.includes(targetStatus as never)) {
    return json({ success: false, error: 'Invalid target status.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);
  const compound = await getCompoundForEdit(client, id);
  if (!compound) return json({ success: false, error: 'Compound not found.' }, 404);

  if (targetStatus === 'published') {
    const readiness = checkPublishReadiness(compound);
    if (readiness.blockers.length > 0) {
      return json(
        {
          success: false,
          error: 'This compound is not ready to publish.',
          blockers: readiness.blockers,
          warnings: readiness.warnings,
        },
        400,
      );
    }
  }

  const update: Record<string, unknown> = { status: targetStatus };
  if (targetStatus === 'published') {
    update.last_reviewed_at = new Date().toISOString();
    update.reviewed_by = session.userId;
  }

  const { data, error } = await client
    .from('compounds')
    .update(update)
    .eq('id', id)
    .select('id, status, last_reviewed_at, reviewed_by')
    .maybeSingle();

  if (error || !data) {
    // Most likely an RLS rejection — a contributor attempting a
    // publish/archive transition, or acting on a row whose current
    // status they're not allowed to touch.
    return json(
      { success: false, error: 'You do not have permission to make this status change.' },
      403,
    );
  }

  return json({ success: true, data }, 200);
};
