import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { ToastContainer } from '@/components/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProSéance - Assistant Tactique & Pilotage Club',
  description: 'L\'assistant IA qui génère des séances d\'entraînement complètes, analyse les vidéos, et pilote ta saison. Pour les entraîneurs et clubs de football.',
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
        <Analytics />
      </body>
    </html>
  );
}
