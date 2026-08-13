/**
 * Reinstate a suspended researcher account — admin-only. Mirrors
 * suspend.ts exactly (see its header comment); this is the same
 * account_status column moving the other direction.
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
    `researcher-reinstate:${session.userId}`,
  );
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  const { data, error } = await client
    .from('researcher_profiles')
    .update({
      account_status: 'active',
      suspended_at: null,
      suspended_reason: null,
      suspended_by: null,
    })
    .eq('user_id', targetUserId)
    .select('user_id, account_status')
    .maybeSingle();

  if (error || !data) {
    return json({ success: false, error: 'Could not reinstate this account.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'researcher_account_reinstated',
      target_table: 'researcher_profiles',
      target_id: targetUserId,
    });
  } catch (err) {
    console.error('reinstate audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, data }, 200);
};
