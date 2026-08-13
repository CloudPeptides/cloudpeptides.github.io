/**
 * Public researcher-account registration. Layered defense matching this
 * codebase's established pattern (src/pages/api/auth/login.ts,
 * checkout.ts): same-origin check, body-size limit, Cloudflare rate
 * limit, then full server-side field validation (never trust the
 * client-side form alone).
 *
 * Service-role usage here is deliberate and narrow, not a shortcut:
 * Supabase Auth's signUp() returns `session: null` whenever email
 * confirmation is required (confirmed live against this project —
 * MAILER_AUTOCONFIRM is false) — there is no user JWT to write
 * researcher_profiles/researcher_attestations under RLS as the new
 * user until AFTER they click the verification link. The service
 * client is used for exactly these two inserts, immediately after a
 * successful signUp, and for nothing else. If either insert fails, the
 * just-created auth user is deleted so no orphaned "auth user with no
 * profile" account is ever left behind.
 *
 * Anti-enumeration: whether or not an account already existed for the
 * submitted email, the response is the same generic
 * "check your email" message — mirrors forgot-password.ts's existing
 * posture. A real validation failure (weak password, missing
 * acceptance, malformed email) still returns its own specific error,
 * since none of those reveal account existence.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createAnonClient, createServiceClient, isSameOriginRequest } from '../../../lib/auth';
import { isSingleLineSafe, isValidEmail, sanitizeText } from '../../../lib/form-validation';
import { MIN_PASSWORD_LENGTH } from '../../../lib/password-reset';
import { insertAttestation, insertResearcherProfile } from '../../../lib/researcher';
import { CURRENT_ATTESTATION_VERSIONS } from '../../../lib/researcher-certification';
import { writeAuditLog } from '../../../lib/admin/users';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const GENERIC_SUCCESS =
  'Check your email to verify your account. If an account already existed for that address, you will receive a sign-in link instead.';

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }

  const bodyRead = await readBodyWithLimit(request, 8_192);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `register:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
  }

  const fullName = sanitizeText(input.fullName, 200);
  const email = sanitizeText(input.email, 200);
  const password = typeof input.password === 'string' ? input.password : '';
  const confirmPassword = typeof input.confirmPassword === 'string' ? input.confirmPassword : '';
  const country = sanitizeText(input.country, 100);
  const region = sanitizeText(input.region, 100) || null;
  const researchAffiliation = sanitizeText(input.researchAffiliation, 200);
  const age18 = input.age18 === true;
  const certificationAccepted = input.certificationAccepted === true;

  if (!fullName || !isSingleLineSafe(fullName)) {
    return json({ success: false, error: 'Please enter your full name.' }, 400);
  }
  if (!email || !isValidEmail(email) || !isSingleLineSafe(email)) {
    return json({ success: false, error: 'Please enter a valid email address.' }, 400);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json(
      { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      400,
    );
  }
  if (password !== confirmPassword) {
    return json({ success: false, error: 'Passwords do not match.' }, 400);
  }
  if (!country) {
    return json({ success: false, error: 'Please select your country.' }, 400);
  }
  if (!researchAffiliation) {
    return json({ success: false, error: 'Please enter your research affiliation.' }, 400);
  }
  if (!age18) {
    return json(
      { success: false, error: 'You must confirm that you are at least 18 years old.' },
      400,
    );
  }
  if (!certificationAccepted) {
    return json(
      {
        success: false,
        error:
          'You must agree to the Researcher Certification, Research Use Policy, Terms of Service, and Privacy Policy.',
      },
      400,
    );
  }

  const anonClient = createAnonClient();
  const { data, error } = await anonClient.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${url.origin}/verify-email` },
  });

  if (error) {
    // Weak-password/rate-limit-style errors from Supabase itself are
    // safe to relay (they don't reveal account existence); anything
    // else collapses to the generic message below.
    const message = error.message || '';
    if (/password/i.test(message)) {
      return json({ success: false, error: message }, 400);
    }
    return json({ success: true, message: GENERIC_SUCCESS }, 200);
  }

  // A pre-existing, already-confirmed account: Supabase signUp()
  // returns a masked user (identities: []) rather than erroring, by
  // design, to prevent enumeration — nothing to insert, same generic
  // response either way.
  if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
    return json({ success: true, message: GENERIC_SUCCESS }, 200);
  }

  const service = createServiceClient();
  try {
    await insertResearcherProfile(service, {
      userId: data.user.id,
      fullName,
      country,
      region,
      researchAffiliation,
    });
    await insertAttestation(service, {
      userId: data.user.id,
      versions: CURRENT_ATTESTATION_VERSIONS,
      country,
      region,
      emailVerifiedAtAcceptance: false,
    });
  } catch (err) {
    console.error(
      'registration profile/attestation insert failed:',
      err instanceof Error ? err.message : err,
    );
    try {
      await service.auth.admin.deleteUser(data.user.id);
    } catch (cleanupErr) {
      console.error(
        'registration cleanup (deleteUser) also failed:',
        cleanupErr instanceof Error ? cleanupErr.message : cleanupErr,
      );
    }
    return json(
      { success: false, error: 'Could not complete registration. Please try again.' },
      500,
    );
  }

  try {
    await writeAuditLog(service, {
      actor_user_id: data.user.id,
      action: 'researcher_registration',
      target_table: 'researcher_profiles',
      target_id: data.user.id,
      detail: { email, country, region, research_affiliation: researchAffiliation },
    });
  } catch (err) {
    console.error('registration audit log failed:', err instanceof Error ? err.message : err);
  }

  return json({ success: true, message: GENERIC_SUCCESS }, 200);
};
