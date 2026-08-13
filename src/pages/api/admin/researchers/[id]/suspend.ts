/**
 * Suspend a researcher account — admin-only. Uses the acting admin's
 * own JWT (createUserScopedClient), not the service role: RLS's
 * researcher_profiles_update policy already allows an admin to update
 * any row, and the protect_researcher_profile_admin_fields trigger
 * (supabase/migrations/20260813120000_researcher_accounts.sql) is what
 * actually enforces that ONLY an admin JWT can touch account_status/
 * suspended_* at all — same "ordinary editorial actions use the acting
 * user's own JWT under RLS" posture as every other admin workflow route
 * in this codebase (e.g. compounds/[id]/status.ts).
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
import { sanitizeText } from '../../../../../lib/form-validation';
import { writeAuditLog } from '../../../../../lib/admin/users';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../../lib/request-limits';

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

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `researcher-suspend:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 4_096);
  let reason = '';
  if (bodyRead.ok && bodyRead.text) {
    try {
      const input = JSON.parse(bodyRead.text) as Record<string, unknown>;
      reason = sanitizeText(input.reason, 500);
    } catch {
      // A missing/invalid body just means no reason was given.
    }
  }

  const client = createUserScopedClient(session.accessToken);
  const { data, error } = await client
    .from('researcher_profiles')
    .update({
      account_status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_reason: reason || null,
      suspended_by: session.userId,
    })
    .eq('user_id', targetUserId)
    .select('user_id, account_status')
    .maybeSingle();

  if (error || !data) {
    return json({ success: false, error: 'Could not suspend this account.' }, 400);
  }

  try {
    const service = createServiceClient();
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'researcher_account_suspended',
      target_table: 'researcher_profiles',
      target_id: targetUserId,
      detail: { reason: reason || null },
    });
  } catch (err) {
    console.error('suspend audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, data }, 200);
};
