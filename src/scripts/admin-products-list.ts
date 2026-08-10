/**
 * Products list — Archive/Unarchive/Duplicate row actions. Edit and
 * Preview are plain links (to the detail page), not JS actions.
 */

function rowMessage(id: string): HTMLElement | null {
  return document.querySelector(`[data-row-message="${id}"]`);
}

function showError(id: string, message: string): void {
  const el = rowMessage(id);
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

async function patchInternalStatus(id: string, status: 'active' | 'archived'): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ internalStatus: status }),
  });
  const result = (await res.json()) as { success: boolean; error?: string };
  if (result.success) {
    window.location.reload();
  } else {
    showError(id, result.error || 'Could not update this product.');
  }
}

function init(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-archive-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.productId;
      if (id) void patchInternalStatus(id, 'archived');
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-unarchive-product]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.productId;
      if (id) void patchInternalStatus(id, 'active');
    });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-duplicate-product]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.productId;
      if (!id) return;
      btn.disabled = true;
      try {
        const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
        const result = (await res.json()) as {
          success: boolean;
          error?: string;
          data?: { id: string };
        };
        if (result.success && result.data) {
          window.location.assign(`/admin/products/${result.data.id}`);
        } else {
          showError(id, result.error || 'Could not duplicate this product.');
          btn.disabled = false;
        }
      } catch {
        showError(id, 'Could not duplicate this product.');
        btn.disabled = false;
      }
    });
  });

  const addCategoryForm = document.getElementById('addCategoryForm') as HTMLFormElement | null;
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = document.getElementById('categoryError') as HTMLElement;
      errorEl.hidden = true;
      const nameInput = document.getElementById('newCategoryName') as HTMLInputElement;
      const name = nameInput.value.trim();
      if (!name) return;

      try {
        const res = await fetch('/api/admin/products/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const result = (await res.json()) as { success: boolean; error?: string };
        if (result.success) {
          window.location.reload();
        } else {
          errorEl.textContent = result.error || 'Could not create this category.';
          errorEl.hidden = false;
        }
      } catch {
        errorEl.textContent = 'Could not create this category.';
        errorEl.hidden = false;
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
