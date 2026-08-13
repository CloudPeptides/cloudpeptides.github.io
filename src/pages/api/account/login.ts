/**
 * Public sign-in — the researcher-account gate's /login page. Same
 * signInWithPassword pattern as src/pages/api/auth/login.ts (admin
 * sign-in), deliberately kept as a SEPARATE route rather than reused:
 * that route hard-rejects anything below 'contributor' (correct for
 * the admin dashboard, wrong here — a 'member'/researcher account must
 * be able to sign in through this one). Suspended researcher accounts
 * are rejected here with a clear message; src/middleware.ts separately
 * re-checks suspension on every request in case an account is
 * suspended mid-session.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  buildSessionCookies,
  createAnonClient,
  createServiceClient,
  isSameOriginRequest,
} from '../../../lib/auth';
import { isSingleLineSafe, isValidEmail, sanitizeText } from '../../../lib/form-validation';
import { getResearcherProfile } from '../../../lib/researcher';
import { checkRateLimit } from '../../../lib/rate-limit';
import { readBodyWithLimit } from '../../../lib/request-limits';
import { verifyTurnstileToken } from '../../../lib/turnstile';

function json(body: unknown, status: number, extraHeaders?: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of extraHeaders ?? []) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOriginRequest(request, url)) {
    return json({ success: false, error: 'Invalid request origin.' }, 403);
  }

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

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `account-login:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many attempts. Please try again shortly.' }, 429);
  }

  // Turnstile — required only once TURNSTILE_SECRET_KEY is actually
  // configured in this environment (unset locally/in CI — this route's
  // own e2e-suite login fixture, tests/e2e/global-setup.ts, calls this
  // endpoint directly with no token at all, which only continues to
  // work because this check is conditional). See register.ts's
  // identical comment for the full reasoning.
  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileToken = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
    if (!turnstileToken) {
      return json({ success: false, error: 'Please complete the verification challenge.' }, 400);
    }
    const verification = await verifyTurnstileToken(env.TURNSTILE_SECRET_KEY, turnstileToken, ip);
    if (!verification.success) {
      return json({ success: false, error: 'Verification failed. Please try again.' }, 400);
    }
  }

  const email = sanitizeText(input.email, 200);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || !password || !isValidEmail(email) || !isSingleLineSafe(email)) {
    return json({ success: false, error: 'Invalid email or password.' }, 400);
  }

  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    const message = /email not confirmed/i.test(error?.message ?? '')
      ? 'Please verify your email address before signing in — check your inbox for the verification link.'
      : 'Invalid email or password.';
    return json({ success: false, error: message }, 401);
  }

  try {
    const service = createServiceClient();
    const profile = await getResearcherProfile(service, data.session.user.id);
    if (profile?.account_status === 'suspended') {
      await client.auth.signOut();
      return json(
        {
          success: false,
          error:
            'This account has been suspended. Contact support if you believe this is an error.',
        },
        403,
      );
    }
  } catch (err) {
    console.error('login suspension check failed:', err instanceof Error ? err.message : err);
  }

  const cookies = buildSessionCookies(
    data.session.access_token,
    data.session.refresh_token,
    url.protocol === 'https:',
  );
  return json({ success: true }, 200, cookies);
};
