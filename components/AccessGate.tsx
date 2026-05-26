'use client';

import { useAccess } from '@/hooks/useAccess';
import Link from 'next/link';

interface AccessGateProps {
  children: React.ReactNode;
}

export function AccessGate({ children }: AccessGateProps) {
  const { isAuthenticated, isLoading } = useAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-[rgba(57,255,20,0.2)] border-t-[#39FF14] rounded-full animate-spin mb-4" />
          </div>
          <p className="text-[#9CA3AF]">Vérification d'accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center px-4">
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-2xl p-6 md:p-8 max-w-md w-full text-center space-y-4 md:space-y-6">
          <div className="text-3xl md:text-4xl">🔒</div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#F3F4F6] mb-2">Accès Restreint</h2>
            <p className="text-[#9CA3AF] mb-4 text-sm md:text-base">
              Cet outil est réservé aux entraîneurs activés.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-3 rounded-lg hover:scale-105 transition-all min-h-[48px] md:min-h-[44px] flex items-center justify-center"
          >
            ⚡ Accéder avec mon email
          </Link>
          <Link
            href="/"
            className="text-[#39FF14] hover:text-[#39FF14]/80 transition-colors text-xs md:text-sm"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
