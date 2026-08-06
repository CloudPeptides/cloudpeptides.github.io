/**
 * Framework-free live search/filter for the shop grid — same pattern and
 * same "not a genuine interaction complexity case" reasoning as
 * src/scripts/compound-search.ts. Progressive enhancement: without JS
 * every product card is simply listed, unfiltered. Filters against the
 * rendered DOM's data-attributes (same approach as compound-search.ts)
 * rather than importing lib/shop.ts's filterProducts() against Product
 * objects — the matching predicate is identical, just applied to
 * markup already on the page.
 */

interface CardState {
  el: HTMLElement;
  id: string;
  name: string;
  category: string;
  codes: string;
}

function initShopSearch(): void {
  const grid = document.querySelector<HTMLElement>('[data-shop-grid]');
  const searchInput = document.querySelector<HTMLInputElement>('[data-shop-search]');
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('[data-shop-filter]');
  const jumpButtons = document.querySelectorAll<HTMLButtonElement>('[data-shop-filter-jump]');
  const emptyState = document.querySelector<HTMLElement>('[data-shop-empty-state]');

  if (!grid) return;
  const gridEl: HTMLElement = grid;

  const cards: CardState[] = Array.from(
    gridEl.querySelectorAll<HTMLElement>('[data-shop-item]'),
  ).map((el) => ({
    el,
    id: el.dataset.id ?? '',
    name: el.dataset.name ?? '',
    category: el.dataset.category ?? '',
    codes: el.dataset.codes ?? '',
  }));

  let activeCategory = 'all';

  function setActiveButton(category: string): void {
    filterButtons.forEach((b) =>
      b.classList.toggle('is-active', b.dataset.shopFilter === category),
    );
  }

  function apply(): void {
    const search = (searchInput?.value ?? '').trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matchesCategory = activeCategory === 'all' || card.category === activeCategory;
      const matchesSearch =
        !search || card.name.toLowerCase().includes(search) || card.codes.includes(search);
      const matches = matchesCategory && matchesSearch;
      card.el.hidden = !matches;
      if (matches) visible++;
    }
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.shopFilter ?? 'all';
      setActiveButton(activeCategory);
      apply();
    });
  });

  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.shopFilterJump ?? 'all';
      setActiveButton(activeCategory);
      apply();
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  searchInput?.addEventListener('input', apply);

  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShopSearch);
} else {
  initShopSearch();
}

// See compound-search.ts for why this no-op export exists.
export {};
