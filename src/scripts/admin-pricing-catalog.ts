/**
 * Private admin pricing catalog — client-side search/filter (same
 * pattern as src/scripts/coa-search.ts) plus per-row inline price
 * editing: Save/Cancel only appear once a price has actually changed,
 * client-side validation mirrors src/lib/admin/pricing-catalog.ts's
 * own validatePrice() (positive USD, at most two decimal places)
 * before ever sending a request, and the server-side result (success
 * or a specific error) is always what determines the row's final
 * state — a successful save becomes the new "original" value so
 * Cancel behaves correctly afterward.
 */

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

function validatePriceClientSide(raw: string): { valid: boolean; error?: string } {
  const text = raw.trim();
  if (!text) return { valid: false, error: 'Price is required.' };
  if (!PRICE_PATTERN.test(text)) {
    return { valid: false, error: 'Use a positive amount with at most two decimal places.' };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, error: 'Price must be greater than zero.' };
  }
  return { valid: true };
}

function initSearchAndFilter(): void {
  const searchInput = document.querySelector<HTMLInputElement>('[data-pricing-search]');
  const categorySelect = document.querySelector<HTMLSelectElement>(
    '[data-pricing-category-filter]',
  );
  const emptyState = document.querySelector<HTMLElement>('[data-pricing-empty-state]');
  const countEl = document.querySelector<HTMLElement>('[data-pricing-count]');
  const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('[data-pricing-row]'));
  if (rows.length === 0) return;

  function apply(): void {
    const search = (searchInput?.value ?? '').trim().toLowerCase();
    const category = categorySelect?.value ?? '';
    let visible = 0;
    for (const row of rows) {
      const code = row.dataset.code ?? '';
      const name = row.dataset.name ?? '';
      const rowCategory = row.dataset.category ?? '';
      const matchesCategory = !category || rowCategory === category;
      const matchesSearch = !search || code.includes(search) || name.includes(search);
      const matches = matchesCategory && matchesSearch;
      row.hidden = !matches;
      if (matches) visible++;
    }
    if (emptyState) emptyState.hidden = visible !== 0;
    if (countEl) countEl.textContent = `${visible} product${visible === 1 ? '' : 's'}`;
  }

  searchInput?.addEventListener('input', apply);
  categorySelect?.addEventListener('change', apply);
  apply();
}

function showRowMessage(row: HTMLTableRowElement, tone: 'success' | 'error', text: string): void {
  const el = row.querySelector<HTMLElement>('[data-pricing-message]');
  if (!el) return;
  el.textContent = text;
  el.dataset.tone = tone;
  el.hidden = false;
}

function clearRowMessage(row: HTMLTableRowElement): void {
  const el = row.querySelector<HTMLElement>('[data-pricing-message]');
  if (el) el.hidden = true;
}

function initInlineEditing(): void {
  const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('[data-pricing-row]'));

  for (const row of rows) {
    const input = row.querySelector<HTMLInputElement>('[data-pricing-price-input]');
    const saveBtn = row.querySelector<HTMLButtonElement>('[data-pricing-save]');
    const cancelBtn = row.querySelector<HTMLButtonElement>('[data-pricing-cancel]');
    const id = row.dataset.id;
    if (!input || !saveBtn || !cancelBtn || !id) continue;

    function currentOriginal(): string {
      return input!.dataset.originalValue ?? '';
    }

    function syncDirtyState(): void {
      const isDirty = input!.value.trim() !== currentOriginal();
      saveBtn!.hidden = !isDirty;
      cancelBtn!.hidden = !isDirty;
      input!.dataset.dirty = isDirty ? 'true' : 'false';
      if (!isDirty) clearRowMessage(row);
    }

    input.addEventListener('input', syncDirtyState);

    cancelBtn.addEventListener('click', () => {
      input.value = currentOriginal();
      syncDirtyState();
      clearRowMessage(row);
    });

    saveBtn.addEventListener('click', async () => {
      const check = validatePriceClientSide(input.value);
      if (!check.valid) {
        showRowMessage(row, 'error', check.error ?? 'Invalid price.');
        return;
      }

      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      const originalButtonText = saveBtn.textContent;
      saveBtn.textContent = 'Saving…';
      clearRowMessage(row);

      try {
        const response = await fetch(`/api/admin/pricing-catalog/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: input.value.trim() }),
        });
        const result = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: { price: number };
        };

        if (result.success && result.data) {
          const savedValue = result.data.price.toFixed(2);
          input.value = savedValue;
          input.dataset.originalValue = savedValue;
          syncDirtyState();
          showRowMessage(row, 'success', 'Price saved.');
        } else {
          showRowMessage(row, 'error', result.error || 'Could not save this price.');
        }
      } catch {
        showRowMessage(row, 'error', 'Could not save this price. Please try again.');
      }

      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      saveBtn.textContent = originalButtonText;
    });
  }
}

function init(): void {
  initSearchAndFilter();
  initInlineEditing();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
