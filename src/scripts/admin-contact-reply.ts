/**
 * Contact-submission reply form (src/pages/admin/contact-submissions/[id].astro)
 * — posts to src/pages/api/admin/contact-submissions/[id]/reply.ts and
 * reloads on success so the status badge/reply history/audit sections
 * all reflect the real, server-verified new state rather than an
 * optimistic client-side guess. Mirrors
 * src/scripts/admin-order-request-status.ts's own pattern.
 */
function init(): void {
  const form = document.getElementById('replyForm') as HTMLFormElement | null;
  if (!form) return;
  const submissionId = form.dataset.submissionId;
  if (!submissionId) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageEl = document.getElementById('replyMessage');
    if (messageEl) messageEl.hidden = true;

    const body = (document.getElementById('replyBody') as HTMLTextAreaElement).value;
    const button = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (button) button.disabled = true;

    try {
      const response = await fetch(`/api/admin/contact-submissions/${submissionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        warning?: string;
      };
      if (result.success) {
        window.location.reload();
        return;
      }
      if (messageEl) {
        messageEl.textContent = result.error || 'Could not send this reply.';
        messageEl.hidden = false;
      }
    } catch {
      if (messageEl) {
        messageEl.textContent = 'Could not send this reply.';
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
