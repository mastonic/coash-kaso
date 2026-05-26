'use client';

import { useState, useEffect } from 'react';
import { SessionPlaybook } from '@/components/SessionPlaybook';
import { LoadingShimmer } from '@/components/LoadingShimmer';
import Link from 'next/link';
import type { SessionData } from '@/lib/gemini';

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<{
    theme: string;
    load: string;
    school: string;
    playerCount: number;
  } | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/get-shared-session/${id}`);
        if (!response.ok) {
          throw new Error('Séance non trouvée ou expirée');
        }
        const data = await response.json();
        setSession(data.sessionData);
        setMetadata({
          theme: data.theme,
          load: data.load,
          school: data.school,
          playerCount: data.playerCount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-black text-[#F3F4F6] mb-12">Chargement séance...</h1>
          <LoadingShimmer />
        </section>
      </main>
    );
  }

  if (error || !session || !metadata) {
    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-200">
            <h1 className="text-2xl font-bold mb-2">❌ {error || 'Erreur'}</h1>
            <p className="mb-4">Cette séance n'existe pas ou a expiré.</p>
            <Link href="/" className="text-[#39FF14] hover:text-[#10B981] font-bold">
              ← Retour à l'accueil
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-black text-[#F3F4F6]">Séance Partagée</h1>
            <Link href="/" className="text-[#39FF14] hover:text-[#10B981] font-bold">
              ← Accueil
            </Link>
          </div>
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[#9CA3AF] text-xs uppercase">Thème</p>
                <p className="text-[#39FF14] font-bold">{metadata.theme}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] text-xs uppercase">Charge</p>
                <p className="text-[#39FF14] font-bold">{metadata.load}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] text-xs uppercase">École</p>
                <p className="text-[#39FF14] font-bold">{metadata.school}</p>
              </div>
              <div>
                <p className="text-[#9CA3AF] text-xs uppercase">Joueurs</p>
                <p className="text-[#39FF14] font-bold">{metadata.playerCount}</p>
              </div>
            </div>
          </div>
        </div>

        <SessionPlaybook
          data={session}
          theme={metadata.theme}
          load={metadata.load}
          school={metadata.school}
          playerCount={metadata.playerCount}
        />
      </section>
    </main>
  );
}
