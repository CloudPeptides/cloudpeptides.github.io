/**
 * Admin-only role change. Same requirement checklist as ../index.ts
 * (auth, explicit authorization, input validation, rate limiting,
 * audit logging, narrow scope). Additionally refuses ANY self-role
 * change outright — not just self-*elevation* — which is the simplest
 * rule that fully satisfies Blueprint v2 §16's "editor/admin cannot
 * grant themselves admin" test with no edge case left to reason about
 * (an admin who needs their own role changed asks another admin, or
 * uses the Supabase dashboard directly; this also sidesteps the
 * "last admin demotes themselves and locks the dashboard" footgun
 * without needing a separate "are you the last admin" check).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  createServiceClient,
  hasMinRole,
  isSameOriginRequest,
  type Role,
} from '../../../../../lib/auth';
import { setUserRole, writeAuditLog } from '../../../../../lib/admin/users';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ASSIGNABLE_ROLES: Role[] = ['member', 'contributor', 'editor', 'admin'];

export const PATCH: APIRoute = async ({ params, request, url, locals }) => {
  const session = locals.session!;
  const targetUserId = params.id;
  if (!targetUserId) return json({ success: false, error: 'Missing user id.' }, 400);
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }
  if (targetUserId === session.userId) {
    return json(
      { success: false, error: 'You cannot change your own role. Ask another admin.' },
      400,
    );
  }

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `admin-role-change:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 4_096);
  if (!bodyRead.ok) return json({ success: false, error: 'Invalid request body.' }, 400);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text || '{}');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const role = input.role;
  if (typeof role !== 'string' || !ASSIGNABLE_ROLES.includes(role as Role)) {
    return json({ success: false, error: 'Invalid role.' }, 400);
  }

  const service = createServiceClient();
  try {
    await setUserRole(service, targetUserId, role as Role);
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'role_change',
      target_table: 'user_roles',
      target_id: targetUserId,
      detail: { new_role: role },
    });
    return json({ success: true }, 200);
  } catch {
    return json({ success: false, error: "Could not update this user's role." }, 400);
  }
};
