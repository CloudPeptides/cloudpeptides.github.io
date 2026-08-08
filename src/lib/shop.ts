/**
 * Pure shop/cart math and filtering — extracted from DOM-touching code
 * so it's unit-testable without a browser, same pattern as
 * src/lib/theme.ts. Business rules ported exactly from the legacy site
 * (legacy-site/js/cart.js, shop.js, product.js):
 *   - shipping: $15 flat unless 3+ kits are in the cart, then free
 *   - minimum order to check out: 2 kits
 *   - subtotal is a straight sum of price × quantity, no tax
 *   - the "$5 non-crypto processing fee" mentioned on the legacy cart
 *     page was disclosed copy only, never actually added to the total —
 *     preserved as disclosure-only here too, not computed.
 */
import type { Product } from './shop-products';

export const SHIPPING_COST = 15;
export const FREE_SHIPPING_KIT_THRESHOLD = 3;
export const MINIMUM_ORDER_KITS = 2;

export function formatMoney(amount: number): string {
  return '$' + amount.toFixed(2);
}

/** The cheapest option on a product — used for "from $X" list pricing. */
export function lowestPriceOption(product: Product) {
  return product.options.reduce((a, b) => (a.price < b.price ? a : b), product.options[0]);
}

export interface ShopFilter {
  category: string; // '' or 'all' means no category filter
  search: string;
}

/** Matches the legacy shop.js render() predicate exactly: category match
 * (or 'all') AND (name contains search OR any option code contains
 * search), case-insensitive. */
export function filterProducts(products: Product[], filter: ShopFilter): Product[] {
  const search = filter.search.trim().toLowerCase();
  const category = filter.category;
  return products.filter((p) => {
    const matchesCategory = !category || category === 'all' || p.category === category;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search) ||
      p.options.some((o) => o.code.toLowerCase().includes(search));
    return matchesCategory && matchesSearch;
  });
}

export interface CartItem {
  productId: string;
  optionCode: string;
  name: string;
  spec: string;
  price: number;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  total: number;
  kitCount: number;
}

export function calculateCartTotals(cart: CartItem[]): CartTotals {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const kitCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = kitCount >= FREE_SHIPPING_KIT_THRESHOLD ? 0 : kitCount > 0 ? SHIPPING_COST : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total, kitCount };
}

export function meetsMinimumOrder(totals: CartTotals): boolean {
  return totals.kitCount >= MINIMUM_ORDER_KITS;
}

// Excludes visually-ambiguous characters (0/O, 1/I) so a request
// number read aloud or handwritten during manual review doesn't get
// transcribed wrong.
const REQUEST_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A human-readable order-request identifier — CP-YYYYMMDD-XXXXXX.
 * Not a database primary key (no orders table exists; the email sent
 * via Resend to info.order.thecloud@proton.me *is* the order record,
 * matching this project's existing shop/checkout architecture) — this
 * is purely what staff and the customer both see and can reference
 * out of band (e.g. "regarding request CP-20260808-7K4QRM"). Uses
 * crypto.getRandomValues (available globally in the Workers runtime,
 * already used the same way by src/middleware.ts's generateNonce())
 * rather than Math.random for real entropy. */
export function generateRequestNumber(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(
    bytes,
    (b) => REQUEST_NUMBER_ALPHABET[b % REQUEST_NUMBER_ALPHABET.length],
  ).join('');
  return `CP-${y}${m}${d}-${suffix}`;
}
