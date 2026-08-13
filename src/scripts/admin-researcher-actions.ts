/**
 * Per-row researcher account actions on /admin/researchers — posts to
 * the three dedicated /api/admin/researchers/[id]/* routes. Mirrors
 * src/scripts/admin-user-role.ts's fetch/disable/reload pattern.
 */
async function callAction(
  button: HTMLButtonElement,
  action: string,
  userId: string,
): Promise<void> {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Working…';

  let body: string | undefined;
  if (action === 'suspend') {
    const reason = window.prompt('Reason for suspension (optional):') ?? '';
    body = JSON.stringify({ reason });
  }

  try {
    const response = await fetch(`/api/admin/researchers/${encodeURIComponent(userId)}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const result = (await response.json()) as { success: boolean; error?: string };
    if (result.success) {
      window.location.reload();
      return;
    }
    window.alert(result.error || 'Could not complete this action.');
  } catch {
    window.alert('Could not complete this action.');
  }

  button.disabled = false;
  button.textContent = original;
}

function init(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-suspend-user]').forEach((btn) => {
    btn.addEventListener('click', () => callAction(btn, 'suspend', btn.dataset.suspendUser!));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-reinstate-user]').forEach((btn) => {
    btn.addEventListener('click', () => callAction(btn, 'reinstate', btn.dataset.reinstateUser!));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-recertify-user]').forEach((btn) => {
    btn.addEventListener('click', () =>
      callAction(btn, 'require-recertification', btn.dataset.recertifyUser!),
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
