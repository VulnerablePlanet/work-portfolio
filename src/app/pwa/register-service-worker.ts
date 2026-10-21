import { isFeatureEnabled } from '@/config/feature-flags';

export function registerServiceWorker() {
  if (!isFeatureEnabled('serviceWorker')) {
    return;
  }

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('[pwa] No se pudo registrar el service worker.', error);
    });
  });
}
