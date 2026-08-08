/**
 * Compound status-transition controls — posts to
 * src/pages/api/admin/compounds/[id]/status.ts. Separate from
 * admin-form.ts because this endpoint has its own shape (a single
 * target_status field, plus a structured blockers/warnings list on
 * failure that's worth rendering as a real list, not a flat error
 * string).
 *
 *   <form data-status-form data-compound-id="…">
 *     <button type="submit" name="target_status" value="in_review">Submit for review</button>
 *     <button type="submit" name="target_status" value="published">Publish</button>
 *     <div data-status-error hidden></div>
 *   </form>
 */
function init(): void {
  const form = document.querySelector<HTMLFormElement>('form[data-status-form]');
  if (!form) return;
  const compoundId = form.dataset.compoundId;
  if (!compoundId) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const targetStatus = submitter?.value;
    if (!targetStatus) return;

    const errorEl = form.querySelector('[data-status-error]') as HTMLElement | null;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.innerHTML = '';
    }

    const buttons = form.querySelectorAll('button');
    buttons.forEach((b) => ((b as HTMLButtonElement).disabled = true));

    try {
      const response = await fetch(`/api/admin/compounds/${compoundId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_status: targetStatus }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        blockers?: string[];
        warnings?: string[];
      };

      if (result.success) {
        window.location.reload();
        return;
      }

      if (errorEl) {
        const parts: string[] = [`<p>${result.error ?? 'This status change was rejected.'}</p>`];
        if (result.blockers?.length) {
          parts.push(`<ul>${result.blockers.map((b) => `<li>${b}</li>`).join('')}</ul>`);
        }
        errorEl.innerHTML = parts.join('');
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.hidden = false;
      }
    }

    buttons.forEach((b) => ((b as HTMLButtonElement).disabled = false));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
