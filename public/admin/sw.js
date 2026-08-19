/**
 * CloudPeptides Admin PWA service worker.
 *
 * Scope is implicitly "/admin/" because this file is served from
 * /admin/sw.js and registered with no explicit `scope` override wider
 * than its own directory (src/scripts/admin-pwa-register.ts) — it can
 * never intercept requests for the public/researcher-facing site.
 *
 * Two jobs, and only two:
 *  1. Cache a tiny, fixed, versioned app-shell asset list (this file's
 *     own manifest + the brand icon) so the installed app has an icon/
 *     name to show even with a flaky connection. Nothing else is ever
 *     cached — see APP_SHELL_ASSETS below. Every navigation request
 *     (any HTML page), every /api/* call, and every other asset always
 *     goes straight to the network with no caching, by design: this
 *     app shows live admin data (compounds, order requests, researcher
 *     accounts) that must never be served stale, and must never
 *     persist auth/session data in Cache Storage.
 *  2. Show a push notification when the server sends one, and route a
 *     click on it to the right admin page (src/lib/push.ts is the
 *     server-side half of this — see docs/implementation-log.md for
 *     the full push-notification design).
 */

// Bump this string whenever APP_SHELL_ASSETS changes — a new cache name
// means the old one is deleted on activate, so nothing stale lingers.
const CACHE_NAME = 'cp-admin-shell-v1';
const APP_SHELL_ASSETS = ['/admin/manifest.webmanifest', '/brand/logo-square.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Cache-first, but ONLY for the exact fixed app-shell asset list above
  // — every other request (every admin page, every /api/* call, every
  // Supabase call, every auth response) is intentionally left
  // untouched here and falls through to the browser's normal network
  // fetch, so this handler never has an opinion about it at all.
  if (event.request.method === 'GET' && APP_SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
  }
});

// ---------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  const title = typeof payload.title === 'string' ? payload.title : 'CloudPeptides Admin';
  const options = {
    body: typeof payload.body === 'string' ? payload.body : '',
    icon: '/brand/logo-square.png',
    badge: '/brand/logo-square.png',
    // The destination admin URL to open on click — never anything but a
    // same-origin /admin/* path (the server only ever sends one of
    // those; see src/lib/push.ts's buildNotificationPayload()).
    data: { url: typeof payload.url === 'string' ? payload.url : '/admin' },
    tag: typeof payload.tag === 'string' ? payload.tag : undefined,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
