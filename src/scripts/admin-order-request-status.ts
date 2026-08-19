/**
 * Order-request status-change form (src/pages/admin/order-requests/[id].astro)
 * — posts to src/pages/api/admin/order-requests/[id]/status.ts and
 * reloads on success so the status badge/history/audit sections all
 * reflect the real, server-verified new state rather than an optimistic
 * client-side guess.
 */
function init(): void {
  const form = document.getElementById('statusForm') as HTMLFormElement | null;
  if (!form) return;
  const orderId = form.dataset.orderId;
  if (!orderId) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageEl = document.getElementById('statusMessage');
    if (messageEl) messageEl.hidden = true;

    const status = (document.getElementById('newStatus') as HTMLSelectElement).value;
    const note = (document.getElementById('statusNote') as HTMLInputElement).value;
    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (button) button.disabled = true;

    try {
      const response = await fetch(`/api/admin/order-requests/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };
      if (result.success) {
        window.location.reload();
        return;
      }
      if (messageEl) {
        messageEl.textContent = result.error || 'Could not update this order request.';
        messageEl.hidden = false;
      }
    } catch {
      if (messageEl) {
        messageEl.textContent = 'Could not update this order request.';
        messageEl.hidden = false;
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
