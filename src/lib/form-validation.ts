/**
 * Shared validation/sanitization for the contact and checkout Worker
 * routes (src/pages/api/contact.ts, src/pages/api/checkout.ts). Pure,
 * no fetch/Request/Resend dependency — unit-testable directly, and kept
 * out of the route handlers so the actual HTTP wiring stays thin.
 */
import { PRODUCTS } from './shop-products';

const MAX_SHORT_FIELD = 200;
const MAX_LONG_FIELD = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Rejects newlines/carriage returns in single-line fields — the
 * standard defense against email-header-injection via form fields that
 * get interpolated into a "From"/"Reply-To"/"Subject" header. */
export function isSingleLineSafe(value: string): boolean {
  return !/[\r\n]/.test(value);
}

export function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // Strip control characters (except tab) — never trust raw form input
  // in an email body/header context.
  // eslint-disable-next-line no-control-regex
  const stripped = value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  return stripped.trim().slice(0, maxLength);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= MAX_SHORT_FIELD;
}

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

export function validateContactSubmission(input: Record<string, unknown>): {
  result: ValidationResult;
  data?: ContactSubmission;
} {
  const name = sanitizeText(input.name, MAX_SHORT_FIELD);
  const email = sanitizeText(input.email, MAX_SHORT_FIELD);
  const message = sanitizeText(input.message, MAX_LONG_FIELD);

  if (!name || !email || !message) {
    return { result: { valid: false, error: 'Please complete all required fields.' } };
  }
  if (!isValidEmail(email)) {
    return { result: { valid: false, error: 'Please enter a valid email address.' } };
  }
  if (!isSingleLineSafe(name) || !isSingleLineSafe(email)) {
    return { result: { valid: false, error: 'Invalid characters in submitted fields.' } };
  }
  return { result: { valid: true }, data: { name, email, message } };
}

/**
 * Order-request checkout (Commerce Activation phase, 2026-08-08). This
 * is deliberately NOT a payment flow — no card/bank/crypto-wallet
 * field exists anywhere in this module, matching the approved product
 * decision: "Customers may build a cart and submit an order request.
 * The request is not an accepted sale or completed purchase." Every
 * field collected below is exactly the approved list: name, email,
 * optional phone, shipping address, notes, an 18+/research-use
 * attestation, and Shop Terms acceptance.
 *
 * Pricing is never trusted from the client at all — not even the
 * per-item price. Each cart line is looked up by (productId,
 * optionCode) against the real catalog (src/lib/shop-products.ts) and
 * its name/spec/price are read from there; a client sending a
 * fabricated price, name, or spec for a real product id has all of it
 * silently discarded and replaced with the authoritative catalog
 * values, exactly the same "recompute, never trust" posture the
 * previous version of this function already applied to
 * subtotal/shipping/total.
 */
export interface CheckoutItemInput {
  productId: string;
  optionCode: string;
  quantity: number;
}

export interface ResolvedCheckoutItem {
  productId: string;
  optionCode: string;
  name: string;
  spec: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CheckoutSubmission {
  name: string;
  email: string;
  phone: string;
  address: ShippingAddress;
  notes: string;
  items: ResolvedCheckoutItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

/** Looks up the real product/option by id+code — the only source of
 * truth for name/spec/price. Returns null for an id/code pair that
 * doesn't exist in the catalog (a stale cart entry, or a tampered
 * request), which the caller treats as a hard validation failure. */
function resolveProduct(
  productId: string,
  optionCode: string,
): { name: string; spec: string; price: number } | null {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;
  const option = product.options.find((o) => o.code === optionCode);
  if (!option) return null;
  return { name: product.name, spec: option.spec, price: option.price };
}

export function validateCheckoutSubmission(input: Record<string, unknown>): {
  result: ValidationResult;
  data?: CheckoutSubmission;
} {
  const name = sanitizeText(input.name, MAX_SHORT_FIELD);
  const email = sanitizeText(input.email, MAX_SHORT_FIELD);
  const phone = sanitizeText(input.phone, MAX_SHORT_FIELD); // optional
  const notes = sanitizeText(input.notes, MAX_LONG_FIELD);

  const rawAddress =
    typeof input.address === 'object' && input.address !== null
      ? (input.address as Record<string, unknown>)
      : {};
  const line1 = sanitizeText(rawAddress.line1, MAX_SHORT_FIELD);
  const line2 = sanitizeText(rawAddress.line2, MAX_SHORT_FIELD); // optional
  const city = sanitizeText(rawAddress.city, MAX_SHORT_FIELD);
  const region = sanitizeText(rawAddress.region, MAX_SHORT_FIELD);
  const postalCode = sanitizeText(rawAddress.postalCode, MAX_SHORT_FIELD);
  const country = sanitizeText(rawAddress.country, MAX_SHORT_FIELD);

  const ageAttestation = input.ageAttestation === true;
  const termsAccepted = input.termsAccepted === true;

  if (!name || !email || !line1 || !city || !region || !postalCode || !country) {
    return { result: { valid: false, error: 'Please complete all required checkout fields.' } };
  }
  if (!isValidEmail(email)) {
    return { result: { valid: false, error: 'Please enter a valid email address.' } };
  }
  if (!ageAttestation) {
    return {
      result: {
        valid: false,
        error: 'You must confirm you are 18+ and ordering for research use only.',
      },
    };
  }
  if (!termsAccepted) {
    return {
      result: { valid: false, error: 'You must accept the Shop Terms to submit an order request.' },
    };
  }
  const singleLineFields = [name, email, phone, line1, line2, city, region, postalCode, country];
  if (!singleLineFields.every(isSingleLineSafe)) {
    return { result: { valid: false, error: 'Invalid characters in submitted fields.' } };
  }

  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) {
    return { result: { valid: false, error: 'Your cart is empty.' } };
  }
  const items: ResolvedCheckoutItem[] = [];
  for (const raw of rawItems) {
    if (typeof raw !== 'object' || raw === null) {
      return { result: { valid: false, error: 'Invalid cart contents.' } };
    }
    const r = raw as Record<string, unknown>;
    const productId = sanitizeText(r.productId, MAX_SHORT_FIELD);
    const optionCode = sanitizeText(r.optionCode, MAX_SHORT_FIELD);
    const quantity = Number(r.quantity);
    if (!productId || !optionCode || !Number.isInteger(quantity) || quantity <= 0) {
      return { result: { valid: false, error: 'Invalid cart contents.' } };
    }
    const resolved = resolveProduct(productId, optionCode);
    if (!resolved) {
      return { result: { valid: false, error: 'One or more cart items are no longer available.' } };
    }
    items.push({
      productId,
      optionCode,
      name: resolved.name,
      spec: resolved.spec,
      price: resolved.price,
      quantity,
    });
  }

  const kitCount = items.reduce((sum, i) => sum + i.quantity, 0);
  if (kitCount < 2) {
    return { result: { valid: false, error: 'Minimum order is 2 kits.' } };
  }

  // Server-side recomputation of totals — never trust the client's
  // reported subtotal/shipping/total, only the itemized cart contents
  // resolved against the real catalog above (same shipping rule as
  // src/lib/shop.ts, duplicated narrowly here to avoid importing
  // DOM-adjacent code into the Worker route; kept in sync manually,
  // covered by tests/unit/form-validation.test.ts).
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = kitCount >= 3 ? 0 : 15;
  const total = subtotal + shipping;

  return {
    result: { valid: true },
    data: {
      name,
      email,
      phone,
      address: { line1, line2, city, region, postalCode, country },
      notes,
      items,
      subtotal,
      shipping,
      total,
    },
  };
}
