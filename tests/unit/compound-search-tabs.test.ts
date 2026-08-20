// @vitest-environment happy-dom
/**
 * Compounds/Stacks tabs (2026-08-20) — tests the real compound-search.ts
 * against a simulated DOM that includes the tab markup
 * SearchFilterBar.astro now renders, mirroring
 * tests/unit/compound-search.test.ts's own established pattern. The
 * tab-less fixture in that file is left untouched deliberately — it's
 * now this feature's own regression test for "no tab markup present ->
 * behave exactly like before" (see compound-search.ts's own "hasTabs"
 * guard).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

function setUpDom(initialPath = '/research/compounds/') {
  window.history.pushState(null, '', initialPath);
  document.body.innerHTML = `
    <div role="tablist" aria-label="Research entries">
      <button type="button" role="tab" id="cp-tab-compounds" aria-selected="true" aria-controls="cp-compound-grid" tabindex="0" data-tab="compounds">Compounds <span data-tab-count="compounds">4</span></button>
      <button type="button" role="tab" id="cp-tab-stacks" aria-selected="false" aria-controls="cp-compound-grid" tabindex="-1" data-tab="stacks">Stacks <span data-tab-count="stacks">1</span></button>
    </div>
    <input data-compound-search />
    <select data-filter-entity-kind>
      <option value="">All</option>
      <option value="peptide">Peptide</option>
      <option value="peptide_blend">Peptide blend</option>
      <option value="stack">Stack</option>
    </select>
    <select data-filter-category><option value="">All</option><option value="Recovery">Recovery</option></select>
    <select data-filter-confidence><option value="">All</option><option value="verified">verified</option></select>
    <select data-sort>
      <option value="name-asc">A-Z</option>
      <option value="name-desc">Z-A</option>
    </select>
    <button data-clear-filters>Clear</button>
    <p data-result-count></p>
    <div data-filter-empty-state hidden><h2>placeholder</h2><p>placeholder</p></div>
    <div data-compound-grid id="cp-compound-grid" role="tabpanel" aria-labelledby="cp-tab-compounds">
      <div data-compound-item data-name="BPC-157" data-entity-kind="peptide" data-category="Recovery" data-identity-confidence="unverified"></div>
      <div data-compound-item data-name="CJC-1295 No DAC + Ipamorelin" data-entity-kind="peptide_blend" data-category="Recovery" data-identity-confidence="unverified"></div>
      <div data-compound-item data-name="GHK-Cu" data-entity-kind="peptide" data-category="Beauty" data-identity-confidence="verified"></div>
      <div data-compound-item data-name="TB-500" data-entity-kind="peptide" data-category="Recovery" data-identity-confidence="verified"></div>
      <div data-compound-item data-name="Wolverine Stack" data-entity-kind="stack" data-category="Recovery" data-identity-confidence="unverified"></div>
    </div>
  `;
}

function visibleNames(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-compound-item]:not([hidden])'),
  ).map((el) => el.dataset.name ?? '');
}

function visibleEntityKinds(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-compound-item]:not([hidden])'),
  ).map((el) => el.dataset.entityKind ?? '');
}

async function loadScript() {
  vi.resetModules();
  await import('../../src/scripts/compound-search.ts');
}

function tab(name: 'compounds' | 'stacks'): HTMLButtonElement {
  return document.querySelector<HTMLButtonElement>(`[data-tab="${name}"]`)!;
}

describe('compound directory tabs — Compounds vs. Stacks', () => {
  beforeEach(() => {
    setUpDom();
  });

  it('defaults to the Compounds tab, excluding the stack entirely', async () => {
    await loadScript();
    expect(visibleNames().sort()).toEqual([
      'BPC-157',
      'CJC-1295 No DAC + Ipamorelin',
      'GHK-Cu',
      'TB-500',
    ]);
    expect(visibleEntityKinds().every((k) => k !== 'stack')).toBe(true);
    expect(document.querySelector('[data-result-count]')?.textContent).toBe('4 compounds');
    expect(tab('compounds').getAttribute('aria-selected')).toBe('true');
    expect(tab('stacks').getAttribute('aria-selected')).toBe('false');
  });

  it('a canonical peptide blend (name contains "+") stays under Compounds, never Stacks', async () => {
    await loadScript();
    expect(visibleNames()).toContain('CJC-1295 No DAC + Ipamorelin');
    tab('stacks').click();
    expect(visibleNames()).not.toContain('CJC-1295 No DAC + Ipamorelin');
  });

  it('clicking the Stacks tab shows only entries with entity_kind stack', async () => {
    await loadScript();
    tab('stacks').click();
    expect(visibleNames()).toEqual(['Wolverine Stack']);
    expect(document.querySelector('[data-result-count]')?.textContent).toBe('1 stack');
    expect(tab('stacks').getAttribute('aria-selected')).toBe('true');
    expect(tab('compounds').getAttribute('aria-selected')).toBe('false');
  });

  it('alphabetical A–Z sort applies independently within each tab', async () => {
    await loadScript();
    // Compounds tab, default sort.
    expect(visibleNames()).toEqual(['BPC-157', 'CJC-1295 No DAC + Ipamorelin', 'GHK-Cu', 'TB-500']);
    tab('stacks').click();
    expect(visibleNames()).toEqual(['Wolverine Stack']);
  });

  it('selecting "Stack" in the type filter automatically activates the Stacks tab', async () => {
    await loadScript();
    const select = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]')!;
    select.value = 'stack';
    select.dispatchEvent(new Event('change'));
    expect(tab('stacks').getAttribute('aria-selected')).toBe('true');
    expect(visibleNames()).toEqual(['Wolverine Stack']);
  });

  it('selecting a non-stack type while on Stacks automatically returns to Compounds', async () => {
    await loadScript();
    tab('stacks').click();
    const select = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]')!;
    select.value = 'peptide';
    select.dispatchEvent(new Event('change'));
    expect(tab('compounds').getAttribute('aria-selected')).toBe('true');
    expect(visibleNames().sort()).toEqual(['BPC-157', 'GHK-Cu', 'TB-500']);
  });

  it('manually switching tabs clears only an incompatible type selection, preserving other filters', async () => {
    await loadScript();
    const category = document.querySelector<HTMLSelectElement>('[data-filter-category]')!;
    const type = document.querySelector<HTMLSelectElement>('[data-filter-entity-kind]')!;
    type.value = 'peptide';
    type.dispatchEvent(new Event('change'));
    category.value = 'Recovery';
    category.dispatchEvent(new Event('change'));
    expect(visibleNames().sort()).toEqual(['BPC-157', 'TB-500']);

    tab('stacks').click();
    // 'peptide' is incompatible with Stacks -> cleared to "All".
    expect(type.value).toBe('');
    // Category ('Recovery') is still compatible -> preserved.
    expect(category.value).toBe('Recovery');
    expect(visibleNames()).toEqual(['Wolverine Stack']);
  });

  it('search and non-type filters operate within the active tab only', async () => {
    await loadScript();
    const input = document.querySelector<HTMLInputElement>('[data-compound-search]')!;
    input.value = 'stack';
    input.dispatchEvent(new Event('input'));
    // Still on Compounds tab -> a text match against a stack's name
    // must not surface it.
    expect(visibleNames()).toEqual([]);
    expect(document.querySelector('[data-filter-empty-state]')?.hasAttribute('hidden')).toBe(false);
    expect(document.querySelector('[data-filter-empty-state] h2')?.textContent).toBe(
      'No compounds match those filters',
    );
  });

  it('reports an accurate, tab-scoped count distinct from the other tab', async () => {
    await loadScript();
    expect(document.querySelector('[data-result-count]')?.textContent).toBe('4 compounds');
    tab('stacks').click();
    expect(document.querySelector('[data-result-count]')?.textContent).toBe('1 stack');
  });

  it('never shows a duplicated or missing entry across both tabs combined', async () => {
    await loadScript();
    const compoundsTabNames = visibleNames();
    tab('stacks').click();
    const stacksTabNames = visibleNames();
    const combined = [...compoundsTabNames, ...stacksTabNames].sort();
    expect(combined).toEqual([
      'BPC-157',
      'CJC-1295 No DAC + Ipamorelin',
      'GHK-Cu',
      'TB-500',
      'Wolverine Stack',
    ]);
    expect(new Set(combined).size).toBe(combined.length);
  });

  it('keyboard ArrowRight/ArrowLeft moves focus and activates the adjacent tab', async () => {
    await loadScript();
    const compoundsTab = tab('compounds');
    const stacksTab = tab('stacks');
    compoundsTab.focus();
    compoundsTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(stacksTab);
    expect(stacksTab.getAttribute('aria-selected')).toBe('true');
    expect(visibleNames()).toEqual(['Wolverine Stack']);

    stacksTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(compoundsTab);
    expect(compoundsTab.getAttribute('aria-selected')).toBe('true');
  });

  it('Home/End keys jump to the first/last tab', async () => {
    await loadScript();
    const compoundsTab = tab('compounds');
    const stacksTab = tab('stacks');
    compoundsTab.focus();
    compoundsTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(stacksTab);
    stacksTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(compoundsTab);
  });

  it('reflects the selected tab in the URL as view=stacks / omits it for the default Compounds tab', async () => {
    await loadScript();
    expect(new URL(window.location.href).searchParams.get('view')).toBeNull();
    tab('stacks').click();
    expect(new URL(window.location.href).searchParams.get('view')).toBe('stacks');
    tab('compounds').click();
    expect(new URL(window.location.href).searchParams.get('view')).toBeNull();
  });

  it('a direct link with ?view=stacks opens the Stacks tab on load', async () => {
    setUpDom('/research/compounds/?view=stacks');
    await loadScript();
    expect(tab('stacks').getAttribute('aria-selected')).toBe('true');
    expect(visibleNames()).toEqual(['Wolverine Stack']);
  });

  it('an invalid view value falls back safely to Compounds', async () => {
    setUpDom('/research/compounds/?view=nonsense');
    await loadScript();
    expect(tab('compounds').getAttribute('aria-selected')).toBe('true');
    expect(visibleNames().sort()).toEqual([
      'BPC-157',
      'CJC-1295 No DAC + Ipamorelin',
      'GHK-Cu',
      'TB-500',
    ]);
  });

  it('restores the correct tab and filters on a popstate (Back/Forward) event', async () => {
    await loadScript();
    tab('stacks').click();
    expect(visibleNames()).toEqual(['Wolverine Stack']);

    // Simulate the browser restoring an earlier URL via Back — the real
    // navigation itself is Playwright's job (tests/e2e); this exercises
    // the popstate handler's own restoration logic directly.
    window.history.pushState(null, '', '/research/compounds/?category=Recovery');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(tab('compounds').getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector<HTMLSelectElement>('[data-filter-category]')!.value).toBe(
      'Recovery',
    );
    expect(visibleNames().sort()).toEqual(['BPC-157', 'CJC-1295 No DAC + Ipamorelin', 'TB-500']);
  });

  it('resets pagination (visible limit) back to page 1 on a tab switch', async () => {
    // 30 compounds + 30 stacks so the default 24-per-page limit actually
    // engages on both tabs, plus real "Show more" pagination markup.
    setUpDom();
    const gridEl = document.querySelector('[data-compound-grid]')!;
    gridEl.insertAdjacentHTML(
      'afterend',
      '<div data-pagination hidden><button data-load-more>Show more</button><p data-pagination-status></p></div>',
    );
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.dataset.compoundItem = '';
      el.dataset.name = `Extra-Compound-${String(i).padStart(2, '0')}`;
      el.dataset.entityKind = 'peptide';
      gridEl.appendChild(el);
    }
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.dataset.compoundItem = '';
      el.dataset.name = `Extra-Stack-${String(i).padStart(2, '0')}`;
      el.dataset.entityKind = 'stack';
      gridEl.appendChild(el);
    }
    await loadScript();

    expect(visibleNames().length).toBe(24); // default page-1 limit on Compounds
    document.querySelector<HTMLButtonElement>('[data-load-more]')!.click();
    // 34 total non-stack items (4 original + 30 extra) — one "Show
    // more" click (+24) exceeds that, so everything is now visible.
    expect(visibleNames().length).toBe(34);

    tab('stacks').click();
    // A fresh tab must start back at page 1, not inherit Compounds'
    // expanded limit.
    expect(visibleNames().length).toBe(24);
    expect(visibleNames().every((n) => n.startsWith('Extra-Stack-'))).toBe(true);
  });
});
