/**
 * Removes the calling admin's own Web Push subscription(s). No
 * endpoint identifier is required from the client — "Disable
 * Notifications" removes every device subscription tied to the caller's
 * own account, which is what the notification-settings UI actually
 * offers (src/pages/admin/notifications.astro has no per-device list,
 * only a single enable/disable toggle per session). RLS
 * (push_subscriptions_delete_own) is the real boundary.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { checkRateLimit } from '../../../../lib/rate-limit';

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

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `push-unsubscribe:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const client = createUserScopedClient(session.accessToken);
  const { error } = await client.from('push_subscriptions').delete().eq('user_id', session.userId);
  if (error) {
    return json({ success: false, error: 'Could not remove this device subscription.' }, 400);
  }

  return json({ success: true }, 200);
};
