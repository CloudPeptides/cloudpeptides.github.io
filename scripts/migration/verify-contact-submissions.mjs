#!/usr/bin/env node
/**
 * RLS + idempotency verification for contact_submissions /
 * contact_submission_replies / the new push_events event type
 * (2026-08-20 batch). Run manually, locally, never in CI, against the
 * real shared staging/production project — same pattern as
 * scripts/migration/verify-push-orders-research.mjs, which this file
 * mirrors closely (including its own precedent of exercising
 * push_events mechanics via a direct service-role insert rather than
 * invoking the Workers-only notifyNewContactSubmission() function,
 * which needs `cloudflare:workers` and can't run in plain Node):
 *
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/migration/verify-contact-submissions.mjs
 *
 * Creates one disposable, clearly-labeled test submission plus
 * disposable test users, cleans up every one of them at the end
 * (including on early failure — see the try/finally in main()), and
 * never touches or leaves behind any real data.
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
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`);
}

const PASSWORD = `Test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
const RUN_TAG = Date.now();
const TEST_LABEL = '[TEST — safe to delete]';

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
      ...(await createTestUser(`cv-admin1-${RUN_TAG}@cloudpeptides.test`, 'admin')),
    };
    users.admin2 = {
      ...(await createTestUser(`cv-admin2-${RUN_TAG}@cloudpeptides.test`, 'admin')),
    };
    users.member1 = {
      ...(await createTestUser(`cv-member1-${RUN_TAG}@cloudpeptides.test`, 'member')),
    };
    users.member2 = {
      ...(await createTestUser(`cv-member2-${RUN_TAG}@cloudpeptides.test`, 'member')),
    };

    // =====================================================================
    // contact_submissions — insert (mirrors insertContactSubmission
    // exactly: own-JWT insert().select().single()) + RLS
    // =====================================================================
    let submissionId;
    {
      const { data: inserted, error: insertErr } = await users.member1.client
        .from('contact_submissions')
        .insert({
          researcher_user_id: users.member1.userId,
          name: `${TEST_LABEL} Claude Verification`,
          email: 'claude-verify-test@cloudpeptides.invalid',
          message: `${TEST_LABEL} Automated staging verification of the contact_submissions migration, run ${RUN_TAG}.`,
        })
        .select('*')
        .single();
      record(
        '1. a researcher CAN submit a contact message (insert + RETURNING succeeds — the exact insertContactSubmission() code path, including the self-select RLS fix)',
        !insertErr && !!inserted,
        insertErr?.message ?? '',
      );
      submissionId = inserted?.id;
      if (submissionId)
        cleanupTasks.push(() => admin.from('contact_submissions').delete().eq('id', submissionId));

      if (submissionId) {
        const { data: memberOwnSelect } = await users.member1.client
          .from('contact_submissions')
          .select('id, name, message')
          .eq('id', submissionId);
        record(
          'the submitting researcher CAN read their own submission back',
          (memberOwnSelect?.length ?? 0) === 1 && memberOwnSelect[0].name.startsWith(TEST_LABEL),
        );

        const { data: member2Select } = await users.member2.client
          .from('contact_submissions')
          .select('id')
          .eq('id', submissionId);
        record(
          '4a. a DIFFERENT researcher account CANNOT read this submission',
          (member2Select?.length ?? 0) === 0,
          `${member2Select?.length ?? 0} rows returned`,
        );

        const { data: anonSelect, error: anonSelectErr } = await anon
          .from('contact_submissions')
          .select('id')
          .eq('id', submissionId);
        record(
          '4b. an anonymous (unauthenticated) client CANNOT read this submission',
          (anonSelect?.length ?? 0) === 0,
          anonSelectErr ? anonSelectErr.message : `${anonSelect?.length ?? 0} rows returned`,
        );

        const { data: adminSelect } = await users.admin1.client
          .from('contact_submissions')
          .select('id, name, message, status')
          .eq('id', submissionId);
        record(
          '5a. an authorized administrator CAN view the submission (this is what /admin/contact-submissions lists/renders)',
          (adminSelect?.length ?? 0) === 1,
        );

        const { error: memberStatusUpdateErr } = await users.member1.client
          .from('contact_submissions')
          .update({ status: 'read' })
          .eq('id', submissionId);
        const { data: statusAfterMemberAttempt } = await admin
          .from('contact_submissions')
          .select('status')
          .eq('id', submissionId)
          .single();
        record(
          'a researcher CANNOT change their own submission status (admin-only UPDATE)',
          statusAfterMemberAttempt?.status === 'new',
          memberStatusUpdateErr
            ? memberStatusUpdateErr.message
            : `status after attempt: ${statusAfterMemberAttempt?.status}`,
        );

        const { error: adminStatusUpdateErr } = await users.admin1.client
          .from('contact_submissions')
          .update({ status: 'read' })
          .eq('id', submissionId);
        const { data: statusAfterAdmin } = await admin
          .from('contact_submissions')
          .select('status')
          .eq('id', submissionId)
          .single();
        record(
          '5b. an authorized administrator CAN manage the submission (mark it read)',
          statusAfterAdmin?.status === 'read',
          adminStatusUpdateErr?.message ?? '',
        );

        const { error: anonUpdateErr } = await anon
          .from('contact_submissions')
          .update({ status: 'replied' })
          .eq('id', submissionId);
        const { data: statusAfterAnon } = await admin
          .from('contact_submissions')
          .select('status')
          .eq('id', submissionId)
          .single();
        record(
          'an anonymous client CANNOT change submission status',
          statusAfterAnon?.status === 'read',
          anonUpdateErr
            ? anonUpdateErr.message
            : `status after attempt: ${statusAfterAnon?.status}`,
        );

        // ---------------------------------------------------------------
        // contact_submission_replies — admin-only, append-only
        // ---------------------------------------------------------------
        const { data: reply, error: replyInsertErr } = await users.admin1.client
          .from('contact_submission_replies')
          .insert({
            submission_id: submissionId,
            admin_user_id: users.admin1.userId,
            body: `${TEST_LABEL} automated verification reply, run ${RUN_TAG}.`,
          })
          .select('*')
          .single();
        record(
          "5c. an authorized administrator CAN record a reply (addContactSubmissionReply's own-JWT insert().select() pattern)",
          !replyInsertErr && !!reply,
          replyInsertErr?.message ?? '',
        );
        const replyId = reply?.id;
        if (replyId)
          cleanupTasks.push(() =>
            admin.from('contact_submission_replies').delete().eq('id', replyId),
          );

        if (replyId) {
          const { data: memberSeesReply } = await users.member1.client
            .from('contact_submission_replies')
            .select('id')
            .eq('id', replyId);
          record(
            'a researcher (including the original submitter) CANNOT read reply records',
            (memberSeesReply?.length ?? 0) === 0,
            `${memberSeesReply?.length ?? 0} rows returned`,
          );

          await users.admin1.client
            .from('contact_submission_replies')
            .update({ body: 'trying to edit a reply after the fact' })
            .eq('id', replyId);
          const { data: afterReplyEditAttempt } = await admin
            .from('contact_submission_replies')
            .select('body')
            .eq('id', replyId)
            .single();
          record(
            'even an admin CANNOT edit a reply after the fact (append-only, no update policy — verified via real row state)',
            afterReplyEditAttempt?.body?.startsWith(TEST_LABEL),
            `body after attempt: ${JSON.stringify(afterReplyEditAttempt?.body)}`,
          );
        }
      }
    }

    // =====================================================================
    // push_events — the new 'contact_submission_created' event type
    // (mirrors notifyNewContactSubmission()'s exact idempotency-key
    // format and payload shape; the function itself is already unit-
    // tested against a mocked client in tests/unit/push.test.ts — this
    // exercises the real DB mechanics the same way
    // verify-push-orders-research.mjs already established for the other
    // two event types).
    // =====================================================================
    if (submissionId) {
      const idemKey = `contact_submission_created:${submissionId}`;
      const { error: insertErr } = await admin
        .from('push_events')
        .insert({
          event_type: 'contact_submission_created',
          source_table: 'contact_submissions',
          source_id: submissionId,
          idempotency_key: idemKey,
          payload: {
            title: 'New contact message',
            body: `${TEST_LABEL} Claude Verification sent a message.`,
            url: `/admin/contact-submissions/${submissionId}`,
            tag: `contact-${submissionId}`,
          },
        })
        .select('id')
        .single();
      record(
        "3. the check constraint accepts 'contact_submission_created' and the event is recorded (the real trigger — src/lib/push.ts's notifyNewContactSubmission — uses this exact insert)",
        !insertErr,
        insertErr?.message ?? '',
      );
      cleanupTasks.push(() => admin.from('push_events').delete().eq('idempotency_key', idemKey));

      const { data: memberSeesEvent } = await users.member1.client
        .from('push_events')
        .select('id')
        .eq('idempotency_key', idemKey);
      record('a researcher CANNOT read push_events', (memberSeesEvent?.length ?? 0) === 0);

      const { data: adminSeesEvent } = await users.admin1.client
        .from('push_events')
        .select('id, event_type')
        .eq('idempotency_key', idemKey);
      record(
        'an admin CAN read the contact_submission_created push event (troubleshooting visibility)',
        (adminSeesEvent?.length ?? 0) === 1 &&
          adminSeesEvent[0].event_type === 'contact_submission_created',
      );

      const { data: dupUpsert, error: dupErr } = await admin
        .from('push_events')
        .upsert(
          {
            event_type: 'contact_submission_created',
            idempotency_key: idemKey,
            payload: { different: true },
          },
          { onConflict: 'idempotency_key', ignoreDuplicates: true },
        )
        .select('id');
      record(
        'a retried/duplicate contact_submission_created event for the same submission is a genuine no-op (idempotency_key unique constraint)',
        !dupErr && (dupUpsert?.length ?? 0) === 0,
        dupErr ? dupErr.message : `${dupUpsert?.length ?? 0} rows returned (expected 0)`,
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
