#!/usr/bin/env node
/**
 * HTTP-level security verification for the COA admin routes
 * (src/pages/api/admin/coas/*) — same pattern and rationale as
 * scripts/migration/verify-admin-security.mjs: drives the real local
 * server through real HTTP requests against the real staging Supabase
 * project, because RLS alone can't prove the route-level role checks,
 * file-type validation, or the public-gallery visibility boundary
 * actually work end to end.
 *
 * Proves:
 *  - unauthenticated POST /api/admin/coas is rejected (401)
 *  - a non-admin (editor) cannot create/publish a COA (403)
 *  - an admin can upload a real PDF and it's created as a draft
 *  - a draft COA is invisible to the anon client (public gallery query)
 *  - once published by an admin, it becomes visible to anon
 *  - a file that lies about its type (SVG bytes, declared as a PDF) is
 *    rejected — the real security boundary is the byte-signature
 *    sniff (src/lib/coa-file-validation.ts), not the declared MIME type
 *  - archiving removes it from the public gallery again
 *  - every successful write (create, edit, publish, unpublish,
 *    archive, restore, file replace) produces exactly one audit_log
 *    row with the correct actor, action, COA id, product name/SKU,
 *    and old/new field diff — and never contains file bytes, signed
 *    URLs, or credentials (src/lib/admin/coa-audit.ts)
 *
 * Run manually, locally, never in CI (same posture as
 * verify-admin-security.mjs):
 *   node scripts/migration/verify-coa-security.mjs
 *
 * Needs SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in
 * the environment. Temporarily writes SUPABASE_SERVICE_ROLE_KEY into
 * .dev.vars for the run (restored byte-for-byte afterward) — same
 * mechanism as every other verify-*.mjs script in this directory.
 *
 * Every request below sends an explicit Origin header matching baseUrl
 * — found live (not assumed) that Astro's own built-in CSRF protection
 * (security.checkOrigin) rejects any multipart/form-data or
 * x-www-form-urlencoded POST/PATCH with a missing/mismatched Origin
 * header with a 403 "Cross-site POST form submissions are forbidden",
 * before this app's own middleware/route code ever runs — invisible in
 * a real browser (which always sends Origin) or in the Playwright e2e
 * suite (same reason), but Node's bare `fetch()` does not set one by
 * default, which produced confusing 403s in place of the real 401/403s
 * this script is actually trying to prove.
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
  // STAGING_READ_ONLY explicitly forced to "false" for this run — found
  // live that wrangler.jsonc's own `vars.STAGING_READ_ONLY` (currently
  // "true", set for the real post-cutover deployment) is otherwise
  // inherited by a local `astro preview` server by default, which
  // would make every admin COA write below fail with "This deployment
  // is read-only" regardless of role. This script's whole purpose is
  // verifying the COA feature's own authorization/file-validation
  // logic, not the staging-read-only boundary — that's
  // verify-staging-read-only.mjs's job, and it deliberately does the
  // opposite (forces STAGING_READ_ONLY=true) for exactly that reason.
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
  { role: 'editor', email: `sec-coa-editor-${stamp}@cloudpeptides.test` },
  { role: 'admin', email: `sec-coa-admin-${stamp}@cloudpeptides.test` },
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

// A genuinely valid, minimal 1x1 PDF — real magic bytes, not a stub.
const REAL_PDF_BYTES = new TextEncoder().encode(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>',
);
// SVG bytes, but we'll declare them as application/pdf — the
// signature sniff must reject this regardless of the declared type.
const FAKE_SVG_BYTES = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

function buildUploadForm(bytes, mimeType, filename) {
  const form = new FormData();
  form.set('peptide_name', `Security Test Peptide ${stamp}`);
  form.set('testing_lab', 'Security Test Lab');
  form.set('test_date', '2026-08-08');
  form.set('file', new Blob([bytes], { type: mimeType }), filename);
  return form;
}

// A second, real PDF for the file-replace test — different bytes so
// the audit diff's old/new file metadata is genuinely different, not
// coincidentally identical.
const REAL_PDF_BYTES_V2 = new TextEncoder().encode(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 1>>endobj\ntrailer<</Root 1 0 R>>',
);

/** Most recent audit_log row for this COA + action, read via the
 * service-role client (audit_log has no client-readable RLS policy at
 * all for a non-admin, and this script's own admin test user's JWT
 * would work too, but service-role keeps this assertion independent
 * of the RLS path under test elsewhere). */
