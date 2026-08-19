/**
 * Registers (or refreshes) the calling admin's own Web Push
 * subscription. RLS (push_subscriptions_insert_own /
 * push_subscriptions_update_own) is the real boundary — both require
 * `user_id = auth.uid() AND has_min_role('admin')` — the role check
 * below exists only to return a clean 403 instead of an opaque RLS
 * error, same pattern as every other admin route in this codebase.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, hasMinRole, isSameOriginRequest } from '../../../../lib/auth';
import { isSingleLineSafe, sanitizeText } from '../../../../lib/form-validation';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../../lib/request-limits';

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

  const rate = await checkRateLimit(env.ADMIN_RATE_LIMITER, `push-subscribe:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const bodyRead = await readBodyWithLimit(request, 4_096);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const endpoint = sanitizeText(input.endpoint, 1_000);
  const p256dh = sanitizeText(input.p256dh, 200);
  const authKey = sanitizeText(input.auth, 200);
  const userAgent = sanitizeText(input.userAgent, 300) || null;

  if (!endpoint || !isSingleLineSafe(endpoint) || !/^https:\/\//.test(endpoint)) {
    return json({ success: false, error: 'A valid push endpoint is required.' }, 400);
  }
  if (!p256dh || !authKey) {
    return json({ success: false, error: 'Subscription keys are required.' }, 400);
  }

  const client = createUserScopedClient(session.accessToken);
  const { error } = await client.from('push_subscriptions').upsert(
    {
      user_id: session.userId,
      endpoint,
      p256dh,
      auth_key: authKey,
      user_agent: userAgent,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) {
    return json({ success: false, error: 'Could not save this device subscription.' }, 400);
  }

  return json({ success: true }, 200);
};
