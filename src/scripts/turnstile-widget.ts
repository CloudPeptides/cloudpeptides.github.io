/**
 * Loads and renders the Cloudflare Turnstile widget into any
 * `[data-turnstile]` container on the page. Requires loading Cloudflare's
 * own hosted widget script (challenges.cloudflare.com) — there's no way
 * around this external load; Turnstile is a hosted widget, not an npm
 * package. Renders nothing if no sitekey is configured (Turnstile isn't
 * active yet — the form still works via the honeypot/cooldown/rate-limit
 * layers already in place).
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: { sitekey: string; callback?: (token: string) => void },
      ) => string;
    };
  }
}

const SITEKEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
const WIDGET_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

function loadScriptOnce(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${WIDGET_SCRIPT_SRC}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    document.head.appendChild(script);
  });
}

async function init(): Promise<void> {
  if (!SITEKEY) return; // Turnstile not configured yet — nothing to render.
  const containers = document.querySelectorAll<HTMLElement>('[data-turnstile]');
  if (containers.length === 0) return;

  try {
    await loadScriptOnce();
  } catch {
    return; // Widget script failed to load — form still works via the
    // other defense layers; siteverify server-side will simply reject
    // submissions with no token once Turnstile is actually required.
  }

  const render = () => {
    containers.forEach((container) => {
      if (container.dataset.turnstileRendered) return;
      window.turnstile?.render(container, { sitekey: SITEKEY });
      container.dataset.turnstileRendered = 'true';
    });
  };

  if (window.turnstile) {
    render();
  } else {
    // The script may still be executing its own init; poll briefly.
    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval);
        render();
      }
    }, 100);
    window.setTimeout(() => window.clearInterval(interval), 5000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