async function getAuditEntry(coaId, action) {
  const { data } = await admin
    .from('audit_log')
    .select('*')
    .eq('target_table', 'batch_coas')
    .eq('target_id', coaId)
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Scans a JSON-serializable value for anything that looks like a
 * credential, JWT, or signed URL — audit_log.detail must never carry
 * any of these regardless of which field it ended up in. */
function containsSecretLikeValue(value) {
  const text = JSON.stringify(value ?? {});
  const patterns = [
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // JWT shape
    /token=/i,
    /signature=/i,
    /\/storage\/v1\/object\/sign\//i, // Supabase signed-URL path shape
    SERVICE_ROLE_KEY,
  ];
  return patterns.some((p) => (p instanceof RegExp ? p.test(text) : text.includes(p)));
}

async function main() {
  setDevVars();
  const userIds = {};
  let coaId = null;

  try {
    const baseUrl = await startPreviewServer({ build: true });

    for (const u of TEST_USERS) {
      userIds[u.role] = await createTestUser(u.email, u.role);
    }

    const origin = { Origin: baseUrl };

    // --- unauthenticated ---
    const anonRes = await fetch(`${baseUrl}/api/admin/coas`, {
      method: 'POST',
      headers: origin,
      body: new FormData(),
    });
    record(
      'unauthenticated upload is rejected',
      anonRes.status === 401,
      `status ${anonRes.status}`,
    );

    // --- editor (not admin) ---
    const editorLogin = await login(baseUrl, TEST_USERS[0].email, TEST_PASSWORD);
    const editorUploadRes = await fetch(`${baseUrl}/api/admin/coas`, {
      method: 'POST',
      headers: { ...origin, Cookie: editorLogin.cookie },
      body: buildUploadForm(REAL_PDF_BYTES, 'application/pdf', 'test.pdf'),
    });
    record(
      'editor (not admin) cannot upload a COA',
      editorUploadRes.status === 403,
      `status ${editorUploadRes.status}`,
    );

    // --- admin: reject a file that lies about its type ---
    const adminLogin = await login(baseUrl, TEST_USERS[1].email, TEST_PASSWORD);
    const fakeFileRes = await fetch(`${baseUrl}/api/admin/coas`, {
      method: 'POST',
      headers: { ...origin, Cookie: adminLogin.cookie },
      body: buildUploadForm(FAKE_SVG_BYTES, 'application/pdf', 'fake.pdf'),
    });
    const fakeFileBody = await fakeFileRes.json().catch(() => ({}));
    record(
      'admin upload of SVG bytes declared as application/pdf is rejected (real signature sniff, not declared type)',
      fakeFileRes.status === 400,
      `status ${fakeFileRes.status}, error: ${fakeFileBody.error}`,
    );

    // --- admin: real upload succeeds, created as draft ---
    const uploadRes = await fetch(`${baseUrl}/api/admin/coas`, {
      method: 'POST',
      headers: { ...origin, Cookie: adminLogin.cookie },
      body: buildUploadForm(REAL_PDF_BYTES, 'application/pdf', 'real.pdf'),
    });
    const uploadBody = await uploadRes.json().catch(() => ({}));
    record(
      'admin upload of a real PDF succeeds and is created as draft',
      uploadRes.status === 201 && uploadBody.data?.status === 'draft',
      `status ${uploadRes.status}, row status: ${uploadBody.data?.status}`,
    );
    coaId = uploadBody.data?.id ?? null;

    if (coaId) {
      // --- audit: create ---
      const createAudit = await getAuditEntry(coaId, 'coa_created');
      record('coa_created audit_log entry exists', Boolean(createAudit));
      record('coa_created records the correct actor', createAudit?.actor_user_id === userIds.admin);
      record(
        'coa_created detail has no secret-like values',
        createAudit && !containsSecretLikeValue(createAudit.detail),
      );

      // --- draft is invisible to anon ---
      const { data: anonDraftCheck } = await anon
        .from('batch_coas')
        .select('id')
        .eq('id', coaId)
        .maybeSingle();
      record('a draft COA is invisible to the anon client (public gallery query)', !anonDraftCheck);

      // --- link to a real product (test setup via service-role, not
      // the audited action itself — proves the audit log correctly
      // resolves product name/SKU once one exists) ---
      const { data: anyProduct } = await admin
        .from('shop_products')
        .select('id, code, name')
        .limit(1)
        .maybeSingle();
      if (anyProduct) {
        await admin.from('batch_coas').update({ product_id: anyProduct.id }).eq('id', coaId);
      }

      // --- audit: metadata edit ---
      const editRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ batch_identifier: `AUDIT-TEST-${stamp}`, testing_method: 'HPLC' }),
      });
      record('admin can edit COA metadata', editRes.status === 200, `status ${editRes.status}`);
      const editAudit = await getAuditEntry(coaId, 'coa_updated');
      record('coa_updated audit_log entry exists', Boolean(editAudit));
      record(
        'coa_updated records old/new values for changed fields',
        editAudit?.detail?.changes?.batch_identifier?.new === `AUDIT-TEST-${stamp}` &&
          editAudit?.detail?.changes?.testing_method?.new === 'HPLC' &&
          editAudit?.detail?.changes?.testing_method?.old === null,
      );
      if (anyProduct) {
        record(
          'coa_updated records the linked product SKU',
          editAudit?.detail?.product_sku === anyProduct.code,
        );
      }
      record(
        'coa_updated detail has no secret-like values',
        editAudit && !containsSecretLikeValue(editAudit.detail),
      );

      // --- publish ---
      const publishRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ status: 'published' }),
      });
      record('admin can publish the COA', publishRes.status === 200, `status ${publishRes.status}`);

      // --- now visible to anon ---
      const { data: anonPublishedCheck } = await anon
        .from('batch_coas')
        .select('id, status')
        .eq('id', coaId)
        .maybeSingle();
      record(
        'once published, the COA is visible to the anon client',
        anonPublishedCheck?.status === 'published',
      );

      // --- audit: publish ---
      const publishAudit = await getAuditEntry(coaId, 'coa_published');
      record('coa_published audit_log entry exists', Boolean(publishAudit));
      record(
        'coa_published records old/new status',
        publishAudit?.detail?.changes?.status?.old === 'draft' &&
          publishAudit?.detail?.changes?.status?.new === 'published',
      );

      // --- unpublish ---
      const unpublishRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ status: 'draft' }),
      });
      record('admin can unpublish the COA', unpublishRes.status === 200);
      const unpublishAudit = await getAuditEntry(coaId, 'coa_unpublished');
      record('coa_unpublished audit_log entry exists', Boolean(unpublishAudit));

      // --- file replace ---
      const replaceForm = new FormData();
      replaceForm.set('file', new Blob([REAL_PDF_BYTES_V2], { type: 'application/pdf' }), 'v2.pdf');
      const replaceRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}/file`, {
        method: 'POST',
        headers: { ...origin, Cookie: adminLogin.cookie },
        body: replaceForm,
      });
      record(
        'admin can replace the COA file',
        replaceRes.status === 200,
        `status ${replaceRes.status}`,
      );
      const replaceAudit = await getAuditEntry(coaId, 'coa_file_replaced');
      record('coa_file_replaced audit_log entry exists', Boolean(replaceAudit));
      record(
        'coa_file_replaced records old/new filename, not file bytes',
        replaceAudit?.detail?.changes?.original_filename?.new === 'v2.pdf',
      );
      record(
        'coa_file_replaced detail has no secret-like values (and no signed URL, no raw bytes)',
        replaceAudit && !containsSecretLikeValue(replaceAudit.detail),
      );

      // --- editor still cannot modify it ---
      const editorPatchRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: editorLogin.cookie },
        body: JSON.stringify({ status: 'archived' }),
      });
      record(
        'editor (not admin) cannot change COA status',
        editorPatchRes.status === 403,
        `status ${editorPatchRes.status}`,
      );

      // --- archive removes it from public view again ---
      const archiveRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ status: 'archived' }),
      });
      record('admin can archive the COA', archiveRes.status === 200, `status ${archiveRes.status}`);
      const { data: anonArchivedCheck } = await anon
        .from('batch_coas')
        .select('id')
        .eq('id', coaId)
        .maybeSingle();
      record('an archived COA is invisible to the anon client again', !anonArchivedCheck);
      const archiveAudit = await getAuditEntry(coaId, 'coa_archived');
      record('coa_archived audit_log entry exists', Boolean(archiveAudit));

      // --- restore ---
      const restoreRes = await fetch(`${baseUrl}/api/admin/coas/${coaId}`, {
        method: 'PATCH',
        headers: { ...origin, 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ status: 'draft' }),
      });
      record('admin can restore an archived COA to draft', restoreRes.status === 200);
      const restoreAudit = await getAuditEntry(coaId, 'coa_restored');
      record('coa_restored audit_log entry exists', Boolean(restoreAudit));

      // --- anon cannot read audit_log at all (RLS: admin-only select,
      // no policy grants anon/non-admin authenticated any access) ---
      const { data: anonAuditRead, error: anonAuditErr } = await anon
        .from('audit_log')
        .select('id')
        .eq('target_id', coaId);
      record(
        'anon client cannot read audit_log rows',
        (anonAuditRead ?? []).length === 0 || Boolean(anonAuditErr),
      );
    }
  } finally {
    if (coaId) {
      const { data: row } = await admin
        .from('batch_coas')
        .select('file_path')
        .eq('id', coaId)
        .maybeSingle();
      if (row?.file_path) await admin.storage.from('coa-documents').remove([row.file_path]);
      await admin.from('batch_coas').delete().eq('id', coaId);
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
  console.error('COA security verification crashed:', err.message);
  process.exit(1);
});
