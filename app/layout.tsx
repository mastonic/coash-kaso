import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { ToastContainer } from '@/components/Toast';
import { PWARegister } from '@/components/PWARegister';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProSéance — Séances de foot méthodologie FFF',
  description:
    'L’assistant qui génère des séances d’entraînement de football complètes et illustrées (méthodologie FFF) : échauffement, jeux, situations, match — avec le plan de chaque exercice.',
  applicationName: 'ProSéance',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ProSéance',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0F0D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#0A0F0D] text-[#F3F4F6] antialiased overflow-x-hidden">
        {children}
        <ToastContainer />
        <PWARegister />
        <Analytics />
      </body>
    </html>
  );
}
