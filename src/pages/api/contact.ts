/**
 * Server-side contact-form route — replaces the legacy site's
 * client-side Web3Forms call (which embedded a public access key
 * directly in browser JS) with a Worker route that keeps the Resend API
 * key server-only. See CLAUDE.md §8/§16: service-role-equivalent
 * credentials never reach browser-reachable code.
 *
 * Layered spam/abuse protection, ordered cheapest-and-most-decisive
 * first:
 *  1. request body-size limit (src/lib/request-limits.ts).
 *  2. honeypot field (`website`) — silently "succeeds" without sending
 *     anything, so a bot gets no signal it was caught. Secondary
 *     defense, not the primary gate.
 *  3. per-browser cookie cooldown (30s) — secondary defense.
 *  4. Cloudflare's native Workers Rate Limiting binding
 *     (env.FORM_RATE_LIMITER) — durable across requests/isolates.
 *  5. Activation check: this route is only "live" once BOTH Resend
 *     (RESEND_API_KEY + RESEND_FROM_ADDRESS) and Turnstile
 *     (TURNSTILE_SECRET_KEY) are configured. Deliberately paired, not
 *     independent — a form that could send real email without a bot
 *     challenge configured would be a silent regression the moment
 *     someone sets the Resend keys alone. Honest 503 if either is
 *     missing; never a fake success.
 *  6. Cloudflare Turnstile siteverify (src/lib/turnstile.ts) — now
 *     unconditionally required, since step 5 already guaranteed the
 *     secret is configured before this point is reached.
 *  7. field validation/sanitization + header-injection defense
 *     (src/lib/form-validation.ts).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateContactSubmission } from '../../lib/form-validation';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { readBodyWithLimit } from '../../lib/request-limits';
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
  // 1. Body-size limit.
  const bodyRead = await readBodyWithLimit(request);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  // 2. Honeypot.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json({ success: true }, 200);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const cookieHeader = request.headers.get('cookie');

  // 3. Cookie cooldown.
  if (isInCooldown(cookieHeader)) {
    return json({ success: false, error: 'Please wait a moment before submitting again.' }, 429);
  }

  // 4. Cloudflare native rate limit.
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `contact:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  // 5. Activation check — Resend AND Turnstile both required. Real,
  // honest failure — never fake a success when nothing was sent, and
  // never send email without the bot-defense that's supposed to gate it.
  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!apiKey || !fromAddress || !turnstileSecret) {
    return json(
      { success: false, error: 'Email delivery is not configured in this environment yet.' },
      503,
    );
  }

  // 6. Turnstile — mandatory now that the secret is confirmed configured.
  const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
  if (!token) {
    return json({ success: false, error: 'Please complete the verification challenge.' }, 400);
  }
  const verification = await verifyTurnstileToken(turnstileSecret, token, ip);
  if (!verification.success) {
    return json({ success: false, error: 'Verification failed. Please try again.' }, 400);
  }

  // 7. Field validation.
  const { result, data } = validateContactSubmission(input);
  if (!result.valid || !data) {
    return json({ success: false, error: result.error ?? 'Invalid submission.' }, 400);
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
