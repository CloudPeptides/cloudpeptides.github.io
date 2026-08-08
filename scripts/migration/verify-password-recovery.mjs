#!/usr/bin/env node
/**
 * Real, end-to-end regression test for the admin password-recovery
 * flow (src/lib/password-reset.ts, src/pages/api/auth/
 * forgot-password.ts, reset-password.ts) — same pattern and rationale
 * as scripts/migration/verify-coa-security.mjs: drives the real local
 * server through real HTTP requests, because unit tests alone can't
 * prove the actual Supabase-issued token shape matches what the code
 * expects.
 *
 * This exists because that exact gap shipped a real bug to production
 * once already (2026-08-08): isRecoverySession() assumed amr method
 * "recovery", but real Supabase-issued recovery sessions carry amr
 * method "otp" — every genuine recovery link failed with "invalid or
 * expired" until this was caught by manually diagnosing a live report,
 * not by any test. This script is the permanent guard against that
 * happening again silently.
 *
 * Never touches the real admin account — creates a disposable test
 * user, generates a real recovery link for *that* user via
 * admin.generateLink() (which never sends an email — only
 * resetPasswordForEmail() does, so this never touches the project's
 * tight mailer quota), extracts the real access/refresh token pair
 * from the link's actual redirect (exactly what a browser would
 * receive — no fabrication), and POSTs it to the real local server's
 * POST /api/auth/reset-password. Confirms the new password actually
 * authenticates, then deletes the disposable user.
 *
 * Run manually, locally, never in CI (same posture as the other
 * verify-*.mjs scripts in this directory):
 *   node scripts/migration/verify-password-recovery.mjs
 *
 * Needs SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in
 * the environment. Does NOT need STAGING_READ_ONLY handling —
 * /api/auth/reset-password is not under /api/admin/*, so it's
 * unaffected by that boundary (confirmed against src/middleware.ts's
 * own isProtectedAdminApi()).
 */
import { createClient } from '@supabase/supabase-js';
import { startPreviewServer, stopPreviewServer } from '../lib/preview-server.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}

const stamp = Date.now();
const TEST_EMAIL = `pw-recovery-test-${stamp}@cloudpeptides.test`;
const TEST_PASSWORD = `Original-${Math.random().toString(36).slice(2)}-${stamp}`;
const NEW_PASSWORD = `Recovered-${Math.random().toString(36).slice(2)}-${stamp}`;

async function main() {
  let userId = null;
  try {
    const baseUrl = await startPreviewServer({ build: true });
    const origin = { Origin: baseUrl };

    const { data: createData, error: createErr } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (createErr) throw new Error(`create test user: ${createErr.message}`);
    userId = createData.user.id;

    // --- generate a REAL recovery link (no email sent) ---
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: TEST_EMAIL,
      options: { redirectTo: `${baseUrl}/admin/reset-password` },
    });
    if (linkErr) throw new Error(`generateLink: ${linkErr.message}`);

    // --- follow it exactly as a browser would, to get the real token pair ---
    const followRes = await fetch(linkData.properties.action_link, { redirect: 'manual' });
    const location = followRes.headers.get('location');
    record(
      'the recovery link redirects with a real access/refresh token pair',
      Boolean(location && location.includes('access_token=')),
      location ? '' : 'no Location header at all',
    );
    if (!location) throw new Error('cannot continue without a redirect Location');

    const redirectUrl = new URL(location);
    const hashParams = new URLSearchParams(redirectUrl.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    record(
      'both access_token and refresh_token are present in the fragment',
      Boolean(accessToken && refreshToken),
    );

    // --- this is the actual regression check: does the real code path accept it? ---
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        password: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      }),
    });
    const resetBody = await resetRes.json().catch(() => ({}));
    record(
      'POST /api/auth/reset-password accepts a genuine Supabase recovery session',
      resetRes.status === 200 && resetBody.success === true,
      `status ${resetRes.status}, body: ${JSON.stringify(resetBody)}`,
    );

    // --- prove the password actually changed ---
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInErr } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: NEW_PASSWORD,
    });
    record(
      'the new password actually authenticates',
      Boolean(signInData?.session) && !signInErr,
      signInErr?.message,
    );
    if (signInData?.session) await anon.auth.signOut();

    // --- the recovery session itself must no longer be usable (signed out server-side) ---
    const reuseRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        refreshToken,
        password: `${NEW_PASSWORD}-again`,
        confirmPassword: `${NEW_PASSWORD}-again`,
      }),
    });
    record(
      'the same recovery token pair cannot be replayed a second time',
      reuseRes.status !== 200,
      `status ${reuseRes.status}`,
    );
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
      console.log('Cleaned up: deleted disposable test user.');
    }
    stopPreviewServer();
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Password-recovery verification crashed:', err.message);
  process.exit(1);
});
