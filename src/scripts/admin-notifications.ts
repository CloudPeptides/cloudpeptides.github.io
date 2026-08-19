/**
 * Admin Notification Settings page logic (src/pages/admin/notifications.astro).
 * Every status field here reflects a real browser/OS fact, checked live
 * — nothing is assumed or cached across page loads. Permission is NEVER
 * requested automatically; `Notification.requestPermission()` /
 * `pushManager.subscribe()` only run inside the Enable button's own
 * click handler, so the browser always sees them as a direct result of
 * a user gesture (required for iOS Safari to allow the prompt at all).
 */

function isStandalone(): boolean {
  const mql = window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari's own (non-standard, still shipping) signal for "running
  // as an installed Home Screen app" — matchMedia alone doesn't cover
  // it on iOS in every version.
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return mql || iosStandalone;
}

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function showMessage(kind: 'error' | 'success', text: string): void {
  const errorEl = el<HTMLParagraphElement>('npMessage');
  const successEl = el<HTMLParagraphElement>('npSuccess');
  if (errorEl) errorEl.hidden = kind !== 'error';
  if (successEl) successEl.hidden = kind !== 'success';
  const target = kind === 'error' ? errorEl : successEl;
  if (target) target.textContent = text;
}

function clearMessages(): void {
  const errorEl = el<HTMLParagraphElement>('npMessage');
  const successEl = el<HTMLParagraphElement>('npSuccess');
  if (errorEl) errorEl.hidden = true;
  if (successEl) successEl.hidden = true;
}

async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration('/admin/');
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

async function refreshStatus(): Promise<void> {
  const installedEl = el<HTMLElement>('npInstalled');
  const supportedEl = el<HTMLElement>('npSupported');
  const permissionEl = el<HTMLElement>('npPermission');
  const subscribedEl = el<HTMLElement>('npSubscribed');
  const enableBtn = el<HTMLButtonElement>('npEnable');
  const testBtn = el<HTMLButtonElement>('npTest');
  const disableBtn = el<HTMLButtonElement>('npDisable');
  const iosSection = el<HTMLElement>('npIosSection');

  const standalone = isStandalone();
  const supported = pushSupported();
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';

  if (installedEl) installedEl.textContent = standalone ? 'Yes' : 'No — open in a browser tab';
  if (supportedEl)
    supportedEl.textContent = supported ? 'Yes' : 'No — this browser/OS can’t receive push';
  if (permissionEl) {
    permissionEl.textContent =
      permission === 'granted'
        ? 'Granted'
        : permission === 'denied'
          ? 'Denied'
          : 'Not yet requested';
  }

  let subscribed = false;
  if (supported && standalone) {
    const subscription = await getExistingSubscription();
    subscribed = subscription !== null;
  }
  if (subscribedEl)
    subscribedEl.textContent = subscribed ? 'Subscribed on this device' : 'Not subscribed';

  // iOS specifically requires Home Screen installation before push can
  // work at all — show the install steps instead of a doomed Enable
  // button whenever that precondition isn't met yet.
  const needsIosInstall = isIOS() && !standalone;
  if (iosSection) iosSection.hidden = !needsIosInstall;

  if (enableBtn) enableBtn.hidden = needsIosInstall || subscribed || !supported || !standalone;
  if (testBtn) testBtn.hidden = !subscribed;
  if (disableBtn) disableBtn.hidden = !subscribed;

  if (!standalone && !needsIosInstall && enableBtn) {
    // Android/desktop: push works fine without installing, but this app
    // is meant to be installed — nudge without blocking.
    enableBtn.hidden = false;
  }
}

async function handleEnable(): Promise<void> {
  clearMessages();
  const button = el<HTMLButtonElement>('npEnable');
  const vapidKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    showMessage('error', 'Push notifications are not configured in this environment yet.');
    return;
  }
  if (button) button.disabled = true;

  try {
    // A direct result of this click — the only place permission is ever
    // requested (never on page load).
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showMessage('error', 'Notification permission was not granted.');
      return;
    }

    const registration =
      (await navigator.serviceWorker.getRegistration('/admin/')) ??
      (await navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }));
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidKey) as BufferSource,
    });

    const json = subscription.toJSON();
    const response = await fetch('/api/admin/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent.slice(0, 300),
      }),
    });
    const result = (await response.json()) as { success: boolean; error?: string };
    if (!result.success) {
      showMessage('error', result.error || 'Could not save this subscription.');
      return;
    }
    showMessage('success', 'Push notifications are enabled on this device.');
  } catch (err) {
    showMessage(
      'error',
      err instanceof Error ? err.message : 'Could not enable push notifications.',
    );
  } finally {
    if (button) button.disabled = false;
    await refreshStatus();
  }
}

async function handleTest(): Promise<void> {
  clearMessages();
  const button = el<HTMLButtonElement>('npTest');
  if (button) button.disabled = true;
  try {
    const response = await fetch('/api/admin/push/test', { method: 'POST' });
    const result = (await response.json()) as { success: boolean; error?: string };
    if (!result.success) {
      showMessage('error', result.error || 'Could not send a test notification.');
      return;
    }
    showMessage('success', 'Test notification sent — check this device.');
  } catch {
    showMessage('error', 'Could not send a test notification.');
  } finally {
    if (button) button.disabled = false;
  }
}

async function handleDisable(): Promise<void> {
  clearMessages();
  const button = el<HTMLButtonElement>('npDisable');
  if (button) button.disabled = true;
  try {
    const subscription = await getExistingSubscription();
    if (subscription) await subscription.unsubscribe();
    const response = await fetch('/api/admin/push/unsubscribe', { method: 'POST' });
    const result = (await response.json()) as { success: boolean; error?: string };
    if (!result.success) {
      showMessage('error', result.error || 'Could not disable notifications.');
      return;
    }
    showMessage('success', 'Push notifications are disabled on this device.');
  } catch {
    showMessage('error', 'Could not disable notifications.');
  } finally {
    if (button) button.disabled = false;
    await refreshStatus();
  }
}

function init(): void {
  el<HTMLButtonElement>('npEnable')?.addEventListener('click', handleEnable);
  el<HTMLButtonElement>('npTest')?.addEventListener('click', handleTest);
  el<HTMLButtonElement>('npDisable')?.addEventListener('click', handleDisable);
  void refreshStatus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
