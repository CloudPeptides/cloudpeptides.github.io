/**
 * Product detail page interactions — rebuild of legacy-site/js/product.js
 * (option select updates price/code) + the inline add-to-cart handler
 * from legacy-site/product.html, using the shared cart-storage module
 * instead of hand-rolled localStorage calls.
 */
import { formatMoney } from '../lib/shop';
import { addToCart, updateCartCountBadges } from './cart-storage';

interface ProductOption {
  code: string;
  spec: string;
  count: number;
  price: number;
}
interface PageProduct {
  id: string;
  name: string;
  options: ProductOption[];
}

/** Read from the inert `application/json` data island (Batch 4,
 * 2026-08-10) rather than a `window.__cpProduct` set by an inline
 * `<script>` — an application/json script tag is never executed by the
 * browser, so it's outside the script-src CSP directive entirely (the
 * previous inline-script bridge got hoisted by Astro's bundler in a way
 * that silently dropped its nonce, so CSP correctly blocked it and
 * "Add to Cart" never actually ran — a pre-existing bug found and fixed
 * alongside this batch's cart regression tests). */
function readProduct(): PageProduct | null {
  const el = document.getElementById('cpProductData');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as PageProduct | null;
  } catch {
    return null;
  }
}

function init(): void {
  const product = readProduct();
  if (!product) return;

  const select = document.querySelector<HTMLSelectElement>('[data-option-select]');
  const priceEl = document.querySelector<HTMLElement>('[data-price]');
  const codeLineEl = document.querySelector<HTMLElement>('[data-code-line]');
  const addButton = document.querySelector<HTMLButtonElement>('[data-add-to-cart]');
  const feedback = document.querySelector<HTMLElement>('[data-add-feedback]');
  const categoryText = codeLineEl?.textContent?.split('•')[1]?.trim() ?? '';

  function currentOption(): ProductOption {
    const index = Number(select?.value ?? 0);
    return product!.options[index] ?? product!.options[0];
  }

  function updateDisplay(): void {
    const option = currentOption();
    if (priceEl) priceEl.textContent = formatMoney(option.price);
    if (codeLineEl) codeLineEl.textContent = `Code: ${option.code} • ${categoryText}`;
  }

  select?.addEventListener('change', updateDisplay);

  addButton?.addEventListener('click', () => {
    const option = currentOption();
    addToCart({
      productId: product.id,
      optionCode: option.code,
      name: product.name,
      spec: `${option.spec} • ${option.count} vial kit`,
      price: option.price,
    });
    updateCartCountBadges();
    if (feedback) {
      feedback.hidden = false;
      window.clearTimeout((feedback as HTMLElement & { __hideTimer?: number }).__hideTimer);
      (feedback as HTMLElement & { __hideTimer?: number }).__hideTimer = window.setTimeout(() => {
        feedback.hidden = true;
      }, 3000);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
