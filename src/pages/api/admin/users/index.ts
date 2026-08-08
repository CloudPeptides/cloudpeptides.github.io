/**
 * Admin-only user creation — one of the two service-role routes in this
 * app (the other is [id]/role.ts), because user_roles/the Auth admin
 * API have no other path at all. Meets every requirement in Blueprint
 * v2 §16's service-role route table:
 *  - Authentication: src/middleware.ts already verified the caller's
 *    own JWT for every /api/admin/* request.
 *  - Explicit authorization: re-checked here specifically for *this*
 *    action (admin role, not just "signed in") — middleware only
 *    enforces the contributor+ baseline.
 *  - Input validation: email format, password strength, role enum.
 *  - Rate limiting: env.FORM_RATE_LIMITER, keyed per-actor.
 *  - Audit logging: every successful creation writes an audit_log row.
 *  - Narrow scope: creates exactly one user + one role row, nothing else.
 *  - No confirmation/invite email is ever sent (email_confirm: true) —
 *    CLAUDE.md §9 requires separate explicit approval before this app
 *    sends any real external email, and there's no product need for an
 *    invite email here; the creating admin relays the password directly.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  createServiceClient,
  hasMinRole,
  isSameOriginRequest,
  type Role,
} from '../../../../lib/auth';
import { createUserWithRole, writeAuditLog } from '../../../../lib/admin/users';
import { isValidEmail, isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ASSIGNABLE_ROLES: Role[] = ['member', 'contributor', 'editor', 'admin'];

export const POST: APIRoute = async ({ request, url, locals }) => {
  const session = locals.session!;
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `admin-user-create:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 8_192);
  if (!bodyRead.ok) return json({ success: false, error: 'Invalid request body.' }, 400);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text || '{}');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const email = sanitizeText(input.email, 200);
  const password = typeof input.password === 'string' ? input.password : '';
  const role = input.role;

  if (!email || !isValidEmail(email) || !isSingleLineSafe(email)) {
    return json({ success: false, error: 'Please enter a valid email address.' }, 400);
  }
  if (password.length < 8) {
    return json({ success: false, error: 'Password must be at least 8 characters.' }, 400);
  }
  if (typeof role !== 'string' || !ASSIGNABLE_ROLES.includes(role as Role)) {
    return json({ success: false, error: 'Invalid role.' }, 400);
  }

  const service = createServiceClient();
  try {
    const user = await createUserWithRole(service, { email, password, role: role as Role });
    await writeAuditLog(service, {
      actor_user_id: session.userId,
      action: 'user_created',
      target_table: 'user_roles',
      target_id: user.id,
      detail: { email: user.email, role },
    });
    return json({ success: true, data: user }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create this user.';
    // Supabase's own duplicate-email error is safe to relay verbatim
    // (no internal detail beyond "this email already exists"); anything
    // else falls back to a generic message.
    const safeMessage = message.toLowerCase().includes('already been registered')
      ? 'A user with this email already exists.'
      : 'Could not create this user.';
    return json({ success: false, error: safeMessage }, 400);
  }
};
