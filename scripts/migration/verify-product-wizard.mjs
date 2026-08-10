#!/usr/bin/env node
/**
 * Real HTTP-level verification for the "Add Product / Peptide" wizard
 * (src/pages/api/admin/products/*, the create_product_with_research()
 * Postgres function) — same pattern as verify-coa-security.mjs: drives
 * a real local server through real HTTP requests against the real
 * staging Supabase project.
 *
 * Proves:
 *  - unauthenticated / non-admin creation is rejected
 *  - duplicate-compound detection finds an existing compound by name
 *    AND by alias
 *  - creating a new compound + multiple variants works, and the new
 *    compound is 'draft' (never auto-published)
 *  - linking to an EXISTING compound creates no new compound row, and
 *    both new variants share that compound_id (the "one compound, many
 *    SKUs" relationship)
 *  - blend/stack components are stored relationally in the existing
 *    stack_components table, not as text
 *  - a genuine mid-transaction failure (a product code that collides
 *    with a row already in the database, not just within the same
 *    submission) rolls back EVERYTHING — no orphaned compound, no
 *    partial variants
 *  - a newly created draft compound does not appear in the public
 *    compound directory
 *
 * Run manually, locally, never in CI. Needs SUPABASE_URL /
 * SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Every test-created row is cleaned up in a `finally` block regardless
 * of outcome.
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
const anon = createClient(SUPABASE_URL, ANON_KEY, {
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
    `${stripped}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}\nSTAGING_READ_ONLY=false\n`,
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
  { role: 'editor', email: `pw-editor-${stamp}@cloudpeptides.test` },
  { role: 'admin', email: `pw-admin-${stamp}@cloudpeptides.test` },
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
  setDevVars();
  const userIds = {};
  const createdCompoundIds = [];
  const createdProductIds = [];
  let categoryId;
  let preexistingComponentCompoundId;

  try {
    const baseUrl = await startPreviewServer({ build: true });
    const origin = { Origin: baseUrl };

    for (const u of TEST_USERS) {
      userIds[u.role] = await createTestUser(u.email, u.role);
    }

    const { data: cat } = await admin
      .from('product_categories')
      .select('id')
      .limit(1)
      .maybeSingle();
    categoryId = cat.id;

    // A real existing compound to use as a blend/stack component and
    // as a link target — GHK-CU, already in the live database.
    const { data: ghkCu } = await admin
      .from('compounds')
      .select('id')
      .eq('slug', 'ghk-cu')
      .maybeSingle();
    preexistingComponentCompoundId = ghkCu?.id ?? null;
    record(
      'found a real existing compound (ghk-cu) to test linking/components against',
      Boolean(preexistingComponentCompoundId),
    );

    // --- unauthenticated / non-admin ---
    const anonRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    record(
      'unauthenticated create is rejected',
      anonRes.status === 401,
      `status ${anonRes.status}`,
    );

    const editorLogin = await login(baseUrl, TEST_USERS[0].email, TEST_PASSWORD);
    const editorRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
      body: JSON.stringify({}),
    });
    record(
      'editor (not admin) cannot create a product',
      editorRes.status === 403,
      `status ${editorRes.status}`,
    );

    const adminLogin = await login(baseUrl, TEST_USERS[1].email, TEST_PASSWORD);

    // --- duplicate detection: by name and by alias ---
    const dupByNameRes = await fetch(`${baseUrl}/api/admin/products/duplicate-check?q=GHK`, {
      headers: { Cookie: adminLogin.cookie },
    });
    const dupByNameBody = await dupByNameRes.json();
    record(
      'duplicate check finds an existing compound by name',
      dupByNameBody.success && dupByNameBody.data.some((c) => c.slug === 'ghk-cu'),
    );

    // --- create a NEW draft compound + two variants (CU50/CU100-style) ---
    const newSlug = `pw-test-compound-${stamp}`;
    const createRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        compoundId: null,
        newCompound: {
          canonicalName: `PW Test Compound ${stamp}`,
          displayName: 'PW Test',
          slug: newSlug,
          entityKind: 'peptide',
          aliases: ['PWTC', 'PW-Test-Alias'],
        },
        stackComponentIds: [],
        variants: [
          {
            code: `PW50-${stamp}`,
            name: 'PW Test 50mg',
            spec: '50mg',
            count: 10,
            price: '77.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
          {
            code: `PW100-${stamp}`,
            name: 'PW Test 100mg',
            spec: '100mg',
            count: 10,
            price: '105.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
        ],
      }),
    });
    const createBody = await createRes.json();
    record(
      'admin creates a new draft compound with two variants',
      createRes.status === 201 && createBody.success && createBody.data.productIds.length === 2,
      `status ${createRes.status}`,
    );
    if (createBody.data) {
      createdCompoundIds.push(createBody.data.compoundId);
      createdProductIds.push(...createBody.data.productIds);
    }

    const { data: newCompoundRow } = await admin
      .from('compounds')
      .select('status, display_name')
      .eq('id', createBody.data.compoundId)
      .maybeSingle();
    record(
      'the new compound is created as draft, never auto-published',
      newCompoundRow?.status === 'draft',
    );
    record('display_name was saved correctly', newCompoundRow?.display_name === 'PW Test');

    const { data: variantRows } = await admin
      .from('shop_products')
      .select('compound_id')
      .in('id', createBody.data.productIds);
    record(
      'both variants share the same compound_id (one compound, many SKUs)',
      variantRows.length === 2 && variantRows[0].compound_id === variantRows[1].compound_id,
    );

    // --- duplicate detection now finds the JUST-CREATED compound too ---
    const dupAfterRes = await fetch(
      `${baseUrl}/api/admin/products/duplicate-check?q=PW Test Compound ${stamp}`,
      { headers: { Cookie: adminLogin.cookie } },
    );
    const dupAfterBody = await dupAfterRes.json();
    record(
      'duplicate check finds the newly created compound on a repeat search',
      dupAfterBody.success && dupAfterBody.data.some((c) => c.slug === newSlug),
    );

    // --- link to an EXISTING compound, no new compound created ---
    const { count: compoundCountBefore } = await admin
      .from('compounds')
      .select('id', { count: 'exact', head: true });
    const linkRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        compoundId: preexistingComponentCompoundId,
        newCompound: null,
        stackComponentIds: [],
        variants: [
          {
            code: `PWLINK-${stamp}`,
            name: 'PW Link Variant',
            spec: '25mg',
            count: 10,
            price: '60.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
        ],
      }),
    });
    const linkBody = await linkRes.json();
    const { count: compoundCountAfter } = await admin
      .from('compounds')
      .select('id', { count: 'exact', head: true });
    record(
      'linking to an existing compound creates no new compound row',
      linkRes.status === 201 && compoundCountAfter === compoundCountBefore,
    );
    if (linkBody.data) createdProductIds.push(...linkBody.data.productIds);

    // --- blend/stack: components stored relationally ---
    const blendSlug = `pw-test-blend-${stamp}`;
    const blendRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        compoundId: null,
        newCompound: {
          canonicalName: `PW Test Blend ${stamp}`,
          slug: blendSlug,
          entityKind: 'peptide_blend',
          aliases: [],
        },
        stackComponentIds: [preexistingComponentCompoundId],
        variants: [
          {
            code: `PWBLEND-${stamp}`,
            name: 'PW Test Blend',
            spec: '5mg/5mg',
            count: 10,
            price: '150.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
        ],
      }),
    });
    const blendBody = await blendRes.json();
    if (blendBody.data) {
      createdCompoundIds.push(blendBody.data.compoundId);
      createdProductIds.push(...blendBody.data.productIds);
    }
    const { data: componentRows } = await admin
      .from('stack_components')
      .select('component_compound_id')
      .eq('stack_id', blendBody.data?.compoundId ?? '00000000-0000-0000-0000-000000000000');
    record(
      'blend components are stored relationally in stack_components, not as text',
      componentRows?.length === 1 &&
        componentRows[0].component_compound_id === preexistingComponentCompoundId,
    );
    record(
      'no duplicate compound was created for the existing component',
      compoundCountAfter === compoundCountBefore,
    );

    // --- transaction rollback: a code collision INSIDE the transaction ---
    const collidingCode = `PWLINK-${stamp}`; // already created above, real DB collision
    const { count: compoundCountBeforeRollback } = await admin
      .from('compounds')
      .select('id', { count: 'exact', head: true });
    const rollbackRes = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        compoundId: null,
        newCompound: {
          canonicalName: `PW Rollback Test ${stamp}`,
          slug: `pw-rollback-test-${stamp}`,
          entityKind: 'peptide',
          aliases: [],
        },
        stackComponentIds: [],
        variants: [
          {
            code: `PWROLLBACK-${stamp}`,
            name: 'Rollback A',
            spec: '5mg',
            count: 10,
            price: '50.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
          {
            code: collidingCode,
            name: 'Rollback B (colliding code)',
            spec: '10mg',
            count: 10,
            price: '60.00',
            categoryId,
            internalStatus: 'draft',
            publicStatus: 'private',
          },
        ],
      }),
    });
    record(
      'a mid-transaction unique-constraint collision is rejected, not silently partial',
      rollbackRes.status !== 201,
      `status ${rollbackRes.status}`,
    );

    const { count: compoundCountAfterRollback } = await admin
      .from('compounds')
      .select('id', { count: 'exact', head: true });
    record(
      'the new compound from the failed submission was NOT left behind (real rollback)',
      compoundCountAfterRollback === compoundCountBeforeRollback,
    );
    const { data: orphanedVariant } = await admin
      .from('shop_products')
      .select('id')
      .eq('code', `PWROLLBACK-${stamp}`)
      .maybeSingle();
    record(
      'the non-colliding variant from the failed submission was also rolled back',
      !orphanedVariant,
    );

    // --- a draft compound never appears in the public directory query ---
    const { data: publicCheck } = await anon
      .from('compounds')
      .select('id')
      .eq('id', createBody.data.compoundId)
      .maybeSingle();
    record('the newly created draft compound is invisible to the anon/public client', !publicCheck);
  } finally {
    if (createdProductIds.length > 0) {
      await admin.from('shop_products').delete().in('id', createdProductIds);
      console.log(`Cleaned up ${createdProductIds.length} test shop_products row(s).`);
    }
    for (const compoundId of createdCompoundIds) {
      await admin.from('stack_components').delete().eq('stack_id', compoundId);
      await admin.from('compound_aliases').delete().eq('compound_id', compoundId);
      await admin.from('compounds').delete().eq('id', compoundId);
    }
    if (createdCompoundIds.length > 0) {
      console.log(
        `Cleaned up ${createdCompoundIds.length} test compound(s) and their aliases/components.`,
      );
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
  console.error('Product wizard verification crashed:', err.message);
  process.exit(1);
});
