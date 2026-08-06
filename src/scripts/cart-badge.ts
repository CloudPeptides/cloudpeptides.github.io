/**
 * Keeps the nav cart-count badge in sync on every page load — matches
 * the legacy site's updateCartCount() being wired globally via
 * js/cart.js on every page. Cart mutations on the shop/cart pages
 * themselves also call updateCartCountBadges() directly (see
 * cart-page.ts) so the badge updates immediately without a reload.
 */
import { updateCartCountBadges } from './cart-storage';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateCartCountBadges);
} else {
  updateCartCountBadges();
}

export {};
