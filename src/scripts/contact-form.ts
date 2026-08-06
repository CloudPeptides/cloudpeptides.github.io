/**
 * Contact form submission — posts to src/pages/api/contact.ts.
 */
function setMessage(el: HTMLElement | null, hidden: boolean): void {
  if (el) el.hidden = hidden;
}

function init(): void {
  const form = document.getElementById('contactForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorEl = document.getElementById('contactFormMessage');
    const successEl = document.getElementById('contactFormSuccess');
    setMessage(errorEl, true);
    setMessage(successEl, true);

    const name = (document.getElementById('name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const message = (document.getElementById('message') as HTMLTextAreaElement).value.trim();
    const honeypot = (document.getElementById('contactHoneypot') as HTMLInputElement).value;

    const button = document.getElementById('contactSubmit') as HTMLButtonElement;
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website: honeypot }),
      });
      const result = (await response.json()) as { success: boolean; error?: string };

      if (result.success) {
        form.reset();
        setMessage(successEl, false);
      } else {
        if (errorEl)
          errorEl.textContent =
            result.error || 'There was an error sending your message. Please try again.';
        setMessage(errorEl, false);
      }
    } catch {
      if (errorEl)
        errorEl.textContent = 'There was an error sending your message. Please try again.';
      setMessage(errorEl, false);
    }

    button.disabled = false;
    button.textContent = 'Send Message';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
