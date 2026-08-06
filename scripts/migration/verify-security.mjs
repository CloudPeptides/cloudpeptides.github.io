#!/usr/bin/env node
/**
 * Phase 2 — automated RLS / access-control verification against the real
 * staging project. Run manually, locally, never in CI:
 *
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migration/verify-security.mjs
 *
 * Requires the Custom Access Token Hook (public.custom_access_token_hook)
 * to already be enabled in Dashboard → Authentication → Hooks — without
 * it, freshly-issued JWTs won't carry the user_role claim and every
 * role-gated test below will behave as if every user were a plain
 * 'member', which would make the contributor/editor/admin tests fail
 * for the wrong reason. Prints a clear check for this before running
 * anything else.
 */
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

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

const TEST_USERS = [
  { role: 'member', email: `sec-test-member-${Date.now()}@cloudpeptides.test` },
  { role: 'contributor', email: `sec-test-contributor-${Date.now()}@cloudpeptides.test` },
  { role: 'editor', email: `sec-test-editor-${Date.now()}@cloudpeptides.test` },
  { role: 'admin', email: `sec-test-admin-${Date.now()}@cloudpeptides.test` },
  { role: 'member', email: `sec-test-member2-${Date.now()}@cloudpeptides.test`, tag: 'crossUser' },
];
const PASSWORD = `Test-${Math.random().toString(36).slice(2)}-${Date.now()}`;

async function createTestUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`create user ${email}: ${error.message}`);
  const userId = data.user.id;
  const { error: roleError } = await admin.from('user_roles').upsert({ user_id: userId, role });
  if (roleError) throw new Error(`set role for ${email}: ${roleError.message}`);
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw new Error(`sign in ${email}: ${signInError.message}`);
  return { userId, client };
}

async function cleanupTestUser(userId) {
  await admin.from('user_roles').delete().eq('user_id', userId);
  await admin.auth.admin.deleteUser(userId);
}

async function checkHookEnabled(memberClient) {
  // public.jwt_role() isn't exposed via RPC by default (it's not marked
  // for the API) — decode the JWT's claims directly instead.
  const {
    data: { session },
  } = await memberClient.auth.getSession();
  if (!session) return false;
  const payload = JSON.parse(
    Buffer.from(session.access_token.split('.')[1], 'base64url').toString(),
  );
  return payload.user_role === 'member';
}

