/**
 * Framework-free live search/filter/sort for the compound directory.
 * Deliberately not a React island: filtering a rendered card grid by
 * matching data-attributes is straightforward DOM work with no complex
 * shared state, so it doesn't meet the bar CLAUDE.md sets for React
 * (genuine interaction complexity — comparison tools, the admin editor).
 * Progressive enhancement: without JS, every card is simply listed,
 * unfiltered — nothing breaks, the enhancement is additive.
 */
interface CardState {
  el: HTMLElement;
  name: string;
  entityKind: string;
  category: string;
  identityConfidence: string;
}

function initCompoundSearch(): void {
  const grid = document.querySelector<HTMLElement>('[data-compound-grid]');
  const searchInput = document.querySelector<HTMLInputElement>('[data-compound-search]');
  const entityKindSelect = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]');
  const categorySelect = document.querySelector<HTMLSelectElement>('[data-filter-category]');
  const confidenceSelect = document.querySelector<HTMLSelectElement>('[data-filter-confidence]');
  const sortSelect = document.querySelector<HTMLSelectElement>('[data-sort]');
  const resultCount = document.querySelector<HTMLElement>('[data-result-count]');
  const emptyState = document.querySelector<HTMLElement>('[data-filter-empty-state]');
  const clearButton = document.querySelector<HTMLButtonElement>('[data-clear-filters]');

  if (!grid) return;
  const gridEl: HTMLElement = grid;

  const cards: CardState[] = Array.from(
    gridEl.querySelectorAll<HTMLElement>('[data-compound-item]'),
  ).map((el) => ({
    el,
    name: el.dataset.name ?? '',
    entityKind: el.dataset.entityKind ?? '',
    category: el.dataset.category ?? '',
    identityConfidence: el.dataset.identityConfidence ?? '',
  }));

  function apply(): void {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    const entityKind = entityKindSelect?.value ?? '';
    const category = categorySelect?.value ?? '';
    const confidence = confidenceSelect?.value ?? '';
    const sort = sortSelect?.value ?? 'name-asc';

    let visible = 0;
    for (const card of cards) {
      const matches =
        (!query || card.name.toLowerCase().includes(query)) &&
        (!entityKind || card.entityKind === entityKind) &&
        (!category || card.category === category) &&
        (!confidence || card.identityConfidence === confidence);
      card.el.hidden = !matches;
      if (matches) visible++;
    }

    const sorted = [...cards].sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name);
    });
    for (const card of sorted) gridEl.appendChild(card.el);

    if (resultCount) resultCount.textContent = `${visible} compound${visible === 1 ? '' : 's'}`;
    if (emptyState) emptyState.hidden = visible !== 0;
  }

  searchInput?.addEventListener('input', apply);
  entityKindSelect?.addEventListener('change', apply);
  categorySelect?.addEventListener('change', apply);
  confidenceSelect?.addEventListener('change', apply);
  sortSelect?.addEventListener('change', apply);
  clearButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (entityKindSelect) entityKindSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (confidenceSelect) confidenceSelect.value = '';
    apply();
  });

  apply();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCompoundSearch);
} else {
  initCompoundSearch();
}

// Marks this file as an ES module (it has no other top-level import/
// export) — needed so `import()`-ing it from tests/unit/compound-search.test.ts
// resolves as a module rather than an ambient script.
export {};
