'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (PWA) au chargement de l'app. */
export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Enregistrement du service worker impossible :', err);
      });
    }
  }, []);

  return null;
}
