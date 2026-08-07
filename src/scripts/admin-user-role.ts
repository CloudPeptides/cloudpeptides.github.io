/**
 * Per-row role-change control on /admin/users — posts to
 * src/pages/api/admin/users/[id]/role.ts.
 *
 *   <form data-role-form data-user-id="…">
 *     <select name="role">…</select>
 *     <button type="submit">Save</button>
 *     <span data-role-error hidden></span>
 *   </form>
 */
function init(): void {
  document.querySelectorAll<HTMLFormElement>('form[data-role-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const userId = form.dataset.userId;
      if (!userId) return;
      const select = form.querySelector('select[name="role"]') as HTMLSelectElement | null;
      const errorEl = form.querySelector('[data-role-error]') as HTMLElement | null;
      if (errorEl) errorEl.hidden = true;
      const button = form.querySelector('button') as HTMLButtonElement | null;
      if (button) button.disabled = true;

      try {
        const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: select?.value }),
        });
        const result = (await response.json()) as { success: boolean; error?: string };
        if (result.success) {
          window.location.reload();
          return;
        }
        if (errorEl) {
          errorEl.textContent = result.error || 'Could not update this role.';
          errorEl.hidden = false;
        }
      } catch {
        if (errorEl) {
          errorEl.textContent = 'Could not update this role.';
          errorEl.hidden = false;
        }
      }
      if (button) button.disabled = false;
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
