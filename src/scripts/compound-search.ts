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
  // Optional — only present in the current directory layout (design
  // concept restyle), guarded throughout so this file's original DOM
  // contract/tests still work unchanged without any of these elements.
  const searchEcho = document.querySelector<HTMLElement>('[data-search-echo]');
  const chipsContainer = document.querySelector<HTMLElement>('[data-active-chips]');
  const filterToggle = document.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const sidebar = document.querySelector<HTMLElement>('[data-sidebar]');

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

    if (searchEcho) {
      searchEcho.textContent = '';
      if (query) {
        searchEcho.innerHTML = '';
        const prefix = document.createTextNode('Showing results for ');
        const strong = document.createElement('strong');
        strong.textContent = (searchInput?.value ?? '').trim();
        searchEcho.append(prefix, strong);
      }
    }

    if (chipsContainer) renderChips(entityKind, category, confidence);
  }

  function chipLabel(select: HTMLSelectElement | undefined | null, value: string): string {
    if (!select) return value;
    const option = Array.from(select.options).find((o) => o.value === value);
    return option?.textContent ?? value;
  }

  function renderChips(entityKind: string, category: string, confidence: string): void {
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';
    const candidates: ({ label: string; clear: () => void } | null)[] = [
      entityKind
        ? {
            label: chipLabel(entityKindSelect, entityKind),
            clear: () => {
              if (entityKindSelect) entityKindSelect.value = '';
            },
          }
        : null,
      category
        ? {
            label: chipLabel(categorySelect, category),
            clear: () => {
              if (categorySelect) categorySelect.value = '';
            },
          }
        : null,
      confidence
        ? {
            label: chipLabel(confidenceSelect, confidence),
            clear: () => {
              if (confidenceSelect) confidenceSelect.value = '';
            },
          }
        : null,
    ];
    const active = candidates.filter((c): c is { label: string; clear: () => void } => c !== null);

    for (const chip of active) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cp-chip';
      btn.setAttribute('aria-label', `Remove filter: ${chip.label}`);
      btn.innerHTML = `${chip.label} <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>`;
      btn.addEventListener('click', () => {
        chip.clear();
        apply();
      });
      chipsContainer.appendChild(btn);
    }
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

  filterToggle?.addEventListener('click', () => {
    const open = sidebar?.hasAttribute('data-open') ?? false;
    if (open) {
      sidebar?.removeAttribute('data-open');
    } else {
      sidebar?.setAttribute('data-open', '');
    }
    filterToggle.setAttribute('aria-expanded', String(!open));
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
