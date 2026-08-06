/**
 * Server-side checkout-request route — same rationale and protections
 * as src/pages/api/contact.ts. This is an order *request*, not payment
 * processing (matches the legacy site exactly: "Payment is not
 * collected at checkout" — no card/crypto processor is integrated here
 * or anywhere in this rebuild).
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validateCheckoutSubmission } from '../../lib/form-validation';
import { checkRateLimit, cooldownSetCookieHeader, isInCooldown } from '../../lib/rate-limit';
import { sendEmail } from '../../lib/resend';

const DESTINATION_EMAIL = 'info.order.thecloud@proton.me';

function json(body: unknown, status: number, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function formatOrderSummary(
  items: { name: string; spec: string; price: number; quantity: number }[],
): string {
  return items
    .map(
      (item) =>
        `Product: ${item.name}\nOption: ${item.spec}\nQuantity: ${item.quantity}\nPrice: $${item.price.toFixed(2)}`,
    )
    .join('\n----------------------\n');
}

export const POST: APIRoute = async ({ request }) => {
  let input: Record<string, unknown>;
  try {
    input = await request.json();
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
  const rate = checkRateLimit(`checkout:${ip}`);
  if (!rate.allowed) {
    return json({ success: false, error: 'Too many requests. Please try again shortly.' }, 429);
  }

  const { result, data } = validateCheckoutSubmission(input);
  if (!result.valid || !data) {
    return json({ success: false, error: result.error ?? 'Invalid submission.' }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const fromAddress = env.RESEND_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    return json(
      { success: false, error: 'Order requests are not configured in this environment yet.' },
      503,
    );
  }

  const orderSummary = formatOrderSummary(data.items);
  const text = [
    'New Cloud Peptides Order Request',
    '',
    `Customer Name: ${data.name}`,
    `Customer Email: ${data.email}`,
    `Contact: ${data.contact}`,
    `Preferred Payment: ${data.payment}`,
    '',
    'Order Items:',
    orderSummary,
    '',
    `Subtotal: $${data.subtotal.toFixed(2)}`,
    `Shipping: ${data.shipping === 0 ? 'FREE' : '$' + data.shipping.toFixed(2)}`,
    `Total: $${data.total.toFixed(2)}`,
    '',
    `Notes: ${data.notes || 'None provided'}`,
    '',
    'Research Disclaimer: All products are intended strictly for laboratory research purposes only and are not for human consumption.',
  ].join('\n');

  const emailResult = await sendEmail({
    apiKey,
    from: fromAddress,
    to: DESTINATION_EMAIL,
    replyTo: data.email,
    subject: 'New Cloud Peptides Order Request',
    text,
  });

  if (!emailResult.success) {
    return json(
      { success: false, error: 'Could not submit your order request. Please try again.' },
      502,
    );
  }

  return json({ success: true }, 200, { 'Set-Cookie': cooldownSetCookieHeader() });
};
