/**
 * Admin push-notification orchestration — the server-side half of the
 * feature (src/lib/web-push.ts does the actual RFC 8291/8292 crypto).
 *
 * Delivery model: synchronous, best-effort, fire-immediately-after-the-
 * triggering-write. There is no durable queue/cron sweep in this pass
 * (Cloudflare Queues/Durable Objects are not in CLAUDE.md's approved
 * architecture list, and adding either would be a real infra decision,
 * not something to slip in unasked) — every event is attempted once,
 * inline, right after the database write that caused it, with one
 * automatic retry for transient (network/5xx) failures against each
 * subscription. A push failure NEVER throws back to the caller: every
 * public function here swallows its own errors after recording them on
 * the push_events row, because "a notification failure must never roll
 * back a valid account or order request" is an absolute requirement,
 * not a best-effort one.
 *
 * Every function takes the service-role client deliberately — both
 * because sending must fan out across every admin's subscriptions
 * (which a single admin's own RLS-scoped session could never read; see
 * push_subscriptions' owner-only SELECT policy), and because these are
 * only ever called from already-privileged server contexts (the
 * registration/checkout routes right after their own successful
 * inserts, or the admin-only test-notification route) — never
 * reachable with caller-supplied notification content.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';
import { sendWebPush, type PushSubscriptionKeys, type VapidKeys } from './web-push';

function getVapidKeys(): VapidKeys | null {
  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY || !env.VAPID_SUBJECT) return null;
  return {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject: env.VAPID_SUBJECT,
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  /** Same-origin /admin/* path only — never a full external URL. */
  url: string;
  tag?: string;
}

interface CreateEventInput {
  eventType: 'researcher_registered' | 'order_request_created' | 'test';
  sourceTable?: string;
  sourceId?: string;
  idempotencyKey: string;
  payload: NotificationPayload;
}

/**
 * Fans a notification out to every registered admin subscription and
 * records the outcome on the push_events row. Never throws — every
 * failure mode (no VAPID keys configured, a subscription send failing,
 * a DB update failing) is caught and logged, because this always runs
 * after the action it's reporting on has already succeeded and must
 * never appear to fail that action.
 */
