/**
 * Require a specific researcher to recertify — admin-only. Sets
 * force_recertify_after to now(); src/lib/researcher-certification.ts's
 * needsCertification() then treats their most recent attestation as
 * stale on their next protected-page load (src/middleware.ts),
 * regardless of CURRENT_CERTIFICATION_VERSION, without affecting any
 * other researcher's account.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  createServiceClient,
  createUserScopedClient,
  hasMinRole,
  isSameOriginRequest,
} from '../../../../../lib/auth';
import { writeAuditLog } from '../../../../../lib/admin/users';
import { checkRateLimit } from '../../../../../lib/rate-limit';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  const targetUserId = params.id;
  if (!targetUserId || !UUID_PATTERN.test(targetUserId)) {
    return json({ success: false, error: 'Invalid researcher id.' }, 400);
  }

  const rate = await checkRateLimit(
    env.ADMIN_RATE_LIMITER,
    `researcher-recertify:${session.userId}`,
  );
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  const { data, error } = await client
    .from('researcher_profiles')
    .update({ force_recertify_after: new Date().toISOString() })
    .eq('user_id', targetUserId)
    .select('user_id, force_recertify_after')
    .maybeSingle();

  if (error || !data) {
    return json({ success: false, error: 'Could not update this account.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'researcher_recertification_required',
      target_table: 'researcher_profiles',
      target_id: targetUserId,
    });
  } catch (err) {
    console.error(
      'require-recertification audit log failed:',
      err instanceof Error ? err.message : err,
    );
  }

  return json({ success: true, data }, 200);
};
