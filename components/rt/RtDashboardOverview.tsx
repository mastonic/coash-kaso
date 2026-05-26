'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ActiveSession {
  id: string;
  items: Array<{
    type: 'game' | 'exercise' | 'situation';
    index: number;
    title: string;
    duration: number;
  }>;
  timestamp: string;
  status: 'Validée' | 'En cours' | 'Complétée';
  sources?: Array<'vision' | 'live'>;
}

export function RtDashboardOverview() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load active sessions from localStorage
  useEffect(() => {
    const sessions = localStorage.getItem('active_sessions');
    if (sessions) {
      try {
        setActiveSessions(JSON.parse(sessions));
      } catch (err) {
        console.error('Error parsing active_sessions:', err);
        setActiveSessions([]);
      }
    }
    setMounted(true);
  }, []);

  const categories = [
    { id: 'u11', label: 'U11', present: 12, total: 13, color: '#39FF14' },
    { id: 'u13', label: 'U13', present: 15, total: 16, color: '#10B981' },
    { id: 'u15', label: 'U15', present: 18, total: 18, color: '#39FF14' },
    { id: 'u17', label: 'U17', present: 14, total: 15, color: '#10B981' },
    { id: 'senior', label: 'Senior', present: 11, total: 12, color: '#39FF14' },
  ];

  // Map active sessions to display format
  const sessions = activeSessions.length > 0
    ? activeSessions.map((sess, idx) => ({
        id: idx + 1,
        category: 'U13', // Map based on first item if needed
        date: new Date(sess.timestamp).toLocaleDateString('fr-FR', { weekday: 'long' }),
        status: sess.status || 'Validée',
        theme: sess.items[0]?.title || 'Séance personnalisée',
        sources: sess.sources || [],
      }))
    : [
        { id: 1, category: 'U13', date: 'Aujourd\'hui', status: 'En cours', theme: 'Possession', sources: ['vision', 'live'] },
        { id: 2, category: 'U15', date: 'Hier', status: 'Complétée', theme: 'Pressing', sources: ['vision'] },
        { id: 3, category: 'Senior', date: 'Demain', status: 'Planifiée', theme: 'Transitions', sources: [] },
      ];

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2 animate-fade-in-up">
        <h2 className="text-3xl md:text-4xl font-black text-[#F3F4F6]">
          Tableau de Bord RT
        </h2>
        <p className="text-[#9CA3AF] text-sm md:text-base">
          Pilote ta saison en temps réel • Gère tous tes entraînements et équipes
        </p>
      </div>

      {/* Live Tracker - Catégories */}
      <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-8 animate-fade-in-up">
        <h3 className="text-base md:text-xl font-bold text-[#F3F4F6] mb-4 md:mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
          Présences en Temps Réel
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`relative p-3 md:p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 group animate-fade-in-up cursor-pointer`}
              style={{
                borderColor: selectedCategory === cat.id ? cat.color : 'rgba(57,255,20,0.2)',
                backgroundColor: selectedCategory === cat.id ? 'rgba(57,255,20,0.1)' : '#0A0F0D',
              }}
            >
              <div className="space-y-2 md:space-y-3 text-center">
                <h4 className="text-base md:text-lg font-black text-[#F3F4F6] group-hover:text-[#39FF14] transition-colors">
                  {cat.label}
                </h4>
                <div className="space-y-1">
                  <div className="text-xl md:text-2xl font-black" style={{ color: cat.color }}>
                    {cat.present}/{cat.total}
                  </div>
                  <div className="w-full bg-[#0A0F0D] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(cat.present / cat.total) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[#9CA3AF] font-semibold">
                    {Math.round((cat.present / cat.total) * 100)}%
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Détails Catégorie Sélectionnée */}
        {selectedCategory && (
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[rgba(57,255,20,0.2)] animate-fade-in-up">
            <h4 className="text-base md:text-lg font-bold text-[#F3F4F6] mb-4">
              Détails {categories.find(c => c.id === selectedCategory)?.label}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <div className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg p-3 md:p-4">
                <p className="text-[#9CA3AF] text-xs md:text-sm mb-1">Présents</p>
                <p className="text-2xl md:text-3xl font-black text-[#39FF14]">
                  {categories.find(c => c.id === selectedCategory)?.present}
                </p>
              </div>
              <div className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg p-3 md:p-4">
                <p className="text-[#9CA3AF] text-xs md:text-sm mb-1">Total</p>
                <p className="text-2xl md:text-3xl font-black text-[#10B981]">
                  {categories.find(c => c.id === selectedCategory)?.total}
                </p>
              </div>
              <div className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg p-3 md:p-4">
                <p className="text-[#9CA3AF] text-xs md:text-sm mb-1">Absents</p>
                <p className="text-2xl md:text-3xl font-black text-red-500">
                  {(categories.find(c => c.id === selectedCategory)?.total ?? 0) - (categories.find(c => c.id === selectedCategory)?.present ?? 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Programmées */}
      <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-base md:text-xl font-bold text-[#F3F4F6] mb-4 md:mb-6">
          Séances Programmées
        </h3>

        <div className="space-y-4">
          {sessions.map((session, idx) => {
            const statusColors: Record<string, string> = {
              'En cours': '#39FF14',
              'Complétée': '#10B981',
              'Planifiée': '#9CA3AF',
            };

            return (
              <div
                key={session.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg hover:border-[#39FF14] hover:shadow-[0_0_20px_rgba(57,255,20,0.2)] transition-all duration-300 animate-fade-in-up cursor-pointer group gap-3 md:gap-0"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 md:px-3 py-0.5 md:py-1 bg-[#141E1A] text-[#39FF14] rounded-full text-xs font-bold flex-shrink-0">
                      {session.category}
                    </span>
                    <h4 className="text-[#F3F4F6] font-bold group-hover:text-[#39FF14] transition-colors text-sm md:text-base truncate">
                      {session.theme}
                    </h4>
                    {session.sources && session.sources.length > 0 && (
                      <div className="flex gap-1 md:gap-2 flex-shrink-0">
                        {session.sources.includes('vision') && (
                          <span className="px-1.5 md:px-2 py-0.5 bg-[#39FF14]/20 text-[#39FF14] rounded text-xs font-bold whitespace-nowrap">
                            📸 Vision
                          </span>
                        )}
                        {session.sources.includes('live') && (
                          <span className="px-1.5 md:px-2 py-0.5 bg-[#10B981]/20 text-[#10B981] rounded text-xs font-bold whitespace-nowrap">
                            🎙️ Live
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[#9CA3AF] text-xs md:text-sm">
                    {session.date}
                  </p>
                </div>

                <div className="md:text-right space-y-1 flex md:flex-col gap-2 md:gap-0">
                  <div
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-xs uppercase"
                    style={{
                      backgroundColor: `${statusColors[session.status]}20`,
                      color: statusColors[session.status],
                    }}
                  >
                    {session.status}
                  </div>
                  <button onClick={() => router.push('/history')} className="text-[#39FF14] hover:text-[#10B981] text-xs md:text-sm font-bold transition-colors">
                    → Voir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Bouton */}
      <div className="text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <button onClick={() => router.push('/session')} className="group relative px-6 md:px-8 py-3 md:py-4 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] uppercase animate-pop min-h-[48px] md:min-h-[44px] text-sm md:text-base">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
          <span className="relative z-10">+ Ajouter une Nouvelle Séance</span>
        </button>
      </div>
    </div>
  );
}
