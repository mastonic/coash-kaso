'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { SessionPlaybook } from '@/components/SessionPlaybook';
import { SessionExportPDF } from '@/components/SessionExportPDF';
import { FicheSeance } from '@/components/seance/FicheSeance';
import type { SessionData } from '@/lib/gemini';
import type { Seance } from '@/lib/seance/schema';

interface HistorySession {
  id: string;
  version?: number;
  theme: string;
  load?: string;
  school?: string;
  playerCount?: number;
  categorie?: string;
  effectif?: number;
  duree?: number;
  charge?: string;
  date: string;
  content?: SessionData | Seance;
}

function isSeanceV2(content: SessionData | Seance | undefined): content is Seance {
  return !!content && (content as Seance).version === 2;
}

function SessionDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const [session, setSession] = useState<HistorySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      setMounted(true);
      try {
        const { id } = await params;
        const stored = localStorage.getItem('mastro_sessions');
        if (stored) {
          const sessions = JSON.parse(stored) as HistorySession[];
          const found = sessions.find((s) => s.id === id);
          if (found && found.content) {
            setSession(found);
          }
        }
      } catch (e) {
        console.error('Error loading session:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [params]);

  if (!mounted) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0F0D]">
        <ToolsNav currentPage="history" />
        <section className="max-w-4xl mx-auto px-6 py-12">
          <p className="text-[#9CA3AF]">Chargement...</p>
        </section>
      </main>
    );
  }

  if (!session || !session.content) {
    return (
      <main className="min-h-screen bg-[#0A0F0D]">
        <ToolsNav currentPage="history" />
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-red-200">
            <h1 className="text-2xl font-bold mb-2">❌ Séance non trouvée</h1>
            <p className="mb-4">Cette séance n&apos;existe pas ou a été supprimée.</p>
            <Link
              href="/history"
              className="text-[#39FF14] hover:text-[#10B981] font-bold"
            >
              ← Retour à l&apos;historique
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── Séance v2 (fiche FFF) ──
  if (isSeanceV2(session.content)) {
    return (
      <main className="min-h-screen bg-[#0A0F0D]">
        <div className="print:hidden">
          <ToolsNav currentPage="history" />
          <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href="/history"
                className="font-bold text-[#39FF14] hover:text-[#10B981]"
              >
                ← Historique
              </Link>
              <button
                onClick={() => window.print()}
                className="ml-auto rounded-lg bg-[#39FF14] px-5 py-2.5 font-bold text-[#0A0F0D] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]"
              >
                🖨 Imprimer / PDF
              </button>
            </div>
            <FicheSeance
              seance={session.content}
              date={new Date(session.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
          </section>
        </div>
        <div className="hidden bg-white p-6 print:block">
          <FicheSeance seance={session.content} print />
        </div>
      </main>
    );
  }

  // ── Séance v1 (ancien format) ──
  const legacy = session.content as SessionData;
  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="history" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <Link
              href="/history"
              className="text-[#39FF14] hover:text-[#10B981] font-bold mb-4 inline-block text-sm md:text-base"
            >
              ← Historique
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-3 md:mb-4">
              Séance : {session.theme.charAt(0).toUpperCase() + session.theme.slice(1)}
            </h1>
            <div className="flex gap-2 md:gap-3 flex-wrap">
              {session.school && (
                <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                  {session.school}
                </span>
              )}
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {session.playerCount} joueurs
              </span>
              {session.load && (
                <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                  {session.load}
                </span>
              )}
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {new Date(session.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <SessionExportPDF
            theme={session.theme}
            load={session.load ?? ''}
            school={session.school ?? ''}
            playerCount={session.playerCount ?? 0}
            games={legacy.games}
            exercises={legacy.exercises}
            situations={legacy.situations}
          />
        </div>

        <SessionPlaybook
          data={legacy}
          theme={session.theme}
          load={session.load}
          school={session.school}
          playerCount={session.playerCount}
        />
      </section>
    </main>
  );
}

export default function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AccessGate>
      <SessionDetailContent params={params} />
    </AccessGate>
  );
}
