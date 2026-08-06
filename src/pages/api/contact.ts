/**
 * Server-side contact-form route — replaces the legacy site's
 * client-side Web3Forms call (which embedded a public access key
 * directly in browser JS) with a Worker route that keeps the Resend API
 * key server-only. See CLAUDE.md §8/§16: service-role-equivalent
 * credentials never reach browser-reachable code.
 *
 * Layered spam/abuse protection, ordered cheapest-and-most-decisive
 * first:
 *  1. honeypot field (`website`) — silently "succeeds" without sending
 *     anything, so a bot gets no signal it was caught. Secondary
 *     defense, not the primary gate.
 *  2. per-browser cookie cooldown (30s) — secondary defense.
 *  3. Cloudflare's native Workers Rate Limiting binding
 *     (env.FORM_RATE_LIMITER) — durable across requests/isolates,
 *     replacing the previous in-memory-only limiter.
 *  4. Cloudflare Turnstile siteverify (src/lib/turnstile.ts) — the
 *     primary bot-defense once TURNSTILE_SECRET_KEY is configured;
 *     conditionally required (skipped, not silently bypassed-as-pass,
 *     if that key isn't set yet — matches how the Resend-config check
 *     already behaves for an unactivated feature).
 *  5. field validation/sanitization + header-injection defense
 *     (src/lib/form-validation.ts).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateContactSubmission } from '../../lib/form-validation';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { sendEmail } from '../../lib/resend';
import { verifyTurnstileToken } from '../../lib/turnstile';

const DESTINATION_EMAIL = 'info.order.thecloud@proton.me'; // same inbox shown on the public Contact page

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  // 1. Honeypot.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json({ success: true }, 200);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const cookieHeader = request.headers.get('cookie');

  // 2. Cookie cooldown.
  if (isInCooldown(cookieHeader)) {
    return json({ success: false, error: 'Please wait a moment before submitting again.' }, 429);
  }

  // 3. Cloudflare native rate limit.
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `contact:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  // 4. Turnstile — conditionally required.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
    if (!token) {
      return json({ success: false, error: 'Please complete the verification challenge.' }, 400);
    }
    const verification = await verifyTurnstileToken(env.TURNSTILE_SECRET_KEY, token, ip);
    if (!verification.success) {
      return json({ success: false, error: 'Verification failed. Please try again.' }, 400);
    }
  }

  // 5. Field validation.
  const { result, data } = validateContactSubmission(input);
  if (!result.valid || !data) {
    return json({ success: false, error: result.error ?? 'Invalid submission.' }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    // Real, honest failure — never fake a success when nothing was sent.
    return json(
      { success: false, error: 'Email delivery is not configured in this environment yet.' },
      503,
    );
  }

  const emailResult = await sendEmail({
    apiKey,
    from: fromAddress,
    to: DESTINATION_EMAIL,
    replyTo: data.email,
    subject: 'Cloud Peptides Contact Form',
    text: `New contact form submission\n\nName: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`,
  });

  if (!emailResult.success) {
    return json({ success: false, error: 'Could not send your message. Please try again.' }, 502);
  }

  return json({ success: true }, 200, { 'Set-Cookie': cooldownSetCookieHeader() });
};
