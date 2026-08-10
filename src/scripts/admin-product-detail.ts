/**
 * Product detail/edit page — save form + COA linking.
 */
function init(): void {
  const editForm = document.getElementById('productEditForm') as HTMLFormElement | null;
  if (editForm) {
    editForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorEl = document.getElementById('editError') as HTMLElement;
      const successEl = document.getElementById('editSuccess') as HTMLElement;
      errorEl.hidden = true;
      successEl.hidden = true;

      const productId = editForm.dataset.productId;
      const payload = {
        name: (document.getElementById('name') as HTMLInputElement).value.trim(),
        spec: (document.getElementById('spec') as HTMLInputElement).value.trim(),
        count: Number((document.getElementById('count') as HTMLInputElement).value),
        price: (document.getElementById('price') as HTMLInputElement).value.trim(),
        categoryId: (document.getElementById('categoryId') as HTMLSelectElement).value,
        internalStatus: (document.getElementById('internalStatus') as HTMLSelectElement).value,
        publicStatus: (document.getElementById('publicStatus') as HTMLSelectElement).value,
      };

      try {
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = (await res.json()) as { success: boolean; error?: string };
        if (result.success) {
          successEl.textContent = 'Saved.';
          successEl.hidden = false;
        } else {
          errorEl.textContent = result.error || 'Could not save changes.';
          errorEl.hidden = false;
        }
      } catch {
        errorEl.textContent = 'Could not save changes. Please try again.';
        errorEl.hidden = false;
      }
    });
  }

  const linkCoaForm = document.getElementById('linkCoaForm') as HTMLFormElement | null;
  if (linkCoaForm) {
    linkCoaForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const productId = linkCoaForm.dataset.productId;
      const coaId = (document.getElementById('unlinkedCoaSelect') as HTMLSelectElement).value;
      if (!coaId) return;

      const res = await fetch(`/api/admin/products/${productId}/link-coa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coaId }),
      });
      const result = (await res.json()) as { success: boolean };
      if (result.success) window.location.reload();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
