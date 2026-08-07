/**
 * Generic admin editorial form handler — powers every create/update
 * form across the admin dashboard (compounds, aliases, claims, claim
 * sources, sources, studies, regulatory records, stack components)
 * against the single generic route (src/pages/api/admin/content/
 * [table].ts), plus a generic delete-button handler for the same
 * table. One shared script instead of one hand-written fetch call per
 * entity — every form only needs the right data-* attributes:
 *
 *   <form data-admin-form data-table="claims" data-method="POST"
 *         data-redirect="/admin/compounds/{compound_id}">
 *     <input name="statement" required />
 *     <input name="sample_size" type="number" />
 *     <p data-form-error hidden></p>
 *     <button type="submit">Save</button>
 *   </form>
 *
 * PATCH forms additionally carry hidden inputs naming the target row's
 * key column(s) (e.g. `<input type="hidden" name="id" value="...">`),
 * which double as both the identifying key AND (harmlessly) part of
 * the body — the API route reads key columns from the same JSON body.
 *
 * data-redirect supports `{field}` placeholders resolved against the
 * response's `data` object; omit it to reload the current page instead
 * (the simplest correct way to reflect a new/changed row in a list
 * without hand-writing per-page DOM patching).
 *
 *   <button type="button" data-admin-delete data-table="claims"
 *           data-key="id" data-key-value="…" data-confirm="Delete this claim?">
 */

function fieldValue(el: Element): { name: string; value: unknown } | null {
  if (!(
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  )) {
    return null;
  }
  const name = el.name;
  if (!name) return null;

  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    return { name, value: el.checked };
  }
  const raw = el.value;
  if (el instanceof HTMLInputElement && el.type === 'number') {
    return { name, value: raw === '' ? null : Number(raw) };
  }
  const trimmed = raw.trim();
  return { name, value: trimmed === '' ? null : trimmed };
}

function collectFormPayload(form: HTMLFormElement): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const el of Array.from(form.elements)) {
    const field = fieldValue(el);
    if (field) payload[field.name] = field.value;
  }
  return payload;
}

function applyRedirectTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const value = data[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function showError(form: HTMLFormElement, message: string): void {
  const errorEl = form.querySelector('[data-form-error]');
  if (errorEl) {
    errorEl.textContent = message;
    (errorEl as HTMLElement).hidden = false;
  }
}

function initForms(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-admin-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = form.querySelector('[data-form-error]') as HTMLElement | null;
      if (errorEl) errorEl.hidden = true;

      const table = form.dataset.table;
      const method = (form.dataset.method || 'POST').toUpperCase();
      if (!table) return;

      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      const originalLabel = submitButton?.textContent ?? '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving…';
      }

      try {
        const payload = collectFormPayload(form);
        const response = await fetch(`/api/admin/content/${encodeURIComponent(table)}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as {
          success: boolean;
          data?: Record<string, unknown>;
          error?: string;
        };

        if (!result.success) {
          showError(form, result.error || 'Something went wrong. Please try again.');
        } else {
          const redirectTemplate = form.dataset.redirect;
          if (redirectTemplate && result.data) {
            window.location.assign(applyRedirectTemplate(redirectTemplate, result.data));
          } else {
            window.location.reload();
          }
          return;
        }
      } catch {
        showError(form, 'Something went wrong. Please try again.');
      }

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    });
  });
}

function initDeleteButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-admin-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const table = button.dataset.table;
      const keyNames = (button.dataset.key || '').split(',').filter(Boolean);
      const keyValues = (button.dataset.keyValue || '').split(',');
      const confirmMessage = button.dataset.confirm || 'Delete this record?';
      if (!table || keyNames.length === 0) return;
      if (!window.confirm(confirmMessage)) return;

      const params = new URLSearchParams();
      keyNames.forEach((name, i) => params.set(name, keyValues[i] ?? ''));

      button.disabled = true;
      try {
        const response = await fetch(
          `/api/admin/content/${encodeURIComponent(table)}?${params.toString()}`,
          { method: 'DELETE' },
        );
        const result = (await response.json()) as { success: boolean; error?: string };
        if (result.success) {
          window.location.reload();
        } else {
          window.alert(result.error || 'Could not delete this record.');
          button.disabled = false;
        }
      } catch {
        window.alert('Could not delete this record.');
        button.disabled = false;
      }
    });
  });
}

function init(): void {
  initForms();
  initDeleteButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
