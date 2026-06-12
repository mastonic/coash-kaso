'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';

import { themeLabel } from '@/lib/seance/schema';

interface Session {
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
  content?: unknown;
}

function HistoryContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mastro_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Session[];
        // Plus récentes en premier
        setSessions([...parsed].reverse());
      } catch (e) {
        console.error('Error parsing sessions:', e);
      }
    }
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen min-h-dvh bg-[#0A0F0D]">
      <ToolsNav currentPage="history" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-2">Historique</h1>
        <p className="text-[#9CA3AF] mb-6 md:mb-8 text-sm md:text-base">Toutes vos séances générées</p>

        {sessions.length === 0 ? (
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-[#9CA3AF] mb-6">Aucune séance générée pour le moment</p>
            <Link
              href="/session"
              className="inline-block bg-[#39FF14] text-[#0A0F0D] font-bold px-6 py-3 rounded-lg hover:scale-105 transition-all"
            >
              ⚡ Générer une séance
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block"
              >
                <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-6 hover:border-[rgba(57,255,20,0.4)] hover:bg-[rgba(57,255,20,0.05)] transition-all cursor-pointer group">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                    <div className="flex-1">
                      <h3 className="text-base md:text-lg font-black text-[#F3F4F6] mb-2 group-hover:text-[#39FF14] transition-colors">
                        {themeLabel(session.theme)}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {(session.categorie || session.school) && (
                          <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                            {session.categorie ?? session.school}
                          </span>
                        )}
                        <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                          {session.effectif ?? session.playerCount} joueurs
                        </span>
                        {session.duree && (
                          <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                            {session.duree} min
                          </span>
                        )}
                        {(session.charge || session.load) && (
                          <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-2 md:px-3 py-1 rounded-full text-xs font-bold">
                            {session.charge ?? session.load}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[#9CA3AF] text-xs md:text-sm">
                        {new Date(session.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-[#9CA3AF] text-xs">
                        {new Date(session.date).toLocaleTimeString('fr-FR')}
                      </p>
                      <p className="text-[#39FF14] text-xs font-bold mt-2 group-hover:drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">
                        Voir détails →
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <AccessGate>
      <HistoryContent />
    </AccessGate>
  );
}
