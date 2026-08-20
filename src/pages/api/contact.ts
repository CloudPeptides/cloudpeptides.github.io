/**
 * Server-side contact-form route. Originally emailed the message via
 * Resend and stored nothing (see git history for that version); as of
 * 2026-08-20 (approved) email notification is retired entirely — the
 * message is persisted to contact_submissions and an admin push
 * notification (src/lib/push.ts's notifyNewContactSubmission) fires
 * instead. Admins read and reply from the dashboard
 * (/admin/contact-submissions), never from an inbox. See
 * supabase/migrations/20260820100000_contact_submissions.sql's header
 * comment for the full reasoning.
 *
 * Layered spam/abuse protection, ordered cheapest-and-most-decisive
 * first (unchanged from the email-era version, still relevant even
 * though src/middleware.ts now requires a signed-in session for this
 * whole route — a compromised or bulk-created account is still a real
 * abuse vector):
 *  0. launch-phase kill switch (src/lib/launch-config.ts,
 *     CONTACT_FORM_ENABLED).
 *  1. request body-size limit (src/lib/request-limits.ts).
 *  2. honeypot field (`website`) — silently "succeeds" without saving
 *     anything, so a bot gets no signal it was caught.
 *  3. per-browser cookie cooldown (30s) — secondary defense.
 *  4. Cloudflare's native Workers Rate Limiting binding
 *     (env.FORM_RATE_LIMITER) — durable across requests/isolates.
 *  5. Activation check: this route is only "live" once Turnstile
 *     (TURNSTILE_SECRET_KEY) is configured. Honest 503 if missing;
 *     never a fake success.
 *  6. Cloudflare Turnstile siteverify (src/lib/turnstile.ts).
 *  7. field validation/sanitization + header-injection defense
 *     (src/lib/form-validation.ts).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createServiceClient, createUserScopedClient } from '../../lib/auth';
import { insertContactSubmission } from '../../lib/contact-submissions';
import { validateContactSubmission } from '../../lib/form-validation';
import { CONTACT_FORM_ENABLED } from '../../lib/launch-config';
import { notifyNewContactSubmission } from '../../lib/push';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { readBodyWithLimit } from '../../lib/request-limits';
import { verifyTurnstileToken } from '../../lib/turnstile';

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  // src/middleware.ts already refuses any unauthenticated request to
  // this path before it ever reaches here — locals.session is
  // guaranteed non-null. The check below is only to satisfy strict
  // typing without a non-null assertion this far into the handler.
  const session = locals.session;
  if (!session) {
    return json({ success: false, error: 'Authentication required.' }, 401);
  }

  // Research-platform-first launch: the contact form is intentionally
  // disabled for this phase (src/lib/launch-config.ts) — checked
  // first, before any parsing/rate-limit/Turnstile work, so no message
  // can ever be submitted while this is false, independent of whatever
  // TURNSTILE_SECRET_KEY happens to be set to.
  if (!CONTACT_FORM_ENABLED) {
    return json(
      { success: false, error: 'The contact form is not yet available. Please check back soon.' },
      503,
    );
  }

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

  // 5. Activation check — Turnstile only now (Resend is no longer part
  // of this route's activation gate; email notification was retired).
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    return json(
      { success: false, error: 'The contact form is not configured in this environment yet.' },
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

  // The database record is the source of truth from here on — inserted
  // under the submitting researcher's own JWT
  // (contact_submissions_insert_own is the real boundary, not this
  // route). A failure here is a genuine, unrecoverable failure (there
  // is nothing else to fall back to now that email is retired).
  const userClient = createUserScopedClient(session.accessToken);
  let submission;
  try {
    submission = await insertContactSubmission(userClient, {
      researcherUserId: session.userId,
      name: data.name,
      email: data.email,
      message: data.message,
    });
  } catch (err) {
    console.error('contact_submissions insert failed:', err instanceof Error ? err.message : err);
    return json({ success: false, error: 'Could not send your message. Please try again.' }, 500);
  }

  // Push notification — best-effort, service-role (fans out to every
  // admin device; never reachable/callable by a client with arbitrary
  // content — see src/lib/push.ts's own header comment). Never blocks
  // or alters the response below; the message is already saved and
  // admin-visible in the dashboard regardless of push delivery.
  try {
    const service = createServiceClient();
    await notifyNewContactSubmission(service, {
      submissionId: submission.id,
      name: data.name,
    });
  } catch (err) {
    console.error(
      'contact-submission push notification failed:',
      err instanceof Error ? err.message : err,
    );
  }

  return json({ success: true }, 200, { 'Set-Cookie': cooldownSetCookieHeader() });
};
