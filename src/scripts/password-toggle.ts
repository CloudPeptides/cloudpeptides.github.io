/**
 * Password visibility toggle — shared by every account-gate form with a
 * password field (login, register, reset-password). Wires every
 * `[data-password-toggle]` button to the `<input>` named by its
 * `data-target` attribute; framework-free, progressive enhancement
 * (without this script the field is simply always type="password").
 */
function initPasswordToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-password-toggle]').forEach((btn) => {
    const targetId = btn.dataset.target;
    const input = targetId && (document.getElementById(targetId) as HTMLInputElement | null);
    if (!input) return;
    btn.addEventListener('click', () => {
      const shown = input.type === 'text';
      input.type = shown ? 'password' : 'text';
      btn.setAttribute('aria-pressed', String(!shown));
      btn.textContent = shown ? 'Show' : 'Hide';
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPasswordToggles);
} else {
  initPasswordToggles();
}

export {};
