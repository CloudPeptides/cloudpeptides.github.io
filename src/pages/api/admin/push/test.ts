/**
 * Sends a fixed, server-defined test notification to the caller's own
 * device(s) only — the request body is never read for title/body/url,
 * so there is no way for any client (including a compromised admin
 * session) to use this route to push arbitrary content. Uses the
 * caller's own user-scoped client, not the service-role client: RLS
 * already permits an admin to SELECT/DELETE their own push_subscriptions
 * rows, so no elevated access is needed here at all.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { sendTestNotification } from '../../../../lib/push';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, url, locals }) => {
  const session = locals.session!;
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }
  if (!hasMinRole(session.role, 'admin')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `push-test:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  try {
    await sendTestNotification(client, session.userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send a test notification.';
    return json({ success: false, error: message }, 400);
  }

  return json({ success: true }, 200);
};
