import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  notifyNewContactSubmission,
  notifyNewOrderRequest,
  notifyNewResearcher,
  sendTestNotification,
} from '../../src/lib/push';

vi.mock('cloudflare:workers', () => ({
  env: {
    VAPID_PRIVATE_KEY: 'fake-not-a-real-secret-for-this-test-only',
    VAPID_PUBLIC_KEY: 'fake-not-a-real-key-for-this-test-only',
    VAPID_SUBJECT: 'mailto:test@cloudpeptides.invalid',
  },
}));
// sendWebPush itself is real-crypto-tested in web-push.test.ts — stubbed
// here so these tests exercise push.ts's own orchestration logic
// (idempotency, fan-out, cleanup, event-status bookkeeping) in
// isolation, not the encryption pipeline a second time.
vi.mock('../../src/lib/web-push', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/web-push')>();
  return { ...actual, sendWebPush: vi.fn() };
});
import { sendWebPush } from '../../src/lib/web-push';

/** A minimal fake Supabase client covering exactly the chains
 * src/lib/push.ts calls — not a general-purpose mock. */
function fakeClient(opts: {
  existingEvent?: boolean;
  subscriptions?: { id: string; endpoint: string; p256dh: string; auth_key: string }[];
}) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];
  const subscriptions = opts.subscriptions ?? [];
  const deletedSubscriptionIds: string[] = [];
  let lastEventUpdate: Record<string, unknown> | null = null;

  const client = {
    from(table: string) {
      return {
        upsert(row: unknown) {
          calls.push({ table, op: 'upsert', args: [row] });
          return {
            select: () => ({
              maybeSingle: async () =>
                opts.existingEvent
                  ? { data: null, error: null } // ON CONFLICT DO NOTHING -> no row
                  : { data: { id: 'event-1' }, error: null },
            }),
          };
        },
        select() {
          // Supports both `await ...select(...)` (notifyNew*, no
          // filter — every subscription) and `...select(...).eq(...)`
          // (sendTestNotification — filtered to one user's own rows;
          // this fake doesn't actually filter by user_id since every
          // test's fixture already only contains the rows relevant to
          // it).
          const result = { data: subscriptions, error: null };
          return {
            then: (resolve: (v: typeof result) => void) => resolve(result),
            eq: async () => result,
          };
        },
        update(patch: Record<string, unknown>) {
          lastEventUpdate = patch;
          return { eq: async () => ({ error: null }) };
        },
        delete() {
          return {
            eq: async (_col: string, id: string) => {
              deletedSubscriptionIds.push(id);
              return { error: null };
            },
          };
        },
      };
    },
  };

  return { client, calls, deletedSubscriptionIds, getLastEventUpdate: () => lastEventUpdate };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('push idempotency', () => {
  it('skips delivery entirely when the idempotency key already has an event row', async () => {
    const { client } = fakeClient({ existingEvent: true, subscriptions: [] });
    const mockedSend = vi.mocked(sendWebPush);

    await notifyNewResearcher(client as never, { userId: 'u1', fullName: 'Jane Researcher' });

    expect(mockedSend).not.toHaveBeenCalled();
  });

  it('delivers to every subscription when the event is genuinely new', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [
        { id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' },
        { id: 's2', endpoint: 'https://push.example/2', p256dh: 'c', auth_key: 'd' },
      ],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'sent' });

    await notifyNewOrderRequest(client as never, {
      requestId: 'r1',
      requestNumber: 'CP-2026-0001',
      customerName: 'Jordan Customer',
    });

    expect(mockedSend).toHaveBeenCalledTimes(2);
  });
});

