/**
 * Server-side contact-form route — replaces the legacy site's
 * client-side Web3Forms call (which embedded a public access key
 * directly in browser JS) with a Worker route that keeps the Resend API
 * key server-only. See CLAUDE.md §8/§16: service-role-equivalent
 * credentials never reach browser-reachable code.
 *
 * Layered spam/abuse protection, none of it requiring a new Cloudflare
 * resource (see src/lib/rate-limit.ts for why):
 *  - honeypot field (`website` — real users never fill a field named to
 *    look legitimate but hidden via CSS; bots that autofill every field
 *    trip it)
 *  - per-IP in-memory rate limit (best-effort, see rate-limit.ts)
 *  - per-browser cookie cooldown (30s between submissions)
 *  - field validation/sanitization + header-injection defense
 *    (src/lib/form-validation.ts)
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateContactSubmission } from '../../lib/form-validation';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { sendEmail } from '../../lib/resend';

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

  // Honeypot — silently "succeed" without sending anything, so a bot
  // gets no signal that it was caught.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json({ success: true }, 200);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const cookieHeader = request.headers.get('cookie');

  if (isInCooldown(cookieHeader)) {
    return json({ success: false, error: 'Please wait a moment before submitting again.' }, 429);
  }
  const rate = checkRateLimit(`contact:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

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
