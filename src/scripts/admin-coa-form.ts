/**
 * COA upload form on /admin/coas/new — posts multipart/form-data
 * directly to src/pages/api/admin/coas/index.ts (a plain <form>
 * submit would do this natively, but we still intercept it so a
 * failure shows an inline message instead of a full navigation, same
 * UX convention as every other admin form in this app).
 */
function init(): void {
  const form = document.getElementById('coaUploadForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('coaUploadError');
    if (errorEl) errorEl.hidden = true;

    const button = document.getElementById('coaUploadSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Uploading…';

    try {
      const response = await fetch('/api/admin/coas', {
        method: 'POST',
        body: new FormData(form),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: { id?: string };
      };
      if (result.success && result.data?.id) {
        window.location.assign(`/admin/coas/${result.data.id}`);
        return;
      }
      if (errorEl) {
        errorEl.textContent = result.error || 'Could not upload this COA.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Could not upload this COA.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'Upload as draft';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
