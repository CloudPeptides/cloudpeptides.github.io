/**
 * Framework-free live search/filter/sort/pagination for the compound
 * directory. Deliberately not a React island: filtering a rendered card
 * grid by matching data-attributes is straightforward DOM work with no
 * complex shared state, so it doesn't meet the bar CLAUDE.md sets for
 * React (genuine interaction complexity — comparison tools, the admin
 * editor). Progressive enhancement: without JS, every card is simply
 * listed, unfiltered — nothing breaks, the enhancement is additive.
 *
 * Phase 3 extends the original name/type/category/identity filtering
 * with: alias search, evidence-type / evidence-strength / human-evidence
 * / regulatory-status filters, evidence-strength / study-count /
 * recently-updated sorting, and simple "show more" pagination — all
 * still driven entirely by data-* attributes already present in the
 * server-rendered HTML (src/lib/supabase.ts computes them, index.astro
 * writes them onto each card wrapper), so there's still no separate
 * client-side data fetch or duplicated filtering logic.
 *
 * 2026-08-20 (approved): Compounds/Stacks tabs. Canonical classification
 * only — a card belongs to Stacks iff its own data-entity-kind is
 * literally 'stack' (src/lib/supabase.ts derives this straight from
 * compounds.entity_kind; nothing here infers "stack" from a name
 * containing "+" or multiple words). Tab state is optional/guarded
 * exactly like every other element in this file marked "Optional" below
 * — a page with no tab markup (e.g. the pre-2026-08-20 unit test fixture)
 * behaves exactly as before, with every entity kind shown together.
 */
const PAGE_SIZE = 24;

const EVIDENCE_QUALITY_RANK: Record<string, number> = {
  high: 4,
  moderate: 3,
  low: 2,
  very_low: 1,
  not_assessed: 0,
};

type DirectoryTab = 'compounds' | 'stacks';
const VALID_SORTS = new Set([
  'name-asc',
  'name-desc',
  'evidence-desc',
  'studies-desc',
  'updated-desc',
]);

interface CardState {
  el: HTMLElement;
  name: string;
  searchName: string;
  aliases: string;
  entityKind: string;
  category: string;
  identityConfidence: string;
  evidenceTypes: string[];
  evidenceQuality: string;
  hasHumanEvidence: boolean;
  regulatoryStatuses: string[];
  studyCount: number;
  updatedAt: string;
}

interface UrlDirectoryState {
  view: DirectoryTab;
  q: string;
  type: string;
  category: string;
  identity: string;
  evidenceType: string;
  evidenceStrength: string;
  humanEvidence: string;
  regulatoryStatus: string;
  sort: string;
}