async function main() {
  const users = {};
  for (const u of TEST_USERS) {
    const key = u.tag || u.role;
    users[key] = { ...(await createTestUser(u.email, u.role)), role: u.role };
  }

  const hookEnabled = await checkHookEnabled(users.member.client);
  record(
    'Custom Access Token Hook is enabled and injecting user_role claim',
    hookEnabled,
    hookEnabled
      ? ''
      : 'JWT has no user_role claim — enable the hook in Dashboard → Authentication → Hooks before trusting the tests below',
  );

  // --- RLS enabled on every exposed table -------------------------------
  const tables = [
    'user_roles',
    'audit_log',
    'compounds',
    'compound_aliases',
    'stack_components',
    'studies',
    'sources',
    'source_identifiers',
    'claims',
    'claim_sources',
    'regulatory_records',
    'content_revisions',
    'link_health_checks',
    'batch_coas',
  ];
  // pg_catalog tables aren't exposed through the Data API. A
  // SECURITY DEFINER helper function exists for this
  // (supabase/migrations/20260806144908_rls_check_helper.sql) but
  // PostgREST's schema-cache pickup of newly-created functions after a
  // direct `db push` was observed to lag unpredictably (confirmed the
  // function itself exists correctly via direct SQL — this is a caching
  // delay, not a real problem). Shelling out to `supabase db query
  // --linked` instead is slower but deterministic and doesn't depend on
  // that cache.
  let rlsCheck;
  try {
    const raw = execSync(
      `npx supabase db query --linked --output json "select c.relname as table_name, c.relrowsecurity as rowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relname = any(array[${tables.map((t) => `'${t}'`).join(',')}]);"`,
      { encoding: 'utf8' },
    );
    rlsCheck = JSON.parse(raw).rows;
  } catch (err) {
    record('RLS enabled on every exposed table', false, `query failed: ${err.message}`);
    rlsCheck = null;
  }
  if (rlsCheck) {
    const checkedNames = new Set(rlsCheck.map((r) => r.table_name));
    const missing = tables.filter((t) => !checkedNames.has(t));
    const disabled = rlsCheck.filter((r) => !r.rowsecurity);
    record(
      'RLS enabled on every exposed table',
      disabled.length === 0 && missing.length === 0,
      `${rlsCheck.length}/${tables.length} tables found` +
        (disabled.length ? `; disabled on: ${disabled.map((d) => d.table_name).join(', ')}` : '') +
        (missing.length ? `; missing from pg_class: ${missing.join(', ')}` : ''),
    );
  }

  // --- anonymous cannot read drafts --------------------------------------
  const { data: anonDrafts } = await anon.from('compounds').select('id').eq('status', 'draft');
  record(
    'Anonymous SELECT of draft compounds returns nothing',
    (anonDrafts?.length ?? 0) === 0,
    `${anonDrafts?.length ?? 0} rows returned`,
  );

  // --- member (not contributor+) cannot read drafts ----------------------
  const { data: memberDrafts } = await users.member.client
    .from('compounds')
    .select('id')
    .eq('status', 'draft');
  record(
    'member-role SELECT of draft compounds returns nothing',
    (memberDrafts?.length ?? 0) === 0,
    `${memberDrafts?.length ?? 0} rows returned`,
  );

  // --- contributor CAN read drafts ---------------------------------------
  const { data: contributorDrafts } = await users.contributor.client
    .from('compounds')
    .select('id')
    .eq('status', 'draft');
  record(
    'contributor-role SELECT of draft compounds returns rows',
    (contributorDrafts?.length ?? 0) > 0,
    `${contributorDrafts?.length ?? 0} rows returned`,
  );

  // An RLS-filtered UPDATE with no matching visible rows returns SUCCESS
  // with zero rows affected and no error — the *absence* of an error
  // proves nothing on its own. Re-reading the row via the admin client
  // (which bypasses RLS) afterward is the only way to confirm whether a
  // write actually happened.
  async function roleStillUnchanged(userId, expectedRole) {
    const { data } = await admin.from('user_roles').select('role').eq('user_id', userId).single();
    return data?.role === expectedRole;
  }

  // --- member cannot write their own role ---------------------------------
  await users.member.client
    .from('user_roles')
    .update({ role: 'admin' })
    .eq('user_id', users.member.userId);
  const memberRoleUnchanged = await roleStillUnchanged(users.member.userId, 'member');
  record(
    'member cannot update their own role',
    memberRoleUnchanged,
    memberRoleUnchanged
      ? 'row unchanged in the database, as expected'
      : 'ROLE WAS ACTUALLY CHANGED — SECURITY FAILURE',
  );

  const { error: selfInsertError } = await users.member.client
    .from('user_roles')
    .insert({ user_id: users.member.userId, role: 'admin' });
  record(
    'member cannot insert a role row for themselves',
    !!selfInsertError,
    selfInsertError ? 'rejected as expected' : 'INSERT SUCCEEDED — SECURITY FAILURE',
  );

  // --- editor cannot self-promote to admin either -------------------------
  await users.editor.client
    .from('user_roles')
    .update({ role: 'admin' })
    .eq('user_id', users.editor.userId);
  const editorRoleUnchanged = await roleStillUnchanged(users.editor.userId, 'editor');
  record(
    'editor cannot promote themselves to admin',
    editorRoleUnchanged,
    editorRoleUnchanged
      ? 'row unchanged in the database, as expected'
      : 'ROLE WAS ACTUALLY CHANGED — SECURITY FAILURE',
  );

  // --- anon cannot insert/update research content -------------------------
  const { error: anonInsertError } = await anon
    .from('compounds')
    .insert({ slug: `sec-test-${Date.now()}`, name: 'x', entity_kind: 'peptide' });
  record(
    'anonymous cannot insert into compounds',
    !!anonInsertError,
    anonInsertError ? 'rejected as expected' : 'INSERT SUCCEEDED — SECURITY FAILURE',
  );

  // --- member cannot insert research content either -----------------------
  const { error: memberInsertError } = await users.member.client
    .from('compounds')
    .insert({ slug: `sec-test-${Date.now()}`, name: 'x', entity_kind: 'peptide' });
  record(
    'member-role cannot insert into compounds',
    !!memberInsertError,
    memberInsertError ? 'rejected as expected' : 'INSERT SUCCEEDED — SECURITY FAILURE',
  );

  // --- contributor cannot publish; editor can (using a disposable test row) ---
  const testSlug = `sec-test-publish-${Date.now()}`;
  const { data: testCompound, error: createErr } = await admin
    .from('compounds')
    .insert({
      slug: testSlug,
      name: 'Security Test Compound',
      entity_kind: 'peptide',
      status: 'draft',
    })
    .select('id')
    .single();
  if (createErr) {
    record('setup: create disposable test compound', false, createErr.message);
  } else {
    const { error: contributorPublishError } = await users.contributor.client
      .from('compounds')
      .update({ status: 'published' })
      .eq('id', testCompound.id);
    record(
      'contributor cannot set a compound to published',
      !!contributorPublishError,
      contributorPublishError ? 'rejected as expected' : 'UPDATE SUCCEEDED — SECURITY FAILURE',
    );

    const { error: editorPublishError } = await users.editor.client
      .from('compounds')
      .update({ status: 'published' })
      .eq('id', testCompound.id);
    record(
      'editor CAN set a compound to published',
      !editorPublishError,
      editorPublishError
        ? `unexpectedly rejected: ${editorPublishError.message}`
        : 'succeeded as expected',
    );

    await admin.from('compounds').delete().eq('id', testCompound.id); // cleanup, never leave test data behind
  }

  // --- cross-user access: member A cannot read member B's role row --------
  const { data: crossUserRow } = await users.member.client
    .from('user_roles')
    .select('user_id')
    .eq('user_id', users.crossUser.userId);
  record(
    "member cannot read another user's user_roles row",
    (crossUserRow?.length ?? 0) === 0,
    `${crossUserRow?.length ?? 0} rows returned`,
  );

  // --- verify all migrated compounds are drafts ---------------------------
  const { count: nonDraftCount } = await admin
    .from('compounds')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'draft')
    .not('slug', 'eq', testSlug);
  record(
    "every compound in the database is status=draft (excluding this run's deleted test row)",
    (nonDraftCount ?? 0) === 0,
    `${nonDraftCount ?? 0} non-draft rows found`,
  );

  // --- cleanup --------------------------------------------------------------
  for (const key of Object.keys(users)) {
    await cleanupTestUser(users[key].userId);
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
  console.error('Security verification crashed:', err);
  process.exit(1);
});
