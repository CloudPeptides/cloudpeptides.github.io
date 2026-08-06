/**
 * Framework-free mobile navigation drawer, backed by a native <dialog>.
 * Progressive enhancement: without JS, the nav links are a normal,
 * fully-navigable list — this script only wires the mobile toggle.
 * <dialog> gives focus-trapping and Escape-to-close for free, matching
 * the design handoff's accessibility requirements (§23) with no
 * framework or hydration involved.
 */
function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const dialog = document.querySelector<HTMLDialogElement>('[data-nav-dialog]');
  const closeButton = document.querySelector<HTMLButtonElement>('[data-nav-close]');

  if (!toggle || !dialog) return;

  function setExpanded(open: boolean): void {
    toggle!.setAttribute('aria-expanded', String(open));
  }

  function openDialog(): void {
    dialog!.showModal();
    setExpanded(true);
  }

  // Explicitly sync aria-expanded at every place *we* close the dialog,
  // rather than relying solely on the native "close" event firing — kept
  // reliable regardless of how consistently a given engine dispatches it.
  function closeDialog(): void {
    dialog!.close();
    setExpanded(false);
  }

  toggle.addEventListener('click', () => {
    if (dialog.open) {
      closeDialog();
    } else {
      openDialog();
    }
  });

  closeButton?.addEventListener('click', () => closeDialog());

  // Defensive fallback for the native Escape-key path, which closes the
  // dialog without going through closeDialog() above.
  dialog.addEventListener('close', () => setExpanded(false));

  // Close when a nav link inside the dialog is activated.
  dialog.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeDialog());
  });

  // Click on the dialog's own backdrop (::backdrop can't take a listener,
  // so detect clicks that land on the dialog element itself, outside its
  // rendered content box) closes it too.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNav);
} else {
  initNav();
}