function initCompoundSearch(): void {
  const grid = document.querySelector<HTMLElement>('[data-compound-grid]');
  const searchInput = document.querySelector<HTMLInputElement>('[data-compound-search]');
  const entityKindSelect = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]');
  const categorySelect = document.querySelector<HTMLSelectElement>('[data-filter-category]');
  const confidenceSelect = document.querySelector<HTMLSelectElement>('[data-filter-confidence]');
  const evidenceTypeSelect = document.querySelector<HTMLSelectElement>(
    '[data-filter-evidence-type]',
  );
  const evidenceStrengthSelect = document.querySelector<HTMLSelectElement>(
    '[data-filter-evidence-strength]',
  );
  const humanEvidenceSelect = document.querySelector<HTMLSelectElement>(
    '[data-filter-human-evidence]',
  );
  const regulatoryStatusSelect = document.querySelector<HTMLSelectElement>(
    '[data-filter-regulatory-status]',
  );
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
  const pagination = document.querySelector<HTMLElement>('[data-pagination]');
  const loadMoreButton = document.querySelector<HTMLButtonElement>('[data-load-more]');
  const paginationStatus = document.querySelector<HTMLElement>('[data-pagination-status]');
  // Optional — Compounds/Stacks tabs (2026-08-20). Absent entirely on
  // any page/fixture that predates this feature; every tab-related
  // branch below is a no-op in that case, and every card is shown
  // together exactly like before.
  const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  const hasTabs = tabButtons.length > 0;
  const emptyStateHeading = emptyState?.querySelector<HTMLElement>('h1, h2') ?? null;
  const emptyStateMessage = emptyState?.querySelector<HTMLElement>('p') ?? null;

  if (!grid) return;
  const gridEl: HTMLElement = grid;

  const cards: CardState[] = Array.from(
    gridEl.querySelectorAll<HTMLElement>('[data-compound-item]'),
  ).map((el) => ({
    el,
    name: el.dataset.name ?? '',
    // Includes the canonical name alongside the display name — a card
    // shows only the display name, but a search for either should still
    // find it (data-name stays display-only so A-Z sort matches what's
    // actually rendered on the card).
    searchName: (el.dataset.searchName ?? el.dataset.name ?? '').toLowerCase(),
    aliases: (el.dataset.aliases ?? '').toLowerCase(),
    entityKind: el.dataset.entityKind ?? '',
    category: el.dataset.category ?? '',
    identityConfidence: el.dataset.identityConfidence ?? '',
    evidenceTypes: (el.dataset.evidenceTypes ?? '').split(' ').filter(Boolean),
    evidenceQuality: el.dataset.evidenceQuality ?? '',
    hasHumanEvidence: el.dataset.humanEvidence === 'true',
    regulatoryStatuses: (el.dataset.regulatoryStatuses ?? '').split(' ').filter(Boolean),
    studyCount: Number(el.dataset.studyCount ?? '0'),
    updatedAt: el.dataset.updatedAt ?? '',
  }));

  let visibleLimit = PAGE_SIZE;
  let activeTab: DirectoryTab = 'compounds';

  function isStackCard(card: CardState): boolean {
    return card.entityKind === 'stack';
  }

  function updateTabUi(): void {
    if (!hasTabs) return;
    for (const btn of tabButtons) {
      const isActive = btn.dataset.tab === activeTab;
      btn.setAttribute('aria-selected', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
    }
    const activeButton = tabButtons.find((b) => b.dataset.tab === activeTab);
    if (activeButton?.id) {
      gridEl.setAttribute('aria-labelledby', activeButton.id);
    }
  }

  function apply(): void {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    const entityKind = entityKindSelect?.value ?? '';
    const category = categorySelect?.value ?? '';
    const confidence = confidenceSelect?.value ?? '';
    const evidenceType = evidenceTypeSelect?.value ?? '';
    const evidenceStrength = evidenceStrengthSelect?.value ?? '';
    const humanEvidence = humanEvidenceSelect?.value ?? '';
    const regulatoryStatus = regulatoryStatusSelect?.value ?? '';
    const sort = sortSelect?.value ?? 'name-asc';

    // Tab baseline — applied first, before any other filter. Only in
    // effect when tab markup actually exists on the page.
    const tabBase = hasTabs
      ? cards.filter((card) => (activeTab === 'stacks' ? isStackCard(card) : !isStackCard(card)))
      : cards;
    const tabTotal = tabBase.length;

    const matching = tabBase.filter((card) => {
      const nameOrAliasMatch =
        !query || card.searchName.includes(query) || card.aliases.includes(query);
      return (
        nameOrAliasMatch &&
        (!entityKind || card.entityKind === entityKind) &&
        (!category || card.category === category) &&
        (!confidence || card.identityConfidence === confidence) &&
        (!evidenceType || card.evidenceTypes.includes(evidenceType)) &&
        (!evidenceStrength || card.evidenceQuality === evidenceStrength) &&
        (!humanEvidence ||
          (humanEvidence === 'yes' ? card.hasHumanEvidence : !card.hasHumanEvidence)) &&
        (!regulatoryStatus || card.regulatoryStatuses.includes(regulatoryStatus))
      );
    });

    const sorted = [...matching].sort((a, b) => {
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'evidence-desc') {
        const diff =
          (EVIDENCE_QUALITY_RANK[b.evidenceQuality] ?? -1) -
          (EVIDENCE_QUALITY_RANK[a.evidenceQuality] ?? -1);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (sort === 'studies-desc') {
        const diff = b.studyCount - a.studyCount;
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }
      if (sort === 'updated-desc') {
        return b.updatedAt.localeCompare(a.updatedAt);
      }
      return a.name.localeCompare(b.name);
    });

    // Hide everything first, including cards outside `matching` entirely
    // (which, with tabs active, always includes every card from the
    // OTHER tab — never rendered as part of this tab's result set, so
    // it can never occupy a page/position that belongs to it).
    for (const card of cards) card.el.hidden = true;

    const shown = sorted.slice(0, visibleLimit);
    for (const card of shown) {
      card.el.hidden = false;
      gridEl.appendChild(card.el);
    }

    const totalMatching = sorted.length;
    const noun = hasTabs && activeTab === 'stacks' ? 'stack' : 'compound';
    if (resultCount) {
      resultCount.textContent =
        totalMatching === tabTotal
          ? `${totalMatching} ${noun}${totalMatching === 1 ? '' : 's'}`
          : `${totalMatching} of ${tabTotal} ${noun}${tabTotal === 1 ? '' : 's'}`;
    }
    if (emptyState) emptyState.hidden = totalMatching !== 0;
    if (totalMatching === 0) {
      if (emptyStateHeading) {
        emptyStateHeading.textContent =
          hasTabs && activeTab === 'stacks'
            ? 'No stacks match those filters'
            : 'No compounds match those filters';
      }
      if (emptyStateMessage) {
        emptyStateMessage.textContent =
          'Try a different search term or clear the filters to see everything published.';
      }
    }

    if (pagination && loadMoreButton && paginationStatus) {
      const hasMore = totalMatching > shown.length;
      pagination.hidden = !hasMore;
      if (hasMore) {
        paginationStatus.textContent = `Showing ${shown.length} of ${totalMatching}`;
      }
    }

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

    if (chipsContainer) {
      renderChips(
        entityKind,
        category,
        confidence,
        evidenceType,
        evidenceStrength,
        humanEvidence,
        regulatoryStatus,
      );
    }

    updateTabUi();
  }

  function resetPaginationAndApply(): void {
    visibleLimit = PAGE_SIZE;
    apply();
  }

  // ---------------------------------------------------------------------
  // URL state — tab (`view`) plus every filter/search/sort control, so a
  // direct link/refresh/back-forward all restore the same result set.
  // Only engaged when tabs exist; a pre-2026-08-20 page with no tab
  // markup never touches the URL at all, same as before.
  // ---------------------------------------------------------------------
  function readUrlState(): UrlDirectoryState {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const sort = params.get('sort') ?? '';
    return {
      // Invalid/missing `view` falls back safely to Compounds.
      view: view === 'stacks' ? 'stacks' : 'compounds',
      q: params.get('q') ?? '',
      type: params.get('type') ?? '',
      category: params.get('category') ?? '',
      identity: params.get('identity') ?? '',
      evidenceType: params.get('evidence_type') ?? '',
      evidenceStrength: params.get('evidence_strength') ?? '',
      humanEvidence: params.get('human_evidence') ?? '',
      regulatoryStatus: params.get('regulatory_status') ?? '',
      sort: VALID_SORTS.has(sort) ? sort : 'name-asc',
    };
  }

  function applyUrlStateToControls(state: UrlDirectoryState): void {
    if (searchInput) searchInput.value = state.q;
    if (entityKindSelect) entityKindSelect.value = state.type;
    if (categorySelect) categorySelect.value = state.category;
    if (confidenceSelect) confidenceSelect.value = state.identity;
    if (evidenceTypeSelect) evidenceTypeSelect.value = state.evidenceType;
    if (evidenceStrengthSelect) evidenceStrengthSelect.value = state.evidenceStrength;
    if (humanEvidenceSelect) humanEvidenceSelect.value = state.humanEvidence;
    if (regulatoryStatusSelect) regulatoryStatusSelect.value = state.regulatoryStatus;
    if (sortSelect) sortSelect.value = state.sort;
    activeTab = hasTabs ? state.view : 'compounds';
  }

  function buildUrlParams(): URLSearchParams {
    const params = new URLSearchParams();
    if (hasTabs && activeTab === 'stacks') params.set('view', 'stacks');
    const q = (searchInput?.value ?? '').trim();
    if (q) params.set('q', q);
    if (entityKindSelect?.value) params.set('type', entityKindSelect.value);
    if (categorySelect?.value) params.set('category', categorySelect.value);
    if (confidenceSelect?.value) params.set('identity', confidenceSelect.value);
    if (evidenceTypeSelect?.value) params.set('evidence_type', evidenceTypeSelect.value);
    if (evidenceStrengthSelect?.value) {
      params.set('evidence_strength', evidenceStrengthSelect.value);
    }
    if (humanEvidenceSelect?.value) params.set('human_evidence', humanEvidenceSelect.value);
    if (regulatoryStatusSelect?.value) {
      params.set('regulatory_status', regulatoryStatusSelect.value);
    }
    if (sortSelect?.value && sortSelect.value !== 'name-asc') params.set('sort', sortSelect.value);
    return params;
  }

  function syncUrl(push: boolean): void {
    if (!hasTabs) return; // no URL-state feature on a tab-less page
    const qs = buildUrlParams().toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    const historyState = { cpDirectory: true };
    if (push) {
      window.history.pushState(historyState, '', newUrl);
    } else {
      window.history.replaceState(historyState, '', newUrl);
    }
  }

  /** Every discrete, "the user made a choice" action funnels through
   * here: re-derive the shown cards and commit the new URL as a real
   * history entry (so Back/Forward steps through it). Continuous typing
   * in the search box deliberately does NOT use this — see the input
   * listener below. */
  function commitChange(): void {
    resetPaginationAndApply();
    syncUrl(true);
  }

  function setActiveTab(tab: DirectoryTab): void {
    if (!hasTabs || tab === activeTab) return;
    activeTab = tab;
    // "Clear or adjust only incompatible type selections" — never
    // touches search/category/evidence/sort.
    if (entityKindSelect) {
      const val = entityKindSelect.value;
      if (tab === 'stacks' && val && val !== 'stack') entityKindSelect.value = '';
      if (tab === 'compounds' && val === 'stack') entityKindSelect.value = '';
    }
    commitChange();
  }

  // ---------------------------------------------------------------------
  // Tabs — click + WAI-ARIA APG keyboard pattern (Left/Right/Up/Down/
  // Home/End move focus and activate immediately; only two tabs exist,
  // so automatic activation is unambiguous and matches most native tab
  // implementations users already expect).
  // ---------------------------------------------------------------------
  for (const btn of tabButtons) {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab === 'stacks' ? 'stacks' : 'compounds';
      setActiveTab(tab);
    });
    btn.addEventListener('keydown', (event) => {
      const currentIndex = tabButtons.indexOf(btn);
      let nextIndex: number;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabButtons.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      const nextButton = tabButtons[nextIndex];
      nextButton.focus();
      setActiveTab(nextButton.dataset.tab === 'stacks' ? 'stacks' : 'compounds');
    });
  }

  function chipLabel(select: HTMLSelectElement | undefined | null, value: string): string {
    if (!select) return value;
    const option = Array.from(select.options).find((o) => o.value === value);
    return option?.textContent ?? value;
  }

  function renderChips(
    entityKind: string,
    category: string,
    confidence: string,
    evidenceType: string,
    evidenceStrength: string,
    humanEvidence: string,
    regulatoryStatus: string,
  ): void {
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';
    const candidates: ({ label: string; clear: () => void } | null)[] = [
      entityKind
        ? {
            label: chipLabel(entityKindSelect, entityKind),
            clear: () => entityKindSelect && (entityKindSelect.value = ''),
          }
        : null,
      category
        ? {
            label: chipLabel(categorySelect, category),
            clear: () => categorySelect && (categorySelect.value = ''),
          }
        : null,
      confidence
        ? {
            label: chipLabel(confidenceSelect, confidence),
            clear: () => confidenceSelect && (confidenceSelect.value = ''),
          }
        : null,
      evidenceType
        ? {
            label: chipLabel(evidenceTypeSelect, evidenceType),
            clear: () => evidenceTypeSelect && (evidenceTypeSelect.value = ''),
          }
        : null,
      evidenceStrength
        ? {
            label: chipLabel(evidenceStrengthSelect, evidenceStrength),
            clear: () => evidenceStrengthSelect && (evidenceStrengthSelect.value = ''),
          }
        : null,
      humanEvidence
        ? {
            label: chipLabel(humanEvidenceSelect, humanEvidence),
            clear: () => humanEvidenceSelect && (humanEvidenceSelect.value = ''),
          }
        : null,
      regulatoryStatus
        ? {
            label: chipLabel(regulatoryStatusSelect, regulatoryStatus),
            clear: () => regulatoryStatusSelect && (regulatoryStatusSelect.value = ''),
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
        commitChange();
      });
      chipsContainer.appendChild(btn);
    }
  }

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  searchInput?.addEventListener('input', () => {
    resetPaginationAndApply();
    // Debounced replaceState (never pushState) — keeps the URL
    // shareable/refresh-safe without spamming a history entry per
    // keystroke.
    if (searchDebounceTimer !== null) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => syncUrl(false), 400);
  });

  entityKindSelect?.addEventListener('change', () => {
    const val = entityKindSelect.value;
    // "When a user selects Stack ... automatically activate the Stacks
    // tab" / "When a user selects a non-stack substance type ...
    // automatically activate the Compounds tab" — an empty selection
    // ("All types") never forces a tab switch either way.
    if (hasTabs) {
      if (val === 'stack') activeTab = 'stacks';
      else if (val) activeTab = 'compounds';
    }
    commitChange();
  });
  categorySelect?.addEventListener('change', commitChange);
  confidenceSelect?.addEventListener('change', commitChange);
  evidenceTypeSelect?.addEventListener('change', commitChange);
  evidenceStrengthSelect?.addEventListener('change', commitChange);
  humanEvidenceSelect?.addEventListener('change', commitChange);
  regulatoryStatusSelect?.addEventListener('change', commitChange);
  sortSelect?.addEventListener('change', commitChange);
  clearButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (entityKindSelect) entityKindSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (confidenceSelect) confidenceSelect.value = '';
    if (evidenceTypeSelect) evidenceTypeSelect.value = '';
    if (evidenceStrengthSelect) evidenceStrengthSelect.value = '';
    if (humanEvidenceSelect) humanEvidenceSelect.value = '';
    if (regulatoryStatusSelect) regulatoryStatusSelect.value = '';
    commitChange();
  });

  loadMoreButton?.addEventListener('click', () => {
    visibleLimit += PAGE_SIZE;
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

  window.addEventListener('popstate', () => {
    applyUrlStateToControls(readUrlState());
    resetPaginationAndApply();
  });

  // Initial render: hydrate every control (including the active tab)
  // from whatever URL the page was actually loaded/refreshed/linked
  // with, then normalize the URL (replaceState — no new history entry
  // on a plain load) so an invalid `view` value is visibly corrected.
  applyUrlStateToControls(readUrlState());
  apply();
  syncUrl(false);
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