describe('expired-subscription cleanup', () => {
  it('deletes a subscription the push service reports as expired', async () => {
    const { client, deletedSubscriptionIds } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    vi.mocked(sendWebPush).mockResolvedValue({ outcome: 'expired' });

    await notifyNewResearcher(client as never, { userId: 'u2', fullName: 'Alex Researcher' });

    expect(deletedSubscriptionIds).toEqual(['s1']);
  });

  it('retries once on a transient (network/5xx) failure before giving up', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend
      .mockResolvedValueOnce({ outcome: 'error', status: 503, detail: 'temporarily down' })
      .mockResolvedValueOnce({ outcome: 'sent' });

    await notifyNewResearcher(client as never, { userId: 'u3', fullName: 'Sam Researcher' });

    expect(mockedSend).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry a non-transient 4xx failure', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'error', status: 400, detail: 'bad request' });

    await notifyNewResearcher(client as never, { userId: 'u4', fullName: 'Riley Researcher' });

    expect(mockedSend).toHaveBeenCalledTimes(1);
  });
});

describe('notification payload content — no sensitive data on a lock screen', () => {
  it('the new-researcher payload carries only a name, never an email/address', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'sent' });

    await notifyNewResearcher(client as never, {
      userId: 'u5',
      fullName: 'Taylor Researcher',
      // @ts-expect-error -- deliberately passing extra fields to prove
      // the function signature/payload builder can't leak them even if
      // a future caller accidentally supplied them.
      email: 'taylor@example.com',
      country: 'Wonderland',
    });

    const [, payload] = mockedSend.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain('Taylor Researcher');
    expect(serialized).not.toContain('taylor@example.com');
    expect(serialized).not.toContain('Wonderland');
  });

  it('the new-order-request payload carries the request number and name, never the email', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'sent' });

    await notifyNewOrderRequest(client as never, {
      requestId: 'r2',
      requestNumber: 'CP-2026-0002',
      customerName: 'Morgan Customer',
    });

    const [, payload] = mockedSend.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain('CP-2026-0002');
    expect(serialized).toContain('Morgan Customer');
  });

  it('the new-contact-submission payload carries the name, never the email or message body', async () => {
    const { client } = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'sent' });

    await notifyNewContactSubmission(client as never, {
      submissionId: 'sub-1',
      // @ts-expect-error -- deliberately passing extra fields to prove
      // the function signature/payload builder can't leak them even if
      // a future caller accidentally supplied them.
      email: 'casey@example.com',
      name: 'Casey Researcher',
      message: 'A private question about dosing.',
    });

    const [, payload] = mockedSend.mock.calls[0];
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain('Casey Researcher');
    expect(serialized).not.toContain('casey@example.com');
    expect(serialized).not.toContain('A private question about dosing.');
  });
});

describe('idempotency (contact submissions)', () => {
  it('delivers once per genuinely new contact submission and skips a retried duplicate', async () => {
    const fresh = fakeClient({
      existingEvent: false,
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    vi.mocked(sendWebPush).mockResolvedValue({ outcome: 'sent' });
    await notifyNewContactSubmission(fresh.client as never, {
      submissionId: 'sub-2',
      name: 'Alex',
    });
    expect(vi.mocked(sendWebPush)).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    const dup = fakeClient({ existingEvent: true, subscriptions: [] });
    await notifyNewContactSubmission(dup.client as never, { submissionId: 'sub-2', name: 'Alex' });
    expect(vi.mocked(sendWebPush)).not.toHaveBeenCalled();
  });
});

describe('sendTestNotification', () => {
  it('sends a fixed, server-defined payload — never anything caller-supplied', async () => {
    const { client } = fakeClient({
      subscriptions: [{ id: 's1', endpoint: 'https://push.example/1', p256dh: 'a', auth_key: 'b' }],
    });
    const mockedSend = vi.mocked(sendWebPush);
    mockedSend.mockResolvedValue({ outcome: 'sent' });

    await sendTestNotification(client as never, 'admin-1');

    expect(mockedSend).toHaveBeenCalledTimes(1);
    const [, payload] = mockedSend.mock.calls[0];
    expect((payload as { title: string }).title).toBe('Test notification');
  });

  it('throws a clear error when no device is registered', async () => {
    const { client } = fakeClient({ subscriptions: [] });
    await expect(sendTestNotification(client as never, 'admin-1')).rejects.toThrow(/no devices/i);
  });
});
