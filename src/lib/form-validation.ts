/**
 * Shared validation/sanitization for the contact and checkout Worker
 * routes (src/pages/api/contact.ts, src/pages/api/checkout.ts). Pure,
 * no fetch/Request/Resend dependency — unit-testable directly, and kept
 * out of the route handlers so the actual HTTP wiring stays thin.
 */

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

const ALLOWED_PAYMENT_METHODS = ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Zelle', 'PayPal'];

export interface CheckoutItem {
  name: string;
  spec: string;
  price: number;
  quantity: number;
}

export interface CheckoutSubmission {
  name: string;
  email: string;
  contact: string;
  payment: string;
  notes: string;
  items: CheckoutItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export function validateCheckoutSubmission(input: Record<string, unknown>): {
  result: ValidationResult;
  data?: CheckoutSubmission;
} {
  const name = sanitizeText(input.name, MAX_SHORT_FIELD);
  const email = sanitizeText(input.email, MAX_SHORT_FIELD);
  const contact = sanitizeText(input.contact, MAX_SHORT_FIELD);
  const payment = sanitizeText(input.payment, MAX_SHORT_FIELD);
  const notes = sanitizeText(input.notes, MAX_LONG_FIELD);

  if (!name || !email || !contact || !payment) {
    return { result: { valid: false, error: 'Please complete all required checkout fields.' } };
  }
  if (!isValidEmail(email)) {
    return { result: { valid: false, error: 'Please enter a valid email address.' } };
  }
  if (!ALLOWED_PAYMENT_METHODS.includes(payment)) {
    return { result: { valid: false, error: 'Please select a valid payment method.' } };
  }
  if (![name, email, contact, payment].every(isSingleLineSafe)) {
    return { result: { valid: false, error: 'Invalid characters in submitted fields.' } };
  }

  const rawItems = Array.isArray(input.items) ? input.items : [];
  if (rawItems.length === 0) {
    return { result: { valid: false, error: 'Your cart is empty.' } };
  }
  const items: CheckoutItem[] = [];
  for (const raw of rawItems) {
    if (typeof raw !== 'object' || raw === null) {
      return { result: { valid: false, error: 'Invalid cart contents.' } };
    }
    const r = raw as Record<string, unknown>;
    const itemName = sanitizeText(r.name, MAX_SHORT_FIELD);
    const spec = sanitizeText(r.spec, MAX_SHORT_FIELD);
    const price = Number(r.price);
    const quantity = Number(r.quantity);
    if (
      !itemName ||
      !spec ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return { result: { valid: false, error: 'Invalid cart contents.' } };
    }
    items.push({ name: itemName, spec, price, quantity });
  }

  const kitCount = items.reduce((sum, i) => sum + i.quantity, 0);
  if (kitCount < 2) {
    return { result: { valid: false, error: 'Minimum order is 2 kits.' } };
  }

  // Server-side recomputation of totals — never trust the client's
  // reported subtotal/shipping/total, only the itemized cart contents
  // (same shipping rule as src/lib/shop.ts, duplicated narrowly here to
  // avoid importing DOM-adjacent code into the Worker route; kept in
  // sync manually, covered by tests/unit/form-validation.test.ts).
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = kitCount >= 3 ? 0 : 15;
  const total = subtotal + shipping;

  return {
    result: { valid: true },
    data: { name, email, contact, payment, notes, items, subtotal, shipping, total },
  };
}
