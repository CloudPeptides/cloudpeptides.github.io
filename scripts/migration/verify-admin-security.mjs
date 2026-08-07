#!/usr/bin/env node
/**
 * Combined-phase (Supabase auth + admin/editorial dashboard) HTTP-level
 * security verification. Unlike verify-security.mjs (which calls
 * Supabase directly to prove RLS holds), this drives the REAL local
 * server through real HTTP requests — a browser's-eye view of
 * src/middleware.ts, src/pages/api/auth/*, src/pages/api/admin/* —
 * because those application-layer checks (session cookies, the
 * publish-readiness gate, the self-role-change block) don't exist at
 * the database layer at all and can only be proven by actually calling
 * the routes.
 *
 * Proves, against the real staging Supabase project via a locally
 * built+previewed copy of the app:
 *  - unauthenticated requests are rejected by both /admin pages and
 *    /api/admin/* routes
 *  - a 'member' account cannot obtain a dashboard session
 *  - a 'contributor' cannot publish a compound (even one with zero
 *    publish-readiness blockers — isolates the role check from the
 *    content-completeness check)
 *  - an 'editor' CAN publish a fully-cited compound, and the database
 *    reflects it afterward
 *  - only an admin can create users / change roles; a contributor and
 *    an editor are both rejected
 *  - nobody — including an admin — can change their own role
 *
 * Run manually, locally, never in CI (same posture as
 * verify-security.mjs):
 *   node scripts/migration/verify-admin-security.mjs
 *
 * Needs SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in
 * the environment (e.g. sourced from .env.local) — used here only to
 * provision/clean up disposable test fixtures via the service-role
 * client; never sent to the app. Temporarily writes
 * SUPABASE_SERVICE_ROLE_KEY into .dev.vars for the run (the local
 * preview server needs it for /api/admin/users/*, the one route pair
 * that uses it) and restores .dev.vars to its exact prior byte-for-byte
 * content afterward, success or failure — never leaves the secret
 * sitting in that file longer than the run itself.
 */
import fs from 'node:fs';
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

const DEV_VARS_PATH = '.dev.vars';
let originalDevVars = null;

function ensureServiceKeyInDevVars() {
  originalDevVars = fs.existsSync(DEV_VARS_PATH) ? fs.readFileSync(DEV_VARS_PATH, 'utf8') : '';
  const withoutExisting = originalDevVars
    .split('\n')
    .filter((line) => !line.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
    .join('\n');
  fs.writeFileSync(
    DEV_VARS_PATH,
    `${withoutExisting}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}\n`,
  );
}

function restoreDevVars() {
  if (originalDevVars !== null) {
    fs.writeFileSync(DEV_VARS_PATH, originalDevVars);
    originalDevVars = null;
  }
}

const stamp = Date.now();
const TEST_PASSWORD = `Test-${Math.random().toString(36).slice(2)}-${stamp}`;
const TEST_USERS = [
  { role: 'member', email: `sec-admin-member-${stamp}@cloudpeptides.test` },
  { role: 'contributor', email: `sec-admin-contributor-${stamp}@cloudpeptides.test` },
  { role: 'editor', email: `sec-admin-editor-${stamp}@cloudpeptides.test` },
  { role: 'admin', email: `sec-admin-admin-${stamp}@cloudpeptides.test` },
];

async function createTestUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`create user ${email}: ${error.message}`);
  const userId = data.user.id;
  const { error: roleError } = await admin.from('user_roles').upsert({ user_id: userId, role });
  if (roleError) throw new Error(`set role for ${email}: ${roleError.message}`);
  return userId;
}

async function cleanupTestUser(userId) {
  if (!userId) return;
  await admin.from('user_roles').delete().eq('user_id', userId);
  await admin.auth.admin.deleteUser(userId);
}

function extractSessionCookie(headers) {
  const cookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  const names = ['cp-admin-at', 'cp-admin-rt'];
  return cookies
    .map((c) => c.split(';')[0])
    .filter((pair) => names.some((n) => pair.startsWith(`${n}=`)))
    .join('; ');
}

