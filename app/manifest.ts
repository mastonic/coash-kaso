import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ProSéance — Séances de foot méthodologie FFF',
    short_name: 'ProSéance',
    description:
      'Générez des séances d’entraînement de football complètes et illustrées, selon la méthodologie FFF.',
    id: '/',
    start_url: '/session',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0A0F0D',
    theme_color: '#0A0F0D',
    lang: 'fr',
    categories: ['sports', 'productivity', 'education'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Générer une séance',
        url: '/session',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Historique',
        url: '/history',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
