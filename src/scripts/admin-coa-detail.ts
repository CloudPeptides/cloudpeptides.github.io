/**
 * /admin/coas/[id] — three independent forms on one page: status
 * transitions (publish/unpublish/archive/restore), file replacement,
 * and metadata edits. Each posts to a different part of
 * src/pages/api/admin/coas/[id].ts / [id]/file.ts and reloads on
 * success so every section (including the signed preview URL, which
 * must be regenerated server-side) reflects the change.
 */
function showError(el: HTMLElement | null, message: string): void {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function initStatusForm(): void {
  const form = document.getElementById('coaStatusForm') as HTMLFormElement | null;
  if (!form) return;
  const id = form.dataset.coaId;
  if (!id) return;
  const errorEl = document.getElementById('coaStatusError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.hidden = true;
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value;
    if (!status) return;

    const buttons = form.querySelectorAll('button');
    buttons.forEach((b) => ((b as HTMLButtonElement).disabled = true));

    try {
      const response = await fetch(`/api/admin/coas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        blockers?: string[];
      };
      if (result.success) {
        window.location.reload();
        return;
      }
      const message = result.blockers?.length
        ? `${result.error} ${result.blockers.join(' ')}`
        : (result.error ?? 'This status change was rejected.');
      showError(errorEl, message);
    } catch {
      showError(errorEl, 'Something went wrong. Please try again.');
    }

    buttons.forEach((b) => ((b as HTMLButtonElement).disabled = false));
  });
}

function initFileReplaceForm(): void {
  const form = document.getElementById('coaFileReplaceForm') as HTMLFormElement | null;
  if (!form) return;
  const id = form.dataset.coaId;
  if (!id) return;
  const errorEl = document.getElementById('coaFileReplaceError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.hidden = true;
    const button = document.getElementById('coaFileReplaceSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Replacing…';

    try {
      const response = await fetch(`/api/admin/coas/${id}/file`, {
        method: 'POST',
        body: new FormData(form),
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (result.success) {
        window.location.reload();
        return;
      }
      showError(errorEl, result.error ?? 'Could not replace this file.');
    } catch {
      showError(errorEl, 'Could not replace this file.');
    }

    button.disabled = false;
    button.textContent = 'Replace file';
  });
}

function initMetadataForm(): void {
  const form = document.getElementById('coaMetadataForm') as HTMLFormElement | null;
  if (!form) return;
  const id = form.dataset.coaId;
  if (!id) return;
  const errorEl = document.getElementById('coaMetadataError');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.hidden = true;
    const button = document.getElementById('coaMetadataSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Saving…';

    const formData = new FormData(form);
    const payload: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      payload[key] = String(value);
    }

    try {
      const response = await fetch(`/api/admin/coas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (result.success) {
        window.location.reload();
        return;
      }
      showError(errorEl, result.error ?? 'Could not save these changes.');
    } catch {
      showError(errorEl, 'Could not save these changes.');
    }

    button.disabled = false;
    button.textContent = 'Save metadata';
  });
}

function init(): void {
  initStatusForm();
  initFileReplaceForm();
  initMetadataForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
