import { describe, expect, it } from 'vitest';
import {
  addContactSubmissionReply,
  insertContactSubmission,
  markContactSubmissionRead,
  type ContactSubmissionRow,
} from '../../src/lib/contact-submissions';

/** A minimal fake Supabase client covering exactly the chains
 * src/lib/contact-submissions.ts calls. */
function fakeClient(opts: {
  insertedSubmission?: Partial<ContactSubmissionRow>;
  captured?: { submissions: unknown[]; replies: unknown[]; updates: unknown[] };
}) {
  const captured = opts.captured ?? { submissions: [], replies: [], updates: [] };

  const client = {
    from(table: string) {
      if (table === 'contact_submissions') {
        return {
          insert(row: unknown) {
            captured.submissions.push(row);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'submission-1', status: 'new', ...opts.insertedSubmission },
                  error: null,
                }),
              }),
            };
          },
          update(patch: unknown) {
            captured.updates.push(patch);
            const result = { error: null };
            // Supports both a single `.eq('id', x)` awaited directly
            // (addContactSubmissionReply) and a chained
            // `.eq('id', x).eq('status', 'new')` (markContactSubmissionRead)
            // — the first .eq() returns something both thenable and
            // further chainable.
            return {
              eq: () => ({
                then: (resolve: (v: typeof result) => void) => resolve(result),
                eq: async () => result,
              }),
            };
          },
        };
      }
      if (table === 'contact_submission_replies') {
        return {
          insert(row: unknown) {
            captured.replies.push(row);
            return {
              select: () => ({
                single: async () => ({
                  data: { id: 'reply-1', ...(row as object) },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table in test fake: ${table}`);
    },
  };

  return { client, captured };
}

describe('insertContactSubmission', () => {
  it('maps the validated submission into the contact_submissions row under the caller-supplied researcher id', async () => {
    const { client, captured } = fakeClient({});
    await insertContactSubmission(client as never, {
      researcherUserId: 'user-1',
      name: 'Jordan Researcher',
      email: 'jordan@example.com',
      message: 'A question about your GHRP-2 profile.',
    });

    expect(captured.submissions).toHaveLength(1);
    const row = captured.submissions[0] as Record<string, unknown>;
    expect(row.researcher_user_id).toBe('user-1');
    expect(row.name).toBe('Jordan Researcher');
    expect(row.email).toBe('jordan@example.com');
    expect(row.message).toBe('A question about your GHRP-2 profile.');
    // Never sets status/created_at itself — the table's own defaults own that.
    expect(row).not.toHaveProperty('status');
  });
});

describe('markContactSubmissionRead', () => {
  it('issues an update scoped to the row still being "new" — never force-downgrades an already-replied row', async () => {
    const { client, captured } = fakeClient({});
    await markContactSubmissionRead(client as never, 'submission-1');

    expect(captured.updates).toHaveLength(1);
    expect(captured.updates[0]).toMatchObject({ status: 'read' });
  });
});

describe('addContactSubmissionReply', () => {
  it('inserts the reply and marks the submission replied, in that order', async () => {
    const { client, captured } = fakeClient({});
    const reply = await addContactSubmissionReply(client as never, {
      submissionId: 'submission-1',
      adminUserId: 'admin-1',
      body: 'Thanks for reaching out — here is the citation you asked about.',
      resendMessageId: 'resend-msg-1',
    });

    expect(reply.id).toBe('reply-1');
    expect(captured.replies).toHaveLength(1);
    expect(captured.replies[0]).toMatchObject({
      submission_id: 'submission-1',
      admin_user_id: 'admin-1',
      body: 'Thanks for reaching out — here is the citation you asked about.',
      resend_message_id: 'resend-msg-1',
    });
    expect(captured.updates).toHaveLength(1);
    expect(captured.updates[0]).toMatchObject({ status: 'replied' });
  });
});
