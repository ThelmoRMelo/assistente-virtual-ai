import { registerSW } from 'virtual:pwa-register';

function isLovablePreviewHost(hostname: string) {
  return (
    hostname.startsWith('id-preview--') ||
    hostname.startsWith('preview--') ||
    hostname === 'lovableproject.com' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname === 'lovableproject-dev.com' ||
    hostname.endsWith('.lovableproject-dev.com') ||
    hostname === 'beta.lovable.dev' ||
    hostname.endsWith('.beta.lovable.dev')
  );
}

async function unregisterAppShellWorkers() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((registration) => registration.active?.scriptURL.endsWith('/sw.js'))
      .map((registration) => registration.unregister()),
  );
}

export function registerAniaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const params = new URLSearchParams(window.location.search);
  const shouldSkip =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isLovablePreviewHost(window.location.hostname) ||
    params.get('sw') === 'off';

  if (shouldSkip) {
    void unregisterAppShellWorkers();
    return;
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      registration?.update();
    },
    onNeedRefresh() {
      window.location.reload();
    },
  });
}