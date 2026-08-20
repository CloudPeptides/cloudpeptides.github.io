#!/usr/bin/env node
/**
 * RLS + idempotency + research-integrity verification for the
 * 2026-08-19 batch (admin PWA/push, order requests, 18-profile research
 * expansion). Run manually, locally, never in CI, against the real
 * shared staging/production project — same pattern as
 * scripts/migration/verify-security.mjs:
 *
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migration/verify-push-orders-research.mjs
 *
 * Creates disposable test users/rows, cleans every one of them up at
 * the end (including on early failure — see the try/finally in main()),
 * and never touches or leaves behind any real data.
 */
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

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}

const PASSWORD = `Test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
const RUN_TAG = Date.now();

async function createTestUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`create user ${email}: ${error.message}`);
  const userId = data.user.id;
  if (role === 'admin' || role === 'contributor') {
    const { error: roleError } = await admin.from('user_roles').upsert({ user_id: userId, role });
    if (roleError) throw new Error(`set role for ${email}: ${roleError.message}`);
  }
  // A plain 'member' (researcher) needs a researcher_profiles row for
  // the site-wide gate's own checks to make sense in this script's
  // context, even though we're calling the DB directly, not through
  // middleware — RLS on push_subscriptions/order_requests doesn't
  // require this row to exist, but order_requests_insert_own's
  // ownership check does need a real auth.users row, which createUser
  // already gave us.
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

async function main() {
  const users = {};
  const cleanupTasks = [];
  try {
    users.admin1 = {
      ...(await createTestUser(`pv-admin1-${RUN_TAG}@cloudpeptides.test`, 'admin')),
      role: 'admin',
    };
    users.admin2 = {
      ...(await createTestUser(`pv-admin2-${RUN_TAG}@cloudpeptides.test`, 'admin')),
      role: 'admin',
    };
    users.member1 = {
      ...(await createTestUser(`pv-member1-${RUN_TAG}@cloudpeptides.test`, 'member')),
      role: 'member',
    };
    users.member2 = {
      ...(await createTestUser(`pv-member2-${RUN_TAG}@cloudpeptides.test`, 'member')),
      role: 'member',
    };

    // =====================================================================
    // push_subscriptions RLS
    // =====================================================================
    {
      const fakeSub = (suffix) => ({
        endpoint: `https://push.example.test/${RUN_TAG}-${suffix}`,
        p256dh: 'BFakeP256dhKeyForTestingOnlyNotARealSubscriptionKey000000000000000',
        auth_key: 'FakeAuthKeyForTestingOnly',
      });

      const { error: memberInsertErr } = await users.member1.client
        .from('push_subscriptions')
        .insert({ user_id: users.member1.userId, ...fakeSub('member') });
      record(
        'a plain researcher (member) CANNOT insert a push_subscriptions row, even for their own user_id',
        !!memberInsertErr,
        memberInsertErr ? memberInsertErr.message : 'insert unexpectedly succeeded',
      );

      const { error: admin1InsertErr } = await users.admin1.client
        .from('push_subscriptions')
        .insert({ user_id: users.admin1.userId, ...fakeSub('admin1') });
      record(
        'an admin CAN insert their own push_subscriptions row',
        !admin1InsertErr,
        admin1InsertErr?.message ?? '',
      );

      const { data: admin2SeesAdmin1 } = await users.admin2.client
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', users.admin1.userId);
      record(
        "another admin CANNOT read admin1's push_subscriptions row (no admin-bypass SELECT)",
        (admin2SeesAdmin1?.length ?? 0) === 0,
        `${admin2SeesAdmin1?.length ?? 0} rows returned`,
      );

      const { data: admin1SeesOwn } = await users.admin1.client
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', users.admin1.userId);
      record(
        'an admin CAN read their own push_subscriptions row',
        (admin1SeesOwn?.length ?? 0) === 1,
      );

      const { error: admin2DeleteAdmin1Err } = await users.admin2.client
        .from('push_subscriptions')
        .delete()
        .eq('user_id', users.admin1.userId);
      const { data: stillThere } = await admin
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', users.admin1.userId);
      record(
        "another admin's delete attempt on admin1's row is a structural no-op (RLS filters it out, not an error, but zero rows affected)",
        (stillThere?.length ?? 0) === 1,
        admin2DeleteAdmin1Err ? admin2DeleteAdmin1Err.message : 'row survived as expected',
      );

      cleanupTasks.push(() =>
        admin.from('push_subscriptions').delete().eq('user_id', users.admin1.userId),
      );
    }

    // =====================================================================
    // push_events RLS — admin-only SELECT, no client insert/update/delete
    // =====================================================================
    {
      const idemKey = `verify-script-test:${RUN_TAG}`;
      const { error: insertErr } = await admin
        .from('push_events')
        .insert({
          event_type: 'test',
          idempotency_key: idemKey,
          payload: { title: 'x', body: 'y', url: '/admin' },
        })
        .select('id')
        .single();
      record(
        'service-role can insert a push_events row (server-side only path)',
        !insertErr,
        insertErr?.message ?? '',
      );

      const { data: memberSeesEvents } = await users.member1.client
        .from('push_events')
        .select('id')
        .limit(1);
      record(
        'a plain researcher (member) CANNOT read push_events',
        (memberSeesEvents?.length ?? 0) === 0,
        `${memberSeesEvents?.length ?? 0} rows returned`,
      );

      const { data: adminSeesEvents } = await users.admin1.client
        .from('push_events')
        .select('id')
        .eq('idempotency_key', idemKey);
      record('an admin CAN read push_events', (adminSeesEvents?.length ?? 0) === 1);

      const { error: adminInsertEventErr } = await users.admin1.client.from('push_events').insert({
        event_type: 'test',
        idempotency_key: `verify-script-test-client-attempt:${RUN_TAG}`,
        payload: {},
      });
      record(
        'even an admin CANNOT insert push_events directly (no client INSERT policy — server-side/service-role only)',
        !!adminInsertEventErr,
        adminInsertEventErr ? adminInsertEventErr.message : 'insert unexpectedly succeeded',
      );

      // ---- idempotency: the real unique-constraint mechanism ----
      const { data: dupUpsert, error: dupErr } = await admin
        .from('push_events')
        .upsert(
          {
            event_type: 'test',
            idempotency_key: idemKey,
            payload: { title: 'different-payload-should-not-matter' },
          },
          { onConflict: 'idempotency_key', ignoreDuplicates: true },
        )
        .select('id');
      record(
        'retrying the same idempotency_key via upsert+ignoreDuplicates is a genuine no-op (no new/updated row)',
        !dupErr && (dupUpsert?.length ?? 0) === 0,
        dupErr ? dupErr.message : `${dupUpsert?.length ?? 0} rows returned (expected 0)`,
      );

      const { error: rawDupInsertErr } = await admin.from('push_events').insert({
        event_type: 'test',
        idempotency_key: idemKey,
        payload: {},
      });
      record(
        'a raw (non-upsert) duplicate insert of the same idempotency_key is rejected by the unique constraint itself',
        !!rawDupInsertErr && /duplicate key|unique/i.test(rawDupInsertErr.message),
        rawDupInsertErr?.message ?? 'insert unexpectedly succeeded',
      );

      cleanupTasks.push(() => admin.from('push_events').delete().eq('idempotency_key', idemKey));
    }

    // =====================================================================
    // order_requests / order_request_items / order_request_status_history RLS
    // =====================================================================
    {
      const { data: order1, error: insertOrderErr } = await users.member1.client
        .from('order_requests')
        .insert({
          request_number: `PV-TEST-${RUN_TAG}`,
          researcher_user_id: users.member1.userId,
          customer_name: 'Verify Script',
          customer_email: 'verify-script@cloudpeptides.test',
          shipping_line1: '1 Test Way',
          shipping_city: 'Testville',
          shipping_region: 'TS',
          shipping_postal_code: '00000',
          shipping_country: 'US',
          subtotal: 10,
          shipping_cost: 0,
          total: 10,
          is_test_order: true,
        })
        .select('id')
        .single();
      record(
        'a researcher CAN insert their own order_requests row',
        !insertOrderErr,
        insertOrderErr?.message ?? '',
      );
      const orderId = order1?.id;

      if (orderId) {
        cleanupTasks.push(() => admin.from('order_requests').delete().eq('id', orderId));

        const { error: crossInsertErr } = await users.member2.client.from('order_requests').insert({
          request_number: `PV-TEST-CROSS-${RUN_TAG}`,
          researcher_user_id: users.member1.userId, // impersonation attempt
          customer_name: 'Cross User',
          customer_email: 'cross@cloudpeptides.test',
          shipping_line1: '2 Test Way',
          shipping_city: 'Testville',
          shipping_region: 'TS',
          shipping_postal_code: '00000',
          shipping_country: 'US',
          subtotal: 10,
          shipping_cost: 0,
          total: 10,
        });
        record(
          "a researcher CANNOT insert an order_requests row impersonating another researcher's user_id",
          !!crossInsertErr,
          crossInsertErr ? crossInsertErr.message : 'insert unexpectedly succeeded',
        );

        const { data: memberOwnSelect } = await users.member1.client
          .from('order_requests')
          .select('id')
          .eq('id', orderId);
        record(
          'a researcher CAN read their own order_requests row (fixed by 20260819140000 — required for insert(...).select() to work at all)',
          (memberOwnSelect?.length ?? 0) === 1,
          `${memberOwnSelect?.length ?? 0} rows returned`,
        );

        const { data: member2OwnSelect } = await users.member2.client
          .from('order_requests')
          .select('id')
          .eq('id', orderId);
        record(
          "a DIFFERENT researcher CANNOT read member1's order_requests row",
          (member2OwnSelect?.length ?? 0) === 0,
          `${member2OwnSelect?.length ?? 0} rows returned`,
        );

        const { data: adminSelect } = await users.admin1.client
          .from('order_requests')
          .select('id')
          .eq('id', orderId);
        record('an admin CAN read the order_requests row', (adminSelect?.length ?? 0) === 1);

        const { error: memberItemsInsertErr } = await users.member1.client
          .from('order_request_items')
          .insert({
            order_request_id: orderId,
            product_name: 'CP-S1',
            product_spec: '10mg',
            quantity: 1,
            unit_price: 10,
          });
        record(
          'a researcher CAN insert line items on their own order',
          !memberItemsInsertErr,
          memberItemsInsertErr?.message ?? '',
        );

        const { error: member2ItemsInsertErr } = await users.member2.client
          .from('order_request_items')
          .insert({
            order_request_id: orderId, // someone else's order
            product_name: 'CP-T2',
            product_spec: '15mg',
            quantity: 1,
            unit_price: 10,
          });
        record(
          "a researcher CANNOT insert line items on someone else's order (subquery ownership check)",
          !!member2ItemsInsertErr,
          member2ItemsInsertErr ? member2ItemsInsertErr.message : 'insert unexpectedly succeeded',
        );

        const { error: memberStatusUpdateErr } = await users.member1.client
          .from('order_requests')
          .update({ status: 'approved' })
          .eq('id', orderId);
        const { data: statusAfterMemberAttempt } = await admin
          .from('order_requests')
          .select('status')
          .eq('id', orderId)
          .single();
        record(
          'a researcher CANNOT change their own order_requests status (admin-only UPDATE)',
          statusAfterMemberAttempt?.status === 'new',
          memberStatusUpdateErr
            ? memberStatusUpdateErr.message
            : `status after attempt: ${statusAfterMemberAttempt?.status}`,
        );

        const { error: adminStatusUpdateErr } = await users.admin1.client
          .from('order_requests')
          .update({ status: 'reviewing' })
          .eq('id', orderId);
        const { data: statusAfterAdmin } = await admin
          .from('order_requests')
          .select('status')
          .eq('id', orderId)
          .single();
        record(
          'an admin CAN change order_requests status',
          statusAfterAdmin?.status === 'reviewing',
          adminStatusUpdateErr?.message ?? '',
        );

        const { error: adminHistoryInsertErr } = await users.admin1.client
          .from('order_request_status_history')
          .insert({
            order_request_id: orderId,
            previous_status: 'new',
            new_status: 'reviewing',
            changed_by: users.admin1.userId,
          });
        record(
          'an admin CAN insert an order_request_status_history row',
          !adminHistoryInsertErr,
          adminHistoryInsertErr?.message ?? '',
        );

        const { data: historyRow } = await admin
          .from('order_request_status_history')
          .select('id')
          .eq('order_request_id', orderId)
          .single();
        if (historyRow) {
          // With no UPDATE/DELETE policy defined at all (and RLS
          // force-enabled), Postgres doesn't error on the attempt — it
          // filters the row out of the command's own visible set, so
          // the call itself reports success with zero rows actually
          // affected. Verifying the real row state afterward (via the
          // service client) is the only way to prove this correctly —
          // checking for a returned error alone is not sufficient and
          // was this script's own bug on the first run.
          await users.admin1.client
            .from('order_request_status_history')
            .update({ note: 'trying to edit history' })
            .eq('id', historyRow.id);
          const { data: afterUpdateAttempt } = await admin
            .from('order_request_status_history')
            .select('note')
            .eq('id', historyRow.id)
            .single();
          record(
            'even an admin CANNOT actually change an order_request_status_history row (append-only, no update policy for any role — verified via real row state, not just the absence of an error)',
            afterUpdateAttempt?.note === null,
            `note after attempt: ${JSON.stringify(afterUpdateAttempt?.note)}`,
          );

          await users.admin1.client
            .from('order_request_status_history')
            .delete()
            .eq('id', historyRow.id);
          const { data: afterDeleteAttempt } = await admin
            .from('order_request_status_history')
            .select('id')
            .eq('id', historyRow.id);
          record(
            'even an admin CANNOT delete an order_request_status_history row (append-only — verified via real row state)',
            (afterDeleteAttempt?.length ?? 0) === 1,
            `${afterDeleteAttempt?.length ?? 0} row(s) remain (expected 1)`,
          );
        }
      }
    }

    // =====================================================================
    // Research integrity: the 2026-08-19 batch (18 new draft profiles)
    // =====================================================================
    {
      const newSlugs = [
        'ghrp-2',
        'ghrp-6',
        'hexarelin',
        'gonadorelin',
        'peg-mgf',
        'mazdutide',
        'survodutide',
        'cagrisema',
        'll-37',
        'adipotide',
        'ace-031',
        'hmg',
        'snap-8',
        'vip',
        'vitamin-b12',
        'epo',
        'foxo4-dri',
        'lipo-c',
      ];
      const { data: newCompounds } = await admin
        .from('compounds')
        .select('id, slug, name, status')
        .in('slug', newSlugs);
      record(
        'all 18 new research profiles exist',
        (newCompounds?.length ?? 0) === 18,
        `${newCompounds?.length ?? 0}/18 found`,
      );

      // Updated 2026-08-19: the user reviewed and explicitly approved
      // publishing the full batch (scripts/research/publish-batch.mjs,
      // which re-verifies checkPublishReadiness — every claim cited,
      // every regulatory record sourced — before writing anything). All
      // 18 are now expected to be 'published', not 'draft'.
      const notPublished = (newCompounds ?? []).filter((c) => c.status !== 'published');
      record(
        'every one of the 18 new profiles is published (reviewed and approved by the user)',
        notPublished.length === 0,
        notPublished.map((c) => `${c.slug}=${c.status}`).join(', '),
      );

      // Every new compound has at least one claim (no shallow placeholders).
      const ids = (newCompounds ?? []).map((c) => c.id);
      const { data: claimCounts } = await admin
        .from('claims')
        .select('compound_id')
        .in('compound_id', ids);
      const compoundsWithClaims = new Set((claimCounts ?? []).map((c) => c.compound_id));
      const withoutClaims = ids.filter((id) => !compoundsWithClaims.has(id));
      record(
        'every new profile has at least one claim (no shallow placeholder profiles)',
        withoutClaims.length === 0,
        `${withoutClaims.length} compound(s) with zero claims`,
      );

      // Duplicate sources by URL (should be impossible — upsertSource
      // reuses by URL — but verify the real data, not just the import
      // script's own logic).
      const { data: allSources } = await admin.from('sources').select('id, url');
      const urlCounts = new Map();
      for (const s of allSources ?? []) urlCounts.set(s.url, (urlCounts.get(s.url) ?? 0) + 1);
      const duplicateUrls = [...urlCounts.entries()].filter(([, count]) => count > 1);
      record(
        'no duplicate source URLs exist anywhere in the sources table',
        duplicateUrls.length === 0,
        `${duplicateUrls.length} duplicated URL(s)`,
      );

      // Duplicate global source_identifiers (PMID/DOI reused across two
      // different source rows) — the DB's own unique index should make
      // this structurally impossible; confirm it really is empty.
      const { data: allIdentifiers } = await admin
        .from('source_identifiers')
        .select('identifier_type, identifier_value, source_id');
      const idKeyCounts = new Map();
      for (const row of allIdentifiers ?? []) {
        const key = `${row.identifier_type}:${row.identifier_value}`;
        const set = idKeyCounts.get(key) ?? new Set();
        set.add(row.source_id);
        idKeyCounts.set(key, set);
      }
      const conflictingIdentifiers = [...idKeyCounts.entries()].filter(
        ([, sourceIds]) => sourceIds.size > 1,
      );
      record(
        'no PMID/DOI/other identifier is attached to two different source rows',
        conflictingIdentifiers.length === 0,
        `${conflictingIdentifiers.length} conflicting identifier(s)`,
      );

      // Duplicate aliases (compound_id, alias) — unique constraint should
      // make this impossible; confirm the real data.
      const { data: allAliases } = await admin
        .from('compound_aliases')
        .select('compound_id, alias');
      const aliasKeyCounts = new Map();
      for (const a of allAliases ?? []) {
        const key = `${a.compound_id}::${a.alias}`;
        aliasKeyCounts.set(key, (aliasKeyCounts.get(key) ?? 0) + 1);
      }
      const duplicateAliases = [...aliasKeyCounts.entries()].filter(([, count]) => count > 1);
      record(
        'no duplicate (compound, alias) pairs exist',
        duplicateAliases.length === 0,
        `${duplicateAliases.length} duplicate(s)`,
      );

      // Orphan check: every claim_sources row references a real claim
      // and a real source (should be structurally guaranteed by FK
      // cascade — confirm, don't just assume).
      const { data: claimSourceRows } = await admin
        .from('claim_sources')
        .select('claim_id, source_id');
      const { data: allClaimIds } = await admin.from('claims').select('id');
      const { data: allSourceIds } = await admin.from('sources').select('id');
      const claimIdSet = new Set((allClaimIds ?? []).map((c) => c.id));
      const sourceIdSet = new Set((allSourceIds ?? []).map((s) => s.id));
      const orphanedClaimSources = (claimSourceRows ?? []).filter(
        (r) => !claimIdSet.has(r.claim_id) || !sourceIdSet.has(r.source_id),
      );
      record(
        'no orphaned claim_sources rows (every claim_id/source_id resolves to a real row)',
        orphanedClaimSources.length === 0,
        `${orphanedClaimSources.length} orphaned`,
      );

      // CagriSema's stack_components correctly reference the existing,
      // untouched Cagrilintide/Semaglutide compounds.
      const { data: cagrisemaCompound } = await admin
        .from('compounds')
        .select('id')
        .eq('slug', 'cagrisema')
        .single();
      const { data: stackComponents } = await admin
        .from('stack_components')
        .select('component_compound_id')
        .eq('stack_id', cagrisemaCompound?.id);
      const componentIds = (stackComponents ?? []).map((c) => c.component_compound_id);
      const { data: componentCompounds } = componentIds.length
        ? await admin.from('compounds').select('slug').in('id', componentIds)
        : { data: [] };
      const componentSlugs = new Set((componentCompounds ?? []).map((c) => c.slug));
      record(
        'CagriSema references exactly the existing Cagrilintide and Semaglutide profiles (no duplication)',
        componentSlugs.has('cagrilintide') &&
          componentSlugs.has('semaglutide') &&
          componentSlugs.size === 2,
        `linked: ${[...componentSlugs].join(', ')}`,
      );

      // The 3 shop-linked research profiles remain untouched/unlinked.
      const { data: sensitiveThree } = await admin
        .from('compounds')
        .select('slug, name, status')
        .in('slug', ['semaglutide', 'tirzepatide', 'retatrutide']);
      const allPublishedRealNames = (sensitiveThree ?? []).every(
        (c) => c.status === 'published' && !/^CP-/i.test(c.name),
      );
      record(
        'Semaglutide/Tirzepatide/Retatrutide research profiles remain published with their real scientific names (untouched)',
        allPublishedRealNames && (sensitiveThree?.length ?? 0) === 3,
      );
    }
  } finally {
    for (const task of cleanupTasks) {
      try {
        await task();
      } catch (err) {
        console.error('cleanup task failed (non-fatal):', err.message);
      }
    }
    for (const key of Object.keys(users)) {
      try {
        await cleanupTestUser(users[key].userId);
      } catch (err) {
        console.error(`cleanup of test user ${key} failed (non-fatal):`, err.message);
      }
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
  console.error('Verification crashed:', err);
  process.exit(1);
});
