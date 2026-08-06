// @vitest-environment happy-dom
/**
 * Tests the real compound-search.ts against a simulated DOM — the
 * directory has zero published compounds right now (nothing has been
 * published, per Phase 3's draft-safety requirements), so this is the
 * only way to exercise search/filter/sort against realistic data
 * without publishing anything for real.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

function setUpDom() {
  document.body.innerHTML = `
    <input data-compound-search />
    <select data-filter-entity-kind><option value="">All</option><option value="peptide">Peptide</option><option value="stack">Stack</option></select>
    <select data-filter-category><option value="">All</option><option value="Recovery">Recovery</option><option value="Beauty">Beauty</option></select>
    <select data-filter-confidence><option value="">All</option><option value="verified">verified</option><option value="unverified">unverified</option></select>
    <select data-sort><option value="name-asc">A-Z</option><option value="name-desc">Z-A</option></select>
    <button data-clear-filters>Clear</button>
    <p data-result-count></p>
    <div data-filter-empty-state hidden></div>
    <div data-compound-grid>
      <div data-compound-item data-name="BPC-157" data-entity-kind="peptide" data-category="Recovery" data-identity-confidence="unverified"></div>
      <div data-compound-item data-name="TB-500" data-entity-kind="peptide" data-category="Recovery" data-identity-confidence="verified"></div>
      <div data-compound-item data-name="Wolverine Stack" data-entity-kind="stack" data-category="Recovery" data-identity-confidence="unverified"></div>
      <div data-compound-item data-name="GHK-Cu" data-entity-kind="peptide" data-category="Beauty" data-identity-confidence="verified"></div>
    </div>
  `;
}

function visibleNames(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-compound-item]:not([hidden])'),
  ).map((el) => el.dataset.name ?? '');
}

async function loadScript() {
  // Re-import fresh each test so its DOMContentLoaded/immediate-init
  // logic runs against this test's DOM.
  vi.resetModules();
  await import('../../src/scripts/compound-search.ts');
}

describe('compound-search (framework-free directory filtering)', () => {
  beforeEach(() => {
    setUpDom();
  });

  it('shows every compound with no filters applied', async () => {
    await loadScript();
    expect(visibleNames().sort()).toEqual(['BPC-157', 'GHK-Cu', 'TB-500', 'Wolverine Stack']);
    expect(document.querySelector('[data-result-count]')?.textContent).toBe('4 compounds');
  });

  it('filters by search text, case-insensitively', async () => {
    await loadScript();
    const input = document.querySelector<HTMLInputElement>('[data-compound-search]')!;
    input.value = 'bpc';
    input.dispatchEvent(new Event('input'));
    expect(visibleNames()).toEqual(['BPC-157']);
  });

  it('filters by entity_kind', async () => {
    await loadScript();
    const select = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]')!;
    select.value = 'stack';
    select.dispatchEvent(new Event('change'));
    expect(visibleNames()).toEqual(['Wolverine Stack']);
  });

  it('filters by category', async () => {
    await loadScript();
    const select = document.querySelector<HTMLSelectElement>('[data-filter-category]')!;
    select.value = 'Beauty';
    select.dispatchEvent(new Event('change'));
    expect(visibleNames()).toEqual(['GHK-Cu']);
  });

  it('filters by identity confidence', async () => {
    await loadScript();
    const select = document.querySelector<HTMLSelectElement>('[data-filter-confidence]')!;
    select.value = 'verified';
    select.dispatchEvent(new Event('change'));
    expect(visibleNames().sort()).toEqual(['GHK-Cu', 'TB-500']);
  });

  it('combines multiple filters (AND, not OR)', async () => {
    await loadScript();
    document.querySelector<HTMLSelectElement>('[data-filter-category]')!.value = 'Recovery';
    document
      .querySelector<HTMLSelectElement>('[data-filter-category]')!
      .dispatchEvent(new Event('change'));
    document.querySelector<HTMLSelectElement>('[data-filter-confidence]')!.value = 'verified';
    document
      .querySelector<HTMLSelectElement>('[data-filter-confidence]')!
      .dispatchEvent(new Event('change'));
    expect(visibleNames()).toEqual(['TB-500']);
  });

  it('shows the empty state and hides it again when filters no longer exclude everything', async () => {
    await loadScript();
    const input = document.querySelector<HTMLInputElement>('[data-compound-search]')!;
    input.value = 'nonexistent-compound-xyz';
    input.dispatchEvent(new Event('input'));
    expect(visibleNames()).toEqual([]);
    expect(document.querySelector('[data-filter-empty-state]')?.hasAttribute('hidden')).toBe(false);

    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(document.querySelector('[data-filter-empty-state]')?.hasAttribute('hidden')).toBe(true);
  });

  it('sorts name ascending and descending', async () => {
    await loadScript();
    const sort = document.querySelector<HTMLSelectElement>('[data-sort]')!;
    sort.value = 'name-desc';
    sort.dispatchEvent(new Event('change'));
    expect(visibleNames()).toEqual(['Wolverine Stack', 'TB-500', 'GHK-Cu', 'BPC-157']);

    sort.value = 'name-asc';
    sort.dispatchEvent(new Event('change'));
    expect(visibleNames()).toEqual(['BPC-157', 'GHK-Cu', 'TB-500', 'Wolverine Stack']);
  });

  it('"Clear filters" resets search, all selects, and re-shows everything', async () => {
    await loadScript();
    document.querySelector<HTMLInputElement>('[data-compound-search]')!.value = 'bpc';
    document
      .querySelector<HTMLInputElement>('[data-compound-search]')!
      .dispatchEvent(new Event('input'));
    expect(visibleNames()).toEqual(['BPC-157']);

    document.querySelector<HTMLButtonElement>('[data-clear-filters]')!.click();
    expect(visibleNames().sort()).toEqual(['BPC-157', 'GHK-Cu', 'TB-500', 'Wolverine Stack']);
  });
});
