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

declare global {
  interface Window {
    __cpProduct?: PageProduct;
  }
}

function init(): void {
  const product = window.__cpProduct;
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
