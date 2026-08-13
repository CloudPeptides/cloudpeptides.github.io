/**
 * Records a Researcher Certification acceptance — both the initial
 * certification right after email verification, and any later renewal
 * (a materially updated certification, or an admin-required
 * recertification). Requires a session (src/middleware.ts already
 * guarantees one reaches this route at all — /certify and this route
 * are the one deliberate exemption from the *certification* check
 * itself, not from the session requirement).
 *
 * Uses the caller's own user-scoped client — unlike registration, a
 * verified session already exists by the time this route runs, so
 * there's no need for (and no use of) the service-role client here;
 * RLS's own `user_id = auth.uid()` policies are the real boundary.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createUserScopedClient, isSameOriginRequest } from '../../../lib/auth';
import { isSingleLineSafe, sanitizeText } from '../../../lib/form-validation';
import {
  getResearcherProfile,
  insertAttestation,
  insertResearcherProfile,
} from '../../../lib/researcher';
import { CURRENT_ATTESTATION_VERSIONS } from '../../../lib/researcher-certification';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';

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

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `certify:${session.userId}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
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

  if (input.certificationAccepted !== true) {
    return json(
      {
        success: false,
        error:
          'You must agree to the Researcher Certification, Research Use Policy, Terms of Service, and Privacy Policy.',
      },
      400,
    );
  }

  const client = createUserScopedClient(session.accessToken);

  const profile = await getResearcherProfile(client, session.userId);
  let country = profile?.country ?? null;
  let region = profile?.region ?? null;

  // Legacy/edge case: a 'member' account with no researcher_profiles
  // row at all (e.g. created before this gate existed, or created
  // directly by an admin) — collect the same minimum profile fields
  // registration would have, rather than silently certifying an
  // account with no profile on record.
  if (!profile) {
    const fullName = sanitizeText(input.fullName, 200);
    const submittedCountry = sanitizeText(input.country, 100);
    const region2 = sanitizeText(input.region, 100) || null;
    const researchAffiliation = sanitizeText(input.researchAffiliation, 200);
    if (!fullName || !isSingleLineSafe(fullName)) {
      return json({ success: false, error: 'Please enter your full name.' }, 400);
    }
    if (!submittedCountry) {
      return json({ success: false, error: 'Please select your country.' }, 400);
    }
    if (!researchAffiliation) {
      return json({ success: false, error: 'Please enter your research affiliation.' }, 400);
    }
    await insertResearcherProfile(client, {
      userId: session.userId,
      fullName,
      country: submittedCountry,
      region: region2,
      researchAffiliation,
    });
    country = submittedCountry;
    region = region2;
  }

  let emailVerifiedAtAcceptance = false;
  try {
    const { data } = await client.auth.getUser();
    emailVerifiedAtAcceptance = Boolean(data.user?.email_confirmed_at);
  } catch {
    // Best-effort — a failure here just records `false`, never blocks
    // the certification itself.
  }

  try {
    await insertAttestation(client, {
      userId: session.userId,
      versions: CURRENT_ATTESTATION_VERSIONS,
      country: country ?? 'Unknown',
      region,
      emailVerifiedAtAcceptance,
    });
  } catch (err) {
    console.error('certification insert failed:', err instanceof Error ? err.message : err);
    return json(
      { success: false, error: 'Could not record your certification. Please try again.' },
      500,
    );
  }

  return json({ success: true }, 200);
};
