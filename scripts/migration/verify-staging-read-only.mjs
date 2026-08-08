#!/usr/bin/env node
/**
 * Proves the shared-database safety boundary (docs/planning/
 * production-cutover-plan.md §1) actually works, with real HTTP
 * requests against a real locally-built-and-previewed copy of the
 * app, talking to the real staging Supabase project — not just unit
 * tests of the pure isStagingReadOnly() helper (those already exist,
 * tests/unit/site-env.test.ts).
 *
 * Complements scripts/migration/verify-admin-security.mjs, which
 * already proves the *default* (STAGING_READ_ONLY unset/"false")
 * behavior — editor CAN publish, admin CAN manage users — so that
 * case is not re-tested here. This script's whole job is proving the
 * opposite: with STAGING_READ_ONLY=true, an editor/admin whose role
 * would otherwise fully authorize the action gets refused anyway.
 *
 * Run manually, locally, never in CI:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migration/verify-staging-read-only.mjs
 *
 * Temporarily writes SUPABASE_SERVICE_ROLE_KEY and STAGING_READ_ONLY=true
 * into .dev.vars for the run only (the local preview server needs both
 * — the former for /api/admin/users/*, the latter to simulate
 * post-cutover staging) and restores .dev.vars to its exact prior
 * content afterward, success or failure.
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

function setDevVars() {
  originalDevVars = fs.existsSync(DEV_VARS_PATH) ? fs.readFileSync(DEV_VARS_PATH, 'utf8') : '';
  const stripped = originalDevVars
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('SUPABASE_SERVICE_ROLE_KEY=') && !line.startsWith('STAGING_READ_ONLY='),
    )
    .join('\n');
  fs.writeFileSync(
    DEV_VARS_PATH,
    `${stripped}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}\nSTAGING_READ_ONLY=true\n`,
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
  { role: 'editor', email: `sec-readonly-editor-${stamp}@cloudpeptides.test` },
  { role: 'admin', email: `sec-readonly-admin-${stamp}@cloudpeptides.test` },
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

// Optional: point every check at a real deployed URL (e.g. the live
// staging Worker, after a real `wrangler deploy` with
// STAGING_READ_ONLY=true) instead of spinning up a local preview
// server against a temporarily-patched .dev.vars. Same checks, same
// assertions — this is what actually proves the flag works in the
// real deployed environment, not just in a local simulation of it.
const LIVE_URL = process.env.LIVE_STAGING_URL;

async function main() {
  if (!LIVE_URL) setDevVars();
  const userIds = {};
  let testCompoundId = null;
  let testSourceId = null;

  try {
    const baseUrl = LIVE_URL ?? (await startPreviewServer({ build: true }));

    for (const u of TEST_USERS) {
      userIds[u.role] = await createTestUser(u.email, u.role);
    }

    // Fixture: a compound that would otherwise be fully publishable
    // (valid claim + citation) — isolates "blocked by read-only mode"
    // from "blocked by missing content," same reasoning as
    // verify-admin-security.mjs's own fixture.
    const { data: source, error: sourceErr } = await admin
      .from('sources')
      .insert({
        source_type: 'other',
        title: 'Read-only verification test source',
        url: `https://example.com/sec-readonly-test-${stamp}`,
      })
      .select('id')
      .single();
    if (sourceErr) throw new Error(`create test source: ${sourceErr.message}`);
    testSourceId = source.id;

    const { data: compound, error: compoundErr } = await admin
      .from('compounds')
      .insert({
        slug: `sec-readonly-test-${stamp}`,
        name: 'Read-Only Verification Test Compound',
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
        statement: 'Read-only verification test claim.',
        status: 'in_review',
      })
      .select('id')
      .single();
    if (claimErr) throw new Error(`create test claim: ${claimErr.message}`);
    await admin
      .from('claim_sources')
      .insert({ claim_id: claim.id, source_id: source.id, relationship: 'directly_supports' });

    // --- editor: fully authorized, still blocked by read-only mode ------
    const editorLogin = await login(baseUrl, TEST_USERS[0].email, TEST_PASSWORD);
    record(
      'editor login still succeeds in read-only mode',
      editorLogin.status === 200 && Boolean(editorLogin.cookie),
    );

    const editorDashboard = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: editorLogin.cookie },
    });
    record(
      'editor can still GET /admin (browsing/viewing is not blocked)',
      editorDashboard.status === 200,
      `status ${editorDashboard.status}`,
    );

    const editorPublish = await fetch(`${baseUrl}/api/admin/compounds/${testCompoundId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({ target_status: 'published' }),
    });
    const editorPublishBody = await editorPublish.json().catch(() => ({}));
    record(
      'editor CANNOT publish in read-only mode, despite otherwise having full authorization',
      editorPublish.status === 403 && /read-only/i.test(editorPublishBody.error ?? ''),
      `status ${editorPublish.status}, error: ${editorPublishBody.error}`,
    );

    const { data: stillInReview } = await admin
      .from('compounds')
      .select('status')
      .eq('id', testCompoundId)
      .single();
    record(
      "compound status is actually unchanged in the database (the block wasn't just cosmetic)",
      stillInReview?.status === 'in_review',
      `status column: ${stillInReview?.status}`,
    );

    const editorContentWrite = await fetch(`${baseUrl}/api/admin/content/compound_aliases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({ compound_id: testCompoundId, alias: 'should-not-be-created' }),
    });
    const editorContentWriteBody = await editorContentWrite.json().catch(() => ({}));
    record(
      'editor cannot write via the generic content route either (/api/admin/content/*)',
      editorContentWrite.status === 403 && /read-only/i.test(editorContentWriteBody.error ?? ''),
      `status ${editorContentWrite.status}`,
    );

    // --- admin: fully authorized, still blocked by read-only mode -------
    const adminLogin = await login(baseUrl, TEST_USERS[1].email, TEST_PASSWORD);
    record(
      'admin login still succeeds in read-only mode',
      adminLogin.status === 200 && Boolean(adminLogin.cookie),
    );

    const adminCreateUser = await fetch(`${baseUrl}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        email: `should-not-be-created-${stamp}@cloudpeptides.test`,
        password: 'irrelevant123',
        role: 'member',
      }),
    });
    const adminCreateUserBody = await adminCreateUser.json().catch(() => ({}));
    record(
      'admin CANNOT create a user in read-only mode, despite otherwise having full authorization',
      adminCreateUser.status === 403 && /read-only/i.test(adminCreateUserBody.error ?? ''),
      `status ${adminCreateUser.status}, error: ${adminCreateUserBody.error}`,
    );

    const adminRoleChange = await fetch(`${baseUrl}/api/admin/users/${userIds.editor}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ role: 'admin' }),
    });
    const adminRoleChangeBody = await adminRoleChange.json().catch(() => ({}));
    record(
      "admin CANNOT change another user's role in read-only mode",
      adminRoleChange.status === 403 && /read-only/i.test(adminRoleChangeBody.error ?? ''),
      `status ${adminRoleChange.status}`,
    );

    const { data: editorRoleUnchanged } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userIds.editor)
      .single();
    record(
      "editor's role is actually unchanged in the database",
      editorRoleUnchanged?.role === 'editor',
      `role column: ${editorRoleUnchanged?.role}`,
    );

    // --- unauthenticated: still 401, not a confusing read-only message --
    const anonWrite = await fetch(`${baseUrl}/api/admin/content/compounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: `x-${stamp}`, name: 'x', entity_kind: 'peptide' }),
    });
    record(
      'unauthenticated requests still get 401 (authentication is checked before read-only mode)',
      anonWrite.status === 401,
      `status ${anonWrite.status}`,
    );
  } finally {
    if (testCompoundId) await admin.from('compounds').delete().eq('id', testCompoundId);
    if (testSourceId) await admin.from('sources').delete().eq('id', testSourceId);
    for (const userId of Object.values(userIds)) {
      await cleanupTestUser(userId);
    }
    if (!LIVE_URL) {
      stopPreviewServer();
      restoreDevVars();
    }
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
  console.error('Read-only verification crashed:', err.message);
  process.exit(1);
});
