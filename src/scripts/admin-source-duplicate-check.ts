/**
 * Live duplicate-source detection (Research CMS gap-fill, 2026-08-10) —
 * "Detect duplicate DOI/PMID/URLs before creation." Two independent,
 * debounced checks against GET /api/admin/sources/duplicate-check,
 * each only active if its own markup is present on the page:
 *   - New-source form (admin/sources/new.astro): checks the URL field
 *     as the admin types — informational only (URL isn't DB-unique, so
 *     this never blocks submission, just surfaces "you may already
 *     have this").
 *   - Add-identifier form (admin/sources/[id].astro): checks the
 *     identifier type+value pair as the admin types — a real match
 *     here WOULD fail at the database's global-uniqueness constraint
 *     regardless, so this blocks the submit button rather than wasting
 *     a guaranteed-to-fail round trip.
 */

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), ms);
  }) as T;
}

interface DuplicateMatch {
  id: string;
  title: string;
  matched_on: 'url' | 'identifier';
  matched_text: string;
  hard_block: boolean;
}

async function checkDuplicates(params: URLSearchParams): Promise<DuplicateMatch[]> {
  try {
    const res = await fetch(`/api/admin/sources/duplicate-check?${params.toString()}`);
    const result = (await res.json()) as { success: boolean; data?: DuplicateMatch[] };
    return result.success && result.data ? result.data : [];
  } catch {
    return [];
  }
}

function renderWarning(el: HTMLElement, matches: DuplicateMatch[]): void {
  if (matches.length === 0) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = matches
    .map(
      (m) =>
        `${m.hard_block ? 'Already exists' : 'Possible duplicate'} — <a href="/admin/sources/${m.id}">${m.title}</a> (matched on ${m.matched_text})`,
    )
    .join('<br>');
}

function initUrlCheck(): void {
  const urlInput = document.querySelector<HTMLInputElement>('[data-url-input]');
  const warningEl = document.getElementById('duplicateUrlWarning');
  if (!urlInput || !warningEl) return;

  const run = debounce(async () => {
    const value = urlInput.value.trim();
    if (value.length < 8) {
      renderWarning(warningEl, []);
      return;
    }
    const params = new URLSearchParams({ url: value });
    renderWarning(warningEl, await checkDuplicates(params));
  }, 400);

  urlInput.addEventListener('input', run);
}

function initIdentifierCheck(): void {
  const typeSelect = document.querySelector<HTMLSelectElement>('[data-identifier-type-input]');
  const valueInput = document.querySelector<HTMLInputElement>('[data-identifier-value-input]');
  const warningEl = document.getElementById('duplicateIdentifierWarning');
  const form = valueInput?.closest('form');
  const submitButton = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!typeSelect || !valueInput || !warningEl) return;

  let hasHardBlock = false;

  const run = debounce(async () => {
    const value = valueInput.value.trim();
    if (value.length < 2) {
      renderWarning(warningEl, []);
      hasHardBlock = false;
      if (submitButton) submitButton.disabled = false;
      return;
    }
    const params = new URLSearchParams({
      identifier_type: typeSelect.value,
      identifier_value: value,
    });
    const matches = await checkDuplicates(params);
    renderWarning(warningEl, matches);
    hasHardBlock = matches.some((m) => m.hard_block);
    if (submitButton) submitButton.disabled = hasHardBlock;
  }, 400);

  valueInput.addEventListener('input', run);
  typeSelect.addEventListener('change', run);

  // Belt-and-suspenders — the server-side unique-constraint check is
  // the real backstop either way, but this avoids a submit that the
  // live check has already flagged as certain to fail.
  form?.addEventListener('submit', (event) => {
    if (hasHardBlock) event.preventDefault();
  });
}

function init(): void {
  initUrlCheck();
  initIdentifierCheck();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
