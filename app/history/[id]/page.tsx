'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { SessionPlaybook } from '@/components/SessionPlaybook';
import { SessionExportPDF } from '@/components/SessionExportPDF';
import type { SessionData } from '@/lib/gemini';

interface HistorySession {
  id: string;
  theme: string;
  load: string;
  school: string;
  playerCount: number;
  date: string;
  content?: SessionData;
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
            <p className="mb-4">Cette séance n'existe pas ou a été supprimée.</p>
            <Link
              href="/history"
              className="text-[#39FF14] hover:text-[#10B981] font-bold"
            >
              ← Retour à l'historique
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="history" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          <div className="flex-1">
            <Link
              href="/history"
              className="text-[#39FF14] hover:text-[#10B981] font-bold mb-4 inline-block text-sm md:text-base"
            >
              ← Historique
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-3 md:mb-4">
              Séance: {session.theme.charAt(0).toUpperCase() + session.theme.slice(1)}
            </h1>
            <div className="flex gap-2 md:gap-3 flex-wrap">
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {session.school}
              </span>
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {session.playerCount} joueurs
              </span>
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {session.load}
              </span>
              <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                {new Date(session.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          <SessionExportPDF
            theme={session.theme}
            load={session.load}
            school={session.school}
            playerCount={session.playerCount}
            games={session.content.games}
            exercises={session.content.exercises}
            situations={session.content.situations}
          />
        </div>

        {/* Playbook */}
        <SessionPlaybook
          data={session.content}
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
