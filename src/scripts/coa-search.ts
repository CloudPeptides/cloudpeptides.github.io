/**
 * Framework-free live search/filter for the public COA gallery — same
 * pattern as src/scripts/shop-search.ts (filters against the rendered
 * DOM's data-attributes, progressive enhancement: without JS every
 * COA card is simply listed, unfiltered).
 */

interface CardState {
  el: HTMLElement;
  peptide: string;
  batch: string;
  lab: string;
}

function initCoaSearch(): void {
  const grid = document.querySelector<HTMLElement>('[data-coa-grid]');
  const searchInput = document.querySelector<HTMLInputElement>('[data-coa-search]');
  const labSelect = document.querySelector<HTMLSelectElement>('[data-coa-lab-filter]');
  const emptyState = document.querySelector<HTMLElement>('[data-coa-empty-state]');

  if (!grid) return;
  const gridEl: HTMLElement = grid;

  const cards: CardState[] = Array.from(
    gridEl.querySelectorAll<HTMLElement>('[data-coa-item]'),
  ).map((el) => ({
    el,
    peptide: (el.dataset.peptide ?? '').toLowerCase(),
    batch: (el.dataset.batch ?? '').toLowerCase(),
    lab: el.dataset.lab ?? '',
  }));

  function apply(): void {
    const search = (searchInput?.value ?? '').trim().toLowerCase();
    const lab = labSelect?.value ?? '';
    let visible = 0;
    for (const card of cards) {
      const matchesLab = !lab || lab === 'all' || card.lab === lab;
      const matchesSearch = !search || card.peptide.includes(search) || card.batch.includes(search);
      const matches = matchesLab && matchesSearch;
      card.el.hidden = !matches;
      if (matches) visible++;
    }
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  searchInput?.addEventListener('input', apply);
  labSelect?.addEventListener('change', apply);

  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoaSearch);
} else {
  initCoaSearch();
}

export {};
