/**
 * Server-side order-request route — same layered protections as
 * src/pages/api/contact.ts (launch-phase kill switch, body-size limit,
 * honeypot + cookie cooldown as secondary defenses, Cloudflare's
 * native rate-limit binding, then Resend+Turnstile activation gated
 * together, mandatory Turnstile siteverify).
 *
 * Approved product decision (Commerce Activation phase, 2026-08-08):
 * this is an order *request*, not payment processing. No card/bank/
 * crypto-wallet field exists anywhere in this route or in
 * src/lib/form-validation.ts's validateCheckoutSubmission — submitting
 * this form does not charge the customer, accept an order, or
 * reserve inventory. Cloud Peptides reviews the request and contacts
 * the customer manually afterward.
 *
 * Order requests + their line items are now persisted to Supabase
 * (order_requests/order_request_items — supabase/migrations/
 * 20260819130000_order_requests.sql, added 2026-08-19; there was
 * previously no `orders` table at all, confirmed by inspecting this
 * file's own prior history plus shop_products/admin_pricing_catalog/
 * batch_coas before adding it — see that migration's header comment).
 * The database row is the source of truth from this point forward: it
 * is inserted FIRST, before either email is attempted, and — a
 * deliberate change from this route's pre-2026-08-19 behavior, where a
 * failed email meant nothing was recorded anywhere — an email failure
 * after that insert no longer loses the request. Two independent
 * emails are still sent via Resend for every accepted request: the
 * full request to info.order.thecloud@proton.me (the human
 * notification channel), and an acknowledgement to the customer
 * stating plainly that the request was received but not yet accepted
 * and that no payment was taken. Neither send is silently swallowed —
 * a failure is logged and reflected in admin_email_sent/
 * customer_email_sent on the saved row, and the browser response below
 * still reports an honest failure for that specific case (see the two
 * `emailResult` checks) — but the underlying order_requests row, once
 * inserted, is never deleted or rolled back because of it. A push
 * notification (src/lib/push.ts's notifyNewOrderRequest) is attempted
 * last, best-effort, and can never affect whether the request was
 * saved or whether either email was attempted.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createServiceClient, createUserScopedClient } from '../../lib/auth';
import {
  buildCatalogResolver,
  validateCheckoutSubmission,
  type CheckoutSubmission,
} from '../../lib/form-validation';
import { COMMERCE_ENABLED } from '../../lib/launch-config';
import { insertOrderRequest, markOrderRequestEmailSent } from '../../lib/order-requests';
import { hasSupabaseConfig, listCheckoutCatalogEntries } from '../../lib/public-shop';
import { notifyNewOrderRequest } from '../../lib/push';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { readBodyWithLimit } from '../../lib/request-limits';
import { sendEmail } from '../../lib/resend';
import { generateRequestNumber } from '../../lib/shop';
import { verifyTurnstileToken } from '../../lib/turnstile';

const DESTINATION_EMAIL = 'info.order.thecloud@proton.me';

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function formatAddress(address: CheckoutSubmission['address']): string {
  const lines = [
    address.line1,
    address.line2,
    `${address.city}, ${address.region} ${address.postalCode}`,
    address.country,
  ];
  return lines.filter((line) => line.trim() !== '').join('\n');
}

function formatOrderSummary(items: CheckoutSubmission['items']): string {
  return items
    .map(
      (item) =>
        `Product: ${item.name}\nOption: ${item.spec}\nQuantity: ${item.quantity}\nPrice: $${item.price.toFixed(2)}`,
    )
    .join('\n----------------------\n');
}

function buildAdminEmail(
  requestNumber: string,
  data: CheckoutSubmission,
  isTestOrder: boolean,
): string {
  return [
    isTestOrder
      ? '*** TEST ORDER — submitted from a staging/non-production deployment. Not a real customer. Do not fulfill. ***'
      : null,
    'New Cloud Peptides Order Request',
    '',
    `Request Number: ${requestNumber}`,
    '',
    `Customer Name: ${data.name}`,
    `Customer Email: ${data.email}`,
    `Phone: ${data.phone || 'Not provided'}`,
    '',
    'Shipping Address:',
    formatAddress(data.address),
    '',
    'Order Items:',
    formatOrderSummary(data.items),
    '',
    `Subtotal: $${data.subtotal.toFixed(2)}`,
    `Shipping: ${data.shipping === 0 ? 'FREE' : '$' + data.shipping.toFixed(2)}`,
    `Total: $${data.total.toFixed(2)}`,
    '',
    `Notes: ${data.notes || 'None provided'}`,
    '',
    'Customer confirmed: 18+ and ordering for research use only; accepted the Shop Terms.',
    '',
    'Research Disclaimer: All products are intended strictly for laboratory research purposes only and are not for human consumption.',
    '',
    'This is an order REQUEST, not an accepted order or a completed sale. No payment has been collected. Review and contact the customer directly to proceed.',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

function buildCustomerEmail(requestNumber: string, data: CheckoutSubmission): string {
  return [
    `Hi ${data.name},`,
    '',
    `We've received your order request (Request Number: ${requestNumber}).`,
    '',
    'This is an acknowledgement that your request was received — it is not a confirmed or accepted order, and no payment has been taken. Our team will review your request and contact you at this email address (or the phone number you provided, if any) to proceed.',
    '',
    'Request summary:',
    formatOrderSummary(data.items),
    '',
    `Subtotal: $${data.subtotal.toFixed(2)}`,
    `Shipping: ${data.shipping === 0 ? 'FREE' : '$' + data.shipping.toFixed(2)}`,
    `Total (not yet charged): $${data.total.toFixed(2)}`,
    '',
    'Shipping address on file:',
    formatAddress(data.address),
    '',
    'Research use only. Not for human consumption.',
    '',
    `Questions in the meantime? Contact us at ${DESTINATION_EMAIL}.`,
    '',
    '— Cloud Peptides',
  ].join('\n');
}

export const POST: APIRoute = async ({ request, locals }) => {
  // src/middleware.ts already refuses any unauthenticated request to
  // this path before it ever reaches here — locals.session is
  // guaranteed non-null. The check below is only to satisfy strict
  // typing without a non-null assertion this far into the handler.
  const session = locals.session;
  if (!session) {
    return json({ success: false, error: 'Authentication required.' }, 401);
  }
  // Research-platform-first launch: commerce is gated behind this flag
  // (src/lib/launch-config.ts) — checked first, before any parsing/
  // rate-limit/Turnstile work, so no order can ever be submitted or
  // reach Resend while this is false, independent of whatever
  // RESEND_API_KEY/TURNSTILE_SECRET_KEY happen to be set to.
  if (!COMMERCE_ENABLED) {
    return json(
      { success: false, error: 'Ordering is not yet available. The shop launches soon.' },
      503,
    );
  }

  const bodyRead = await readBodyWithLimit(request);
  if (!bodyRead.ok) {
    return json({ success: false, error: bodyRead.error ?? 'Invalid request body.' }, 413);
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(bodyRead.text ?? '');
  } catch {
    return json({ success: false, error: 'Invalid request body.' }, 400);
  }

  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return json({ success: true }, 200);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const cookieHeader = request.headers.get('cookie');

  if (isInCooldown(cookieHeader)) {
    return json({ success: false, error: 'Please wait a moment before submitting again.' }, 429);
  }

  const rate = await checkRateLimit(env.FORM_RATE_LIMITER, `checkout:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  // Activation check — Resend AND Turnstile both required. Real, honest
  // failure — never fake a success when nothing was sent, and never
  // send an order request without the bot-defense that's supposed to
  // gate it.
  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!apiKey || !fromAddress || !turnstileSecret) {
    return json(
      { success: false, error: 'Order requests are not configured in this environment yet.' },
      503,
    );
  }

  // Turnstile — mandatory now that the secret is confirmed configured.
  const token = typeof input.turnstileToken === 'string' ? input.turnstileToken : '';
  if (!token) {
    return json({ success: false, error: 'Please complete the verification challenge.' }, 400);
  }
  const verification = await verifyTurnstileToken(turnstileSecret, token, ip);
  if (!verification.success) {
    return json({ success: false, error: 'Verification failed. Please try again.' }, 400);
  }

  // Batch 4 (2026-08-10): price/name/spec now come from the canonical
  // Supabase shop_products table, not the static shop-products.ts
  // array — queried fresh on every checkout submission (never cached),
  // published rows only, same "never trust the client, never trust
  // stale data" posture this route has always had. An honest failure
  // here, never a silent fallback to any other data source.
  if (!hasSupabaseConfig()) {
    return json(
      { success: false, error: 'Order requests are not configured in this environment yet.' },
      503,
    );
  }
  let catalogEntries;
  try {
    catalogEntries = await listCheckoutCatalogEntries(session.accessToken);
  } catch (err) {
    console.error('checkout catalog lookup failed:', err instanceof Error ? err.message : err);
    return json(
      { success: false, error: 'Could not verify product pricing right now. Please try again.' },
      502,
    );
  }
  const resolveProduct = buildCatalogResolver(catalogEntries);

  const { result, data } = validateCheckoutSubmission(input, resolveProduct);
  if (!result.valid || !data) {
    return json({ success: false, error: result.error ?? 'Invalid submission.' }, 400);
  }

  const requestNumber = generateRequestNumber();
  // src/lib/site-env.ts's isIndexableHost() (set on every request by
  // src/middleware.ts) is already the established "is this the real
  // production host" signal — reused here so a test submission made
  // on staging (or local dev) is unmistakably labeled in the email
  // itself, not just in the on-page banner (src/pages/shop/cart.astro),
  // satisfying "the staging order form must not create real customer
  // orders" even though the same real Resend send path is exercised.
  const isTestOrder = !locals.indexable;

  // The database record is the source of truth from here on — inserted
  // BEFORE either email is attempted, under the submitting researcher's
  // own JWT (RLS's order_requests_insert_own is the real boundary, not
  // this route). A failure here is a genuine, unrecoverable failure
  // (there is no request to email about yet).
  const userClient = createUserScopedClient(session.accessToken);
  let order;
  try {
    order = await insertOrderRequest(userClient, {
      requestNumber,
      researcherUserId: session.userId,
      data,
      isTestOrder,
    });
  } catch (err) {
    console.error('order_requests insert failed:', err instanceof Error ? err.message : err);
    return json(
      { success: false, error: 'Could not submit your order request. Please try again.' },
      500,
    );
  }

  const adminEmailResult = await sendEmail({
    apiKey,
    from: fromAddress,
    to: DESTINATION_EMAIL,
    replyTo: data.email,
    subject: `${isTestOrder ? '[TEST] ' : ''}New Cloud Peptides Order Request — ${requestNumber}`,
    text: buildAdminEmail(requestNumber, data, isTestOrder),
  });
  if (!adminEmailResult.success) {
    // The order is already saved and admin-visible (dashboard + push,
    // attempted below) even though this specific notification channel
    // failed — a deliberate improvement over the pre-2026-08-19
    // behavior, where a failed admin email meant the request was lost
    // entirely. The browser is still told honestly that something went
    // wrong, matching the pre-existing response contract exactly.
    let service;
    try {
      service = createServiceClient();
      await notifyNewOrderRequest(service, {
        requestId: order.id,
        requestNumber,
        customerName: data.name,
      });
    } catch (err) {
      console.error(
        'order-request push notification failed:',
        err instanceof Error ? err.message : err,
      );
    }
    return json(
      { success: false, error: 'Could not submit your order request. Please try again.' },
      502,
    );
  }
  await markOrderRequestEmailSent(userClient, order.id, 'admin_email_sent');

  const customerEmailResult = await sendEmail({
    apiKey,
    from: fromAddress,
    to: data.email,
    replyTo: DESTINATION_EMAIL,
    subject: `${isTestOrder ? '[TEST] ' : ''}We received your order request — ${requestNumber}`,
    text: buildCustomerEmail(requestNumber, data),
  });
  if (customerEmailResult.success) {
    await markOrderRequestEmailSent(userClient, order.id, 'customer_email_sent');
  }

  // Push notification — after both email attempts (whichever way they
  // went), best-effort, service-role (fans out to every admin device;
  // never reachable/callable by a client with arbitrary content — see
  // src/lib/push.ts's own header comment). Never blocks or alters the
  // response below.
  try {
    const service = createServiceClient();
    await notifyNewOrderRequest(service, {
      requestId: order.id,
      requestNumber,
      customerName: data.name,
    });
  } catch (err) {
    console.error(
      'order-request push notification failed:',
      err instanceof Error ? err.message : err,
    );
  }

  if (!customerEmailResult.success) {
    // The admin already has the full order details at this point (the
    // send above succeeded, and the record itself is saved) — but the
    // customer never got their acknowledgement, so this is still an
    // honest failure to the browser, not a fake success, per the
    // approved product decision.
    return json(
      {
        success: false,
        error:
          "Your order request was recorded, but we could not send your confirmation email. We will still be in touch — contact us if you don't hear back soon.",
      },
      502,
    );
  }

  return json({ success: true, requestNumber }, 200, { 'Set-Cookie': cooldownSetCookieHeader() });
};
