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
  ecole?: string;
  date: string;
  content?: unknown;
}

async function chargerSessionsFirestore(email: string): Promise<Session[]> {
  try {
    const res = await fetch(`/api/history?email=${encodeURIComponent(email)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.sessions as Session[]) : [];
  } catch {
    return [];
  }
}

function chargerSessionsLocales(): Session[] {
  try {
    const stored = localStorage.getItem('mastro_sessions');
    return stored ? (JSON.parse(stored) as Session[]) : [];
  } catch {
    return [];
  }
}

function HistoryContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'firestore' | 'local'>('local');

  useEffect(() => {
    setMounted(true);
    const email = localStorage.getItem('mastro_user');

    const load = async () => {
      if (email) {
        const remote = await chargerSessionsFirestore(email);
        if (remote.length > 0) {
          setSessions([...remote].reverse());
          setSource('firestore');
          setLoading(false);
          return;
        }
      }
      // Fallback localStorage
      const local = chargerSessionsLocales();
      setSessions([...local].reverse());
      setSource('local');
      setLoading(false);
    };

    load();
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen min-h-dvh bg-[#0A0F0D]">
      <ToolsNav currentPage="history" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-end justify-between mb-2 flex-wrap gap-2">
          <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6]">Historique</h1>
          {!loading && source === 'local' && sessions.length > 0 && (
            <span className="text-xs text-[#9CA3AF] bg-[#141E1A] border border-[rgba(57,255,20,0.15)] px-3 py-1 rounded-full">
              Stockage local
            </span>
          )}
          {!loading && source === 'firestore' && (
            <span className="text-xs text-[#39FF14] bg-[rgba(57,255,20,0.08)] border border-[rgba(57,255,20,0.25)] px-3 py-1 rounded-full">
              Synchronisé
            </span>
          )}
        </div>
        <p className="text-[#9CA3AF] mb-6 md:mb-8 text-sm md:text-base">Toutes vos séances générées</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#39FF14] border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
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
