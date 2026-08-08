/**
 * localStorage-backed cart persistence — framework-free, matching the
 * legacy site's approach (cart survives navigation/refresh, per-browser,
 * no account/session needed). Pure math lives in src/lib/shop.ts; this
 * file is only the DOM/storage-touching wrapper around it.
 */
import { calculateCartTotals, type CartItem, type CartTotals } from '../lib/shop';

const STORAGE_KEY = 'cp-shop-cart';

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // Corrupted/foreign localStorage value — degrade to an empty cart
    // rather than throwing and breaking every page that reads it.
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function addToCart(item: Omit<CartItem, 'quantity'>): CartItem[] {
  const cart = getCart();
  const existing = cart.find(
    (c) => c.productId === item.productId && c.optionCode === item.optionCode,
  );
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  return cart;
}

export function increaseQuantity(index: number): CartItem[] {
  const cart = getCart();
  if (cart[index]) cart[index].quantity += 1;
  saveCart(cart);
  return cart;
}

export function decreaseQuantity(index: number): CartItem[] {
  const cart = getCart();
  if (cart[index] && cart[index].quantity > 1) cart[index].quantity -= 1;
  saveCart(cart);
  return cart;
}

export function removeCartItem(index: number): CartItem[] {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  return cart;
}

export function cartTotals(): CartTotals {
  return calculateCartTotals(getCart());
}

/** Updates every `[data-cart-count]` element on the page (nav badge,
 * etc.) to the current total kit count. Called on every shop-page load
 * and after every cart mutation. */
export function updateCartCountBadges(): void {
  const totals = cartTotals();
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(totals.kitCount);
    el.hidden = totals.kitCount === 0;
  });
}
