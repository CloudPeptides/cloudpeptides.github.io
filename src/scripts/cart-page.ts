/**
 * Cart page rendering + checkout submission. Business rules (minimum 2
 * kits, $15/free shipping) live in src/lib/shop.ts; this file only
 * wires the DOM and calls the server-side checkout route
 * (src/pages/api/checkout.ts) — replacing the legacy site's client-side
 * Web3Forms call (which embedded a public API key in browser JS) with a
 * route that keeps the Resend API key server-only.
 */
import { calculateCartTotals, formatMoney, meetsMinimumOrder, type CartItem } from '../lib/shop';
import {
  getCart,
  increaseQuantity,
  decreaseQuantity,
  removeCartItem,
  clearCart,
  updateCartCountBadges,
} from './cart-storage';

function renderCart(): void {
  const cartItemsEl = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const shippingEl = document.getElementById('shipping');
  const totalEl = document.getElementById('total');
  const checkoutForm = document.getElementById('checkoutForm');
  const emptyPanel = document.getElementById('cartEmptyPanel');
  if (!cartItemsEl) return;

  const cart = getCart();

  if (cart.length === 0) {
    cartItemsEl.hidden = true;
    if (checkoutForm) checkoutForm.hidden = true;
    if (emptyPanel) emptyPanel.hidden = false;
    if (subtotalEl) subtotalEl.textContent = formatMoney(0);
    if (shippingEl) shippingEl.textContent = formatMoney(0);
    if (totalEl) totalEl.textContent = formatMoney(0);
    return;
  }

  cartItemsEl.hidden = false;
  if (checkoutForm) checkoutForm.hidden = false;
  if (emptyPanel) emptyPanel.hidden = true;

  cartItemsEl.innerHTML = cart
    .map(
      (item, index) => `
    <div class="cp-cart-item" data-cart-item>
      <div class="cp-cart-item__info">
        <p class="cp-cart-item__name">${escapeHtml(item.name)}</p>
        <p class="cp-cart-item__spec">${escapeHtml(item.spec)}</p>
        <p class="cp-cart-item__price">${formatMoney(item.price)} each</p>
      </div>
      <div class="cp-cart-item__qty">
        <button type="button" data-qty-decrease="${index}" aria-label="Decrease quantity">−</button>
        <span aria-live="polite">${item.quantity}</span>
        <button type="button" data-qty-increase="${index}" aria-label="Increase quantity">+</button>
      </div>
      <button type="button" data-remove-item="${index}" class="cp-cart-item__remove">Remove</button>
    </div>`,
    )
    .join('');

  const totals = calculateCartTotals(cart);
  if (subtotalEl) subtotalEl.textContent = formatMoney(totals.subtotal);
  if (shippingEl)
    shippingEl.textContent = totals.shipping === 0 ? 'FREE' : formatMoney(totals.shipping);
  if (totalEl) totalEl.textContent = formatMoney(totals.total);

  cartItemsEl.querySelectorAll<HTMLButtonElement>('[data-qty-increase]').forEach((btn) => {
    btn.addEventListener('click', () => {
      increaseQuantity(Number(btn.dataset.qtyIncrease));
      updateCartCountBadges();
      renderCart();
    });
  });
  cartItemsEl.querySelectorAll<HTMLButtonElement>('[data-qty-decrease]').forEach((btn) => {
    btn.addEventListener('click', () => {
      decreaseQuantity(Number(btn.dataset.qtyDecrease));
      updateCartCountBadges();
      renderCart();
    });
  });
  cartItemsEl.querySelectorAll<HTMLButtonElement>('[data-remove-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      removeCartItem(Number(btn.dataset.removeItem));
      updateCartCountBadges();
      renderCart();
    });
  });
}

function escapeHtml(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function setFormMessage(message: string, tone: 'error' | 'info'): void {
  const el = document.getElementById('checkoutFormMessage');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
  el.hidden = !message;
}

async function submitOrder(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const cart = getCart();
  const totals = calculateCartTotals(cart);

  if (!meetsMinimumOrder(totals)) {
    setFormMessage('Minimum order is 2 kits. Add one more kit to continue.', 'error');
    return;
  }

  const name = (document.getElementById('customerName') as HTMLInputElement).value.trim();
  const email = (document.getElementById('customerEmail') as HTMLInputElement).value.trim();
  const contact = (document.getElementById('customerContact') as HTMLInputElement).value.trim();
  const payment = (document.getElementById('paymentMethod') as HTMLSelectElement).value;
  const notes = (document.getElementById('customerNotes') as HTMLTextAreaElement).value.trim();
  const honeypot =
    (document.getElementById('checkoutHoneypot') as HTMLInputElement | null)?.value ?? '';

  if (!name || !email || !contact || !payment) {
    setFormMessage('Please complete all required checkout fields.', 'error');
    return;
  }

  const button = document.getElementById('submitOrder') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Submitting…';
  setFormMessage('', 'info');

  const items: CartItem[] = cart;

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'checkout',
        name,
        email,
        contact,
        payment,
        notes,
        items,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        website: honeypot, // honeypot field — real users never fill this
      }),
    });
    const result = (await response.json()) as { success: boolean; error?: string };

    if (result.success) {
      clearCart();
      updateCartCountBadges();
      form.hidden = true;
      const cartItemsEl = document.getElementById('cartItems');
      const cartTotal = document.querySelector('.cp-cart-total');
      if (cartItemsEl) cartItemsEl.hidden = true;
      if (cartTotal) (cartTotal as HTMLElement).hidden = true;
      const success = document.getElementById('successMessage');
      if (success) success.hidden = false;
    } else {
      setFormMessage(
        result.error || 'There was an error submitting your order. Please try again.',
        'error',
      );
    }
  } catch {
    setFormMessage('There was an error submitting your order. Please try again.', 'error');
  }

  button.disabled = false;
  button.textContent = 'Place Order Request';
}

function init(): void {
  updateCartCountBadges();
  renderCart();
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm?.addEventListener('submit', submitOrder);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
