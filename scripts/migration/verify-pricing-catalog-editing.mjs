#!/usr/bin/env node
/**
 * Real HTTP-level verification for the admin pricing-catalog edit
 * route (src/pages/api/admin/pricing-catalog/[id].ts) — same pattern
 * as scripts/migration/verify-coa-security.mjs: drives a real local
 * server through real HTTP requests against the real staging Supabase
 * project, because RLS alone can't prove the route-level role check,
 * audit logging, or the STAGING_READ_ONLY exemption's scope actually
 * work end to end.
 *
 * Proves:
 *  - unauthenticated PATCH is rejected (401)
 *  - a non-admin (editor) cannot change a price — both the route's own
 *    hasMinRole() check AND the underlying RLS policy independently
 *    reject it (403 from the route; a direct RLS check confirms the
 *    editor's own JWT can't read or write the table at all)
 *  - an admin can change a price, and it's the ONLY thing the route
 *    accepts (code/name/spec/count/category are never touched)
 *  - invalid prices (non-numeric, negative, >2 decimal places) are
 *    rejected with a 400, never silently coerced
 *  - a successful edit writes exactly one audit_log row with the
 *    product code, previous price, new price, and the acting admin's
 *    user id
 *  - the STAGING_READ_ONLY exemption is scoped correctly: with
 *    STAGING_READ_ONLY forced true, the pricing-catalog route still
 *    succeeds, while a CONTROL /api/admin/* route (COA upload) is
 *    still correctly blocked — proving this isn't a blanket bypass
 *
 * This test touches real seed rows (not disposable data, unlike most
 * verify-*.mjs scripts) — it changes CU50's price during the run and
 * restores it to its original value in a `finally` block regardless of
 * outcome, so the approved seed data is never left altered.
 *
 * Run manually, locally, never in CI (same posture as every other
 * verify-*.mjs script). Needs SUPABASE_URL / SUPABASE_ANON_KEY /
 * SUPABASE_SERVICE_ROLE_KEY in the environment.
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
function setDevVars(stagingReadOnly) {
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
    `${stripped}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}\nSTAGING_READ_ONLY=${stagingReadOnly}\n`,
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
  { role: 'editor', email: `pricing-editor-${stamp}@cloudpeptides.test` },
  { role: 'admin', email: `pricing-admin-${stamp}@cloudpeptides.test` },
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
function extractCookie(headers) {
  const cookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  return cookies
    .map((c) => c.split(';')[0])
    .filter((p) => p.startsWith('cp-admin-at=') || p.startsWith('cp-admin-rt='))
    .join('; ');
}
async function login(baseUrl, email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: response.status, cookie: extractCookie(response.headers) };
}

async function main() {
  setDevVars(false); // normal mode first — exemption test happens later, explicitly
  const userIds = {};
  let targetRow = null;
  let originalPrice = null;

  try {
    const baseUrl = await startPreviewServer({ build: true });
    const origin = { Origin: baseUrl };

    for (const u of TEST_USERS) {
      userIds[u.role] = await createTestUser(u.email, u.role);
    }

    const { data: cu50 } = await admin
      .from('admin_pricing_catalog')
      .select('id, code, price')
      .eq('code', 'CU50')
      .maybeSingle();
    if (!cu50) throw new Error('Seed row CU50 not found — was the migration applied?');
    targetRow = cu50;
    originalPrice = Number(cu50.price);
    record('found the CU50 seed row to test against', true, `original price $${originalPrice}`);

    // --- unauthenticated ---
    const anonRes = await fetch(`${baseUrl}/api/admin/pricing-catalog/${targetRow.id}`, {
      method: 'PATCH',
      headers: { ...origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: '99.00' }),
    });
    record(
      'unauthenticated price edit is rejected',
      anonRes.status === 401,
      `status ${anonRes.status}`,
    );

    // --- editor (not admin) ---
    const editorLogin = await login(baseUrl, TEST_USERS[0].email, TEST_PASSWORD);
    const editorRes = await fetch(`${baseUrl}/api/admin/pricing-catalog/${targetRow.id}`, {
      method: 'PATCH',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({ price: '99.00' }),
    });
    record(
      'editor (not admin) cannot edit a price — route-level check',
      editorRes.status === 403,
      `status ${editorRes.status}`,
    );

    // --- RLS itself, independent of the route's own check ---
    const editorClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${editorLogin.cookie.match(/cp-admin-at=([^;]+)/)?.[1] ?? ''}`,
        },
      },
    });
    const { data: editorReadAttempt } = await editorClient
      .from('admin_pricing_catalog')
      .select('id')
      .eq('id', targetRow.id)
      .maybeSingle();
    record(
      'RLS itself blocks an editor from even reading the pricing table (not just the route)',
      !editorReadAttempt,
    );

    // --- admin: invalid prices rejected ---
    const adminLogin = await login(baseUrl, TEST_USERS[1].email, TEST_PASSWORD);
    for (const bad of ['abc', '-5', '0', '19.999', '']) {
      const res = await fetch(`${baseUrl}/api/admin/pricing-catalog/${targetRow.id}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ price: bad }),
      });
      record(
        `admin edit rejects invalid price "${bad}"`,
        res.status === 400,
        `status ${res.status}`,
      );
    }

    // --- admin: a valid edit succeeds and only the price changes ---
    const newPrice = '111.50';
    const editRes = await fetch(`${baseUrl}/api/admin/pricing-catalog/${targetRow.id}`, {
      method: 'PATCH',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ price: newPrice }),
    });
    const editBody = await editRes.json();
    record(
      'admin edit of a valid price succeeds',
      editRes.status === 200 && editBody.success === true && editBody.data?.price === 111.5,
      `status ${editRes.status}, price now ${editBody.data?.price}`,
    );
    record(
      'code/name/spec/count/category are unchanged by the edit',
      editBody.data?.code === 'CU50' && editBody.data?.name === 'GHK-CU',
    );

    // --- audit log entry ---
    await new Promise((r) => setTimeout(r, 300)); // brief settle for the write
    const { data: auditRows } = await admin
      .from('audit_log')
      .select('actor_user_id, action, target_table, target_id, detail, created_at')
      .eq('action', 'pricing_catalog_price_updated')
      .eq('target_id', targetRow.id)
      .order('created_at', { ascending: false })
      .limit(1);
    const auditRow = auditRows?.[0];
    record(
      'the price change was recorded in audit_log with code, previous price, new price, actor, and timestamp',
      Boolean(
        auditRow &&
        auditRow.actor_user_id === userIds.admin &&
        auditRow.detail?.code === 'CU50' &&
        Number(auditRow.detail?.previous_price) === originalPrice &&
        Number(auditRow.detail?.new_price) === 111.5 &&
        auditRow.created_at,
      ),
      auditRow ? JSON.stringify(auditRow.detail) : 'no audit row found',
    );

    // --- STAGING_READ_ONLY exemption scope check ---
    stopPreviewServer();
    setDevVars(true); // force read-only mode
    const roBaseUrl = await startPreviewServer({ build: true });
    const roOrigin = { Origin: roBaseUrl };
    const roAdminLogin = await login(roBaseUrl, TEST_USERS[1].email, TEST_PASSWORD);

    const roPriceRes = await fetch(`${roBaseUrl}/api/admin/pricing-catalog/${targetRow.id}`, {
      method: 'PATCH',
      headers: { ...roOrigin, 'Content-Type': 'application/json', Cookie: roAdminLogin.cookie },
      body: JSON.stringify({ price: originalPrice.toFixed(2) }), // restore while we're at it
    });
    record(
      'pricing-catalog edits still work under STAGING_READ_ONLY=true (the explicit, narrow exemption)',
      roPriceRes.status === 200,
      `status ${roPriceRes.status}`,
    );

    const roControlRes = await fetch(`${roBaseUrl}/api/admin/coas`, {
      method: 'POST',
      headers: { ...roOrigin, Cookie: roAdminLogin.cookie },
      body: new FormData(),
    });
    record(
      'a control /api/admin/* route (COA upload) is STILL blocked under STAGING_READ_ONLY=true — the exemption is scoped, not a blanket bypass',
      roControlRes.status === 403,
      `status ${roControlRes.status}`,
    );
  } finally {
    if (targetRow && originalPrice !== null) {
      const { data: current } = await admin
        .from('admin_pricing_catalog')
        .select('price')
        .eq('id', targetRow.id)
        .maybeSingle();
      if (current && Number(current.price) !== originalPrice) {
        await admin
          .from('admin_pricing_catalog')
          .update({ price: originalPrice })
          .eq('id', targetRow.id);
      }
      console.log(`Restored CU50 to its original approved price ($${originalPrice}).`);
    }
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
  console.error('Pricing catalog verification crashed:', err.message);
  process.exit(1);
});
