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
 */
const PAGE_SIZE = 24;

const EVIDENCE_QUALITY_RANK: Record<string, number> = {
  high: 4,
  moderate: 3,
  low: 2,
  very_low: 1,
  not_assessed: 0,
};

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

    const matching = cards.filter((card) => {
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

    // Hide everything first, including cards outside `matching` entirely.
    for (const card of cards) card.el.hidden = true;

    const shown = sorted.slice(0, visibleLimit);
    for (const card of shown) {
      card.el.hidden = false;
      gridEl.appendChild(card.el);
    }

    const totalMatching = sorted.length;
    if (resultCount) {
      resultCount.textContent =
        totalMatching === cards.length
          ? `${totalMatching} compound${totalMatching === 1 ? '' : 's'}`
          : `${totalMatching} of ${cards.length} compounds`;
    }
    if (emptyState) emptyState.hidden = totalMatching !== 0;

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
  }

  function resetPaginationAndApply(): void {
    visibleLimit = PAGE_SIZE;
    apply();
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
        resetPaginationAndApply();
      });
      chipsContainer.appendChild(btn);
    }
  }

  searchInput?.addEventListener('input', resetPaginationAndApply);
  entityKindSelect?.addEventListener('change', resetPaginationAndApply);
  categorySelect?.addEventListener('change', resetPaginationAndApply);
  confidenceSelect?.addEventListener('change', resetPaginationAndApply);
  evidenceTypeSelect?.addEventListener('change', resetPaginationAndApply);
  evidenceStrengthSelect?.addEventListener('change', resetPaginationAndApply);
  humanEvidenceSelect?.addEventListener('change', resetPaginationAndApply);
  regulatoryStatusSelect?.addEventListener('change', resetPaginationAndApply);
  sortSelect?.addEventListener('change', resetPaginationAndApply);
  clearButton?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (entityKindSelect) entityKindSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (confidenceSelect) confidenceSelect.value = '';
    if (evidenceTypeSelect) evidenceTypeSelect.value = '';
    if (evidenceStrengthSelect) evidenceStrengthSelect.value = '';
    if (humanEvidenceSelect) humanEvidenceSelect.value = '';
    if (regulatoryStatusSelect) regulatoryStatusSelect.value = '';
    resetPaginationAndApply();
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
