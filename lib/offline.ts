import { toast } from './toast';

let offlineBannerShown = false;
let onlineListenerAttached = false;

export function initOfflineDetection() {
  if (typeof window === 'undefined') return;

  if (!onlineListenerAttached) {
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    onlineListenerAttached = true;

    if (!navigator.onLine) {
      handleOffline();
    }
  }
}

function handleOffline() {
  if (!offlineBannerShown) {
    toast.warning('📡 Mode hors ligne - vérifiez votre connexion');
    offlineBannerShown = true;
  }
}

function handleOnline() {
  toast.success('📡 Connexion rétablie');
  offlineBannerShown = false;
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}