async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  const cookie = extractSessionCookie(response.headers);
  return { status: response.status, body, cookie };
}

async function main() {
  ensureServiceKeyInDevVars();
  const userIds = {};
  let testCompoundId = null;
  let testSourceId = null;
  let createdUserId = null;

  try {
    const baseUrl = await startPreviewServer({ build: true });

    for (const u of TEST_USERS) {
      userIds[u.role] = await createTestUser(u.email, u.role);
    }

    // --- Fixture: a compound ready to publish (one claim, fully cited) --
    const { data: source, error: sourceErr } = await admin
      .from('sources')
      .insert({
        source_type: 'other',
        title: 'Security test source',
        url: `https://example.com/sec-admin-test-${stamp}`,
      })
      .select('id')
      .single();
    if (sourceErr) throw new Error(`create test source: ${sourceErr.message}`);
    testSourceId = source.id;

    const { data: compound, error: compoundErr } = await admin
      .from('compounds')
      .insert({
        slug: `sec-admin-test-${stamp}`,
        name: 'Security Test Compound',
        entity_kind: 'peptide',
        status: 'in_review',
      })
      .select('id')
      .single();
    if (compoundErr) throw new Error(`create test compound: ${compoundErr.message}`);
    testCompoundId = compound.id;

    const { data: claim, error: claimErr } = await admin
      .from('claims')
      .insert({
        compound_id: compound.id,
        content_section: 'summary',
        statement: 'Security-verification test claim.',
        status: 'in_review',
      })
      .select('id')
      .single();
    if (claimErr) throw new Error(`create test claim: ${claimErr.message}`);
    await admin
      .from('claim_sources')
      .insert({ claim_id: claim.id, source_id: source.id, relationship: 'directly_supports' });

    // --- Unauthenticated ---------------------------------------------------
    const anonAdminPage = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
    record(
      'GET /admin with no session redirects to /admin/login',
      anonAdminPage.status === 302 &&
        (anonAdminPage.headers.get('location') || '').includes('/admin/login'),
      `status ${anonAdminPage.status}`,
    );

    const anonApi = await fetch(`${baseUrl}/api/admin/content/compounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: `should-not-exist-${stamp}`,
        name: 'x',
        entity_kind: 'peptide',
      }),
    });
    record(
      'POST /api/admin/content/compounds with no session returns 401',
      anonApi.status === 401,
      `status ${anonApi.status}`,
    );

    const anonUsers = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    record(
      'POST /api/admin/users with no session returns 401',
      anonUsers.status === 401,
      `status ${anonUsers.status}`,
    );

    // --- member: valid credentials, no dashboard access --------------------
    const memberLogin = await login(baseUrl, TEST_USERS[0].email, TEST_PASSWORD);
    record(
      'member login is rejected — valid credentials, but no dashboard access',
      memberLogin.status === 403 && !memberLogin.cookie,
      `status ${memberLogin.status}`,
    );

    // --- contributor: dashboard access, cannot publish ----------------------
    const contributorLogin = await login(baseUrl, TEST_USERS[1].email, TEST_PASSWORD);
    record(
      'contributor login succeeds',
      contributorLogin.status === 200 && Boolean(contributorLogin.cookie),
      `status ${contributorLogin.status}`,
    );

    const contributorDashboard = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: contributorLogin.cookie },
    });
    record(
      'contributor can GET /admin',
      contributorDashboard.status === 200,
      `status ${contributorDashboard.status}`,
    );

    const contributorPublish = await fetch(
      `${baseUrl}/api/admin/compounds/${testCompoundId}/status`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: contributorLogin.cookie },
        body: JSON.stringify({ target_status: 'published' }),
      },
    );
    record(
      'contributor cannot publish a compound (even one with zero content blockers — isolates the role check)',
      contributorPublish.status === 403,
      `status ${contributorPublish.status}`,
    );

    const contributorCreateUser = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: contributorLogin.cookie },
      body: JSON.stringify({
        email: `should-not-exist-${stamp}@cloudpeptides.test`,
        password: 'irrelevant123',
        role: 'member',
      }),
    });
    record(
      'contributor cannot create a user',
      contributorCreateUser.status === 403,
      `status ${contributorCreateUser.status}`,
    );

    // --- editor: CAN publish --------------------------------------------------
    const editorLogin = await login(baseUrl, TEST_USERS[2].email, TEST_PASSWORD);
    record(
      'editor login succeeds',
      editorLogin.status === 200 && Boolean(editorLogin.cookie),
      `status ${editorLogin.status}`,
    );

    const editorPublish = await fetch(`${baseUrl}/api/admin/compounds/${testCompoundId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({ target_status: 'published' }),
    });
    record(
      'editor CAN publish a fully-cited compound',
      editorPublish.status === 200,
      `status ${editorPublish.status}`,
    );

    const { data: publishedCheck } = await admin
      .from('compounds')
      .select('status')
      .eq('id', testCompoundId)
      .single();
    record(
      'compound is actually published in the database afterward',
      publishedCheck?.status === 'published',
      `status column: ${publishedCheck?.status}`,
    );

    const editorCreateUserResp = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({
        email: `should-not-exist-2-${stamp}@cloudpeptides.test`,
        password: 'irrelevant123',
        role: 'member',
      }),
    });
    record(
      'editor (not admin) cannot create a user',
      editorCreateUserResp.status === 403,
      `status ${editorCreateUserResp.status}`,
    );

    // --- admin: user management, self-role-change always blocked -----------
    const adminLogin = await login(baseUrl, TEST_USERS[3].email, TEST_PASSWORD);
    record(
      'admin login succeeds',
      adminLogin.status === 200 && Boolean(adminLogin.cookie),
      `status ${adminLogin.status}`,
    );

    const createUserResp = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        email: `sec-admin-created-${stamp}@cloudpeptides.test`,
        password: 'Sec-Test-Pass-123',
        role: 'member',
      }),
    });
    const createUserBody = await createUserResp.json().catch(() => ({}));
    createdUserId = createUserBody?.data?.id ?? null;
    record(
      'admin can create a user',
      createUserResp.status === 201 && Boolean(createdUserId),
      `status ${createUserResp.status}`,
    );

    if (createdUserId) {
      const roleChangeResp = await fetch(`${baseUrl}/api/admin/users/${createdUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ role: 'editor' }),
      });
      record(
        "admin can change another user's role",
        roleChangeResp.status === 200,
        `status ${roleChangeResp.status}`,
      );
      const { data: roleRow } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', createdUserId)
        .single();
      record(
        'role change actually persisted in the database',
        roleRow?.role === 'editor',
        `role column: ${roleRow?.role}`,
      );
    }

    const selfRoleChangeResp = await fetch(`${baseUrl}/api/admin/users/${userIds.admin}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ role: 'member' }),
    });
    record(
      'admin cannot change their own role (blocks self-elevation and self-demotion alike)',
      selfRoleChangeResp.status === 400,
      `status ${selfRoleChangeResp.status}`,
    );
    const { data: adminRoleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userIds.admin)
      .single();
    record(
      "admin's own role is actually unchanged in the database",
      adminRoleRow?.role === 'admin',
      `role column: ${adminRoleRow?.role}`,
    );
  } finally {
    if (testCompoundId) await admin.from('compounds').delete().eq('id', testCompoundId);
    if (testSourceId) await admin.from('sources').delete().eq('id', testSourceId);
    await cleanupTestUser(createdUserId);
    for (const userId of Object.values(userIds)) {
      await cleanupTestUser(userId);
    }
    stopPreviewServer();
    restoreDevVars();
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
  restoreDevVars();
  console.error('Admin security verification crashed:', err);
  process.exit(1);
});