async function deliverEvent(
  service: SupabaseClient,
  eventId: string,
  payload: NotificationPayload,
): Promise<void> {
  const vapid = getVapidKeys();
  if (!vapid) {
    console.error('push notification skipped: VAPID keys are not configured in this environment.');
    await service
      .from('push_events')
      .update({
        status: 'failed',
        attempts: 1,
        last_error: 'VAPID keys not configured',
        last_error_category: 'unknown',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);
    return;
  }

  const { data: subscriptions, error: subError } = await service
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key');
  if (subError) {
    console.error('push notification: could not load subscriptions:', subError.message);
    await service
      .from('push_events')
      .update({
        status: 'failed',
        attempts: 1,
        last_error: subError.message,
        last_error_category: 'unknown',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    // Not an error — there just aren't any admin devices enrolled yet.
    await service
      .from('push_events')
      .update({ status: 'sent', attempts: 1, processed_at: new Date().toISOString() })
      .eq('id', eventId);
    return;
  }

  let sentCount = 0;
  let lastError: string | null = null;
  let lastErrorCategory: string | null = null;

  for (const sub of subscriptions) {
    const keys: PushSubscriptionKeys = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth_key,
    };

    let result = await sendWebPush(keys, payload, vapid);
    // One immediate retry, transient failures only (network errors or
    // 5xx from the push service) — never for a 4xx that isn't
    // expiry-related, which would just fail identically again.
    if (result.outcome === 'error' && (result.status === 0 || result.status >= 500)) {
      result = await sendWebPush(keys, payload, vapid);
    }

    if (result.outcome === 'sent') {
      sentCount++;
      continue;
    }
    if (result.outcome === 'expired') {
      // Remove the dead subscription so future events don't keep
      // retrying it — this is the "remove expired or permanently
      // invalid subscriptions" requirement.
      await service.from('push_subscriptions').delete().eq('id', sub.id);
      lastError = 'subscription expired/invalid — removed';
      lastErrorCategory = 'expired_subscription';
      continue;
    }
    lastError = `HTTP ${result.status}: ${result.detail}`;
    lastErrorCategory =
      result.status === 0 ? 'network' : result.status === 429 ? 'rate_limited' : 'unknown';
  }

  const status = sentCount === subscriptions.length ? 'sent' : sentCount > 0 ? 'partial' : 'failed';
  await service
    .from('push_events')
    .update({
      status,
      attempts: 1,
      last_error: lastError,
      last_error_category: lastErrorCategory,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId);
}

async function createAndDeliver(service: SupabaseClient, input: CreateEventInput): Promise<void> {
  try {
    const { data, error } = await service
      .from('push_events')
      .upsert(
        {
          event_type: input.eventType,
          source_table: input.sourceTable ?? null,
          source_id: input.sourceId ?? null,
          idempotency_key: input.idempotencyKey,
          payload: input.payload,
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: true },
      )
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('push event creation failed:', error.message);
      return;
    }
    if (!data) {
      // Already existed — a retry of the same underlying action. Never
      // send a second notification for it.
      return;
    }
    await deliverEvent(service, data.id, input.payload);
  } catch (err) {
    // Belt-and-suspenders: even an unexpected throw here must never
    // propagate to the caller (registration/checkout already committed
    // their real work before this function was ever called).
    console.error('push notification pipeline failed:', err instanceof Error ? err.message : err);
  }
}

/** Fires once per genuinely new researcher account — called only after
 * researcher_profiles + researcher_attestations both insert successfully
 * (src/pages/api/account/register.ts). Never retriggered by email
 * verification, login, profile edits, certification renewal, or
 * admin status changes — those code paths never call this. */
export async function notifyNewResearcher(
  service: SupabaseClient,
  input: { userId: string; fullName: string },
): Promise<void> {
  await createAndDeliver(service, {
    eventType: 'researcher_registered',
    sourceTable: 'researcher_profiles',
    sourceId: input.userId,
    idempotencyKey: `researcher_registered:${input.userId}`,
    payload: {
      title: 'New researcher account',
      // Name only — never email/country/affiliation on a lock screen.
      body: input.fullName
        ? `${input.fullName} created a researcher account.`
        : 'A new researcher account was created.',
      url: `/admin/researchers?highlight=${input.userId}`,
      tag: `researcher-${input.userId}`,
    },
  });
}

/** Fires once per successfully created order request (src/pages/api/
 * checkout.ts, after the order_requests row and its email have both
 * been recorded). */
export async function notifyNewOrderRequest(
  service: SupabaseClient,
  input: { requestId: string; requestNumber: string; customerName: string },
): Promise<void> {
  await createAndDeliver(service, {
    eventType: 'order_request_created',
    sourceTable: 'order_requests',
    sourceId: input.requestId,
    idempotencyKey: `order_request_created:${input.requestId}`,
    payload: {
      title: 'New order request',
      body: `${input.requestNumber} — ${input.customerName}`,
      url: `/admin/order-requests/${input.requestId}`,
      tag: `order-${input.requestId}`,
    },
  });
}

/** Admin-only, self-service test send — never accepts caller-supplied
 * title/body/url (src/pages/api/admin/push/test.ts enforces this by
 * simply not reading any of that from the request body at all). Each
 * test gets its own unique idempotency key so repeated presses of "Send
 * Test Notification" each produce a real send, not a silent no-op. */
export async function sendTestNotification(service: SupabaseClient, userId: string): Promise<void> {
  const vapid = getVapidKeys();
  if (!vapid) {
    throw new Error('Push notifications are not configured in this environment yet.');
  }
  const { data: subscriptions, error } = await service
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId);
  if (error) throw error;
  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('No devices are registered for push notifications yet.');
  }

  const payload: NotificationPayload = {
    title: 'Test notification',
    body: 'Push notifications are working on this device.',
    url: '/admin/notifications',
    tag: 'test',
  };

  for (const sub of subscriptions) {
    const keys: PushSubscriptionKeys = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth_key,
    };
    const result = await sendWebPush(keys, payload, vapid);
    if (result.outcome === 'expired') {
      await service.from('push_subscriptions').delete().eq('id', sub.id);
    }
  }
}
