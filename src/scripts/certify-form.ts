/**
 * Researcher Certification form — posts to src/pages/api/account/
 * certify.ts. Fields present depend on src/pages/certify.astro's own
 * server-side check (whether a researcher_profiles row already exists)
 * — this script reads whichever inputs are actually on the page and
 * omits the rest, letting the route apply its own validation either way.
 */
function init(): void {
  const form = document.getElementById('certifyForm') as HTMLFormElement | null;
  if (!form) return;

  const redirectTarget = form.dataset.redirect || '/';
  const errorEl = document.getElementById('certifyFormMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) errorEl.hidden = true;

    const fullNameEl = document.getElementById('fullName') as HTMLInputElement | null;
    const countryEl = document.getElementById('country') as HTMLSelectElement | null;
    const regionEl = document.getElementById('region') as HTMLInputElement | null;
    const affiliationEl = document.getElementById('researchAffiliation') as HTMLInputElement | null;
    const age18El = document.getElementById('age18') as HTMLInputElement | null;
    const certificationEl = document.getElementById('certificationAccepted') as HTMLInputElement;

    if (age18El && !age18El.checked) {
      if (errorEl) {
        errorEl.textContent = 'You must confirm that you are at least 18 years old.';
        errorEl.hidden = false;
      }
      return;
    }
    if (!certificationEl.checked) {
      if (errorEl) {
        errorEl.textContent = 'You must accept the Researcher Certification to continue.';
        errorEl.hidden = false;
      }
      return;
    }

    const button = document.getElementById('certifySubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Submitting…';

    try {
      const response = await fetch('/api/account/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullNameEl?.value.trim(),
          country: countryEl?.value,
          region: regionEl?.value.trim(),
          researchAffiliation: affiliationEl?.value.trim(),
          certificationAccepted: certificationEl.checked,
        }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (result.success) {
        window.location.assign(redirectTarget);
        return;
      }
      if (errorEl) {
        errorEl.textContent =
          result.error || 'Could not record your certification. Please try again.';
        errorEl.hidden = false;
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Could not record your certification. Please try again.';
        errorEl.hidden = false;
      }
    }

    button.disabled = false;
    button.textContent = 'I Agree — Continue';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
