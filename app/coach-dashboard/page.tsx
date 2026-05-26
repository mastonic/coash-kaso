'use client';

import { useState, useEffect } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';

interface TeamInfo {
  name: string;
  league: string;
  division: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  position: number;
  nextMatch?: {
    opponent: string;
    date: string;
    competition?: string;
  };
}

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
  photoUrl?: string;
}

function CoachDashboardContent() {
  const [selectedLeague, setSelectedLeague] = useState('ligue1');
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  const leagues = [
    { id: 'ligue1', name: 'Ligue 1', level: 1, teams: 20 },
    { id: 'ligue2', name: 'Ligue 2', level: 2, teams: 20 },
    { id: 'national', name: 'National', level: 3, teams: 40 },
    { id: 'national2', name: 'National 2', level: 4, teams: 160 },
    { id: 'regional', name: 'Régional 1', level: 5, teams: 'Nombreux' },
  ];

  const stats = [
    { icon: '🏆', label: 'Classement', value: '#12', color: 'text-yellow-400' },
    { icon: '⚽', label: 'Matches', value: '28/38', color: 'text-green-400' },
    { icon: '✅', label: 'Victoires', value: '16', color: 'text-blue-400' },
    { icon: '🤝', label: 'Nuls', value: '8', color: 'text-purple-400' },
    { icon: '❌', label: 'Défaites', value: '4', color: 'text-red-400' },
    { icon: '📊', label: 'Points', value: '56', color: 'text-[#39FF14]' },
  ];

  useEffect(() => {
    setMounted(true);

    // Load saved league preference
    const savedLeague = localStorage.getItem('mastro_league');
    if (savedLeague) {
      setSelectedLeague(savedLeague);
    }

    const email = localStorage.getItem('mastro_user');
    if (!email) return;

    // Charger les joueurs de l'équipe
    const loadPlayers = async () => {
      try {
        const res = await fetch(`/api/team?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error('Error loading players:', err);
      }
    };

    // Charger le prochain match
    const loadNextMatch = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/schedule/matches?email=${encodeURIComponent(email)}&from=${today}`);
        if (res.ok) {
          const data = await res.json();
          const firstMatch = data.matches?.[0];
          setTeamInfo(prev => ({
            ...(prev || {
              name: 'Équipe',
              league: 'Ligue 1',
              division: 'Division 1',
              wins: 0,
              draws: 0,
              losses: 0,
              points: 0,
              position: 0,
            }),
            nextMatch: firstMatch ? {
              opponent: firstMatch.opponent,
              date: firstMatch.date,
              competition: firstMatch.competition,
            } : undefined,
          }));
        }
      } catch (err) {
        console.error('Error loading next match:', err);
      }
    };

    // Données statiques pour la démonstration
    setTeamInfo({
      name: 'Mon Équipe',
      league: 'Ligue 1',
      division: 'Division 1',
      wins: 16,
      draws: 8,
      losses: 4,
      points: 56,
      position: 12,
    });

    loadPlayers();
    loadNextMatch();
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="coach-dashboard" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#F3F4F6] mb-3">
            Tableau de Bord Entraîneur
          </h1>
          <p className="text-[#9CA3AF] text-lg">
            Gestion de votre équipe et suivi de saison en temps réel
          </p>
        </div>

        {/* League Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* League Selector */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6 flex items-center gap-2">
              🏅 Sélectionner votre Ligue
            </h2>
            <div className="space-y-3">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league.id);
                    localStorage.setItem('mastro_league', league.id);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLeague === league.id
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.15)]'
                      : 'border-[rgba(57,255,20,0.1)] hover:border-[rgba(57,255,20,0.3)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#F3F4F6]">{league.name}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Niveau {league.level} • {league.teams} équipes
                      </p>
                    </div>
                    {selectedLeague === league.id && (
                      <div className="text-[#39FF14] text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 p-4 bg-[rgba(57,255,20,0.1)] border border-[#39FF14] rounded-lg">
              <p className="text-xs text-[#9CA3AF] mb-2">📌 Info FFF:</p>
              <a
                href="https://www.fff.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm flex items-center gap-2"
              >
                Consulter le site officiel FFF →
              </a>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6 flex items-center gap-2">
              📊 Votre Équipe
            </h2>
            {teamInfo && (
              <div className="space-y-4">
                <div>
                  <p className="text-[#9CA3AF] text-sm mb-1">Équipe</p>
                  <p className="text-2xl font-bold text-[#F3F4F6]">{teamInfo.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Position</p>
                    <p className="text-3xl font-black text-[#39FF14]">#{teamInfo.position}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Points</p>
                    <p className="text-3xl font-black text-[#10B981]">{teamInfo.points}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[rgba(57,255,20,0.1)]">
                  <p className="text-[#9CA3AF] text-xs mb-3">Prochain Match</p>
                  {teamInfo.nextMatch && (
                    <div className="bg-[rgba(57,255,20,0.1)] p-3 rounded-lg border border-[#39FF14]">
                      <p className="font-bold text-[#F3F4F6]">
                        vs {teamInfo.nextMatch.opponent}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        📅 {new Date(teamInfo.nextMatch.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">📈 Statistiques</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, idx) => {
              const statKey = `stat-${idx}`;
              const isHovered = hoveredStat === statKey;
              const details: { [key: string]: string } = {
                'stat-0': 'Classement: #12 sur 20',
                'stat-1': '28 matches joués / 38 en saison',
                'stat-2': 'Dernière victoire: 22/05',
                'stat-3': 'Série: 2 matchs consécutifs',
                'stat-4': 'Dernière défaite: 15/05',
                'stat-5': 'Moyenne: 2,0 pts/match',
              };
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredStat(statKey)}
                  onMouseLeave={() => setHoveredStat(null)}
                  className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-xl p-6 hover:border-[#39FF14] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.2)] cursor-default"
                >
                  <p className="text-4xl mb-2">{stat.icon}</p>
                  <p className="text-[#9CA3AF] text-sm mb-1">{stat.label}</p>
                  <p className={`text-3xl font-black ${stat.color} mb-3`}>{stat.value}</p>
                  {isHovered && (
                    <div className="text-xs text-[#9CA3AF] pt-3 border-t border-[rgba(57,255,20,0.1)] animate-fade-in">
                      {details[statKey]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Players Table */}
        {players.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#F3F4F6]">👥 Effectif ({players.length})</h2>
              <a href="/team" className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm">
                Gérer l'équipe →
              </a>
            </div>
            <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(57,255,20,0.2)] bg-[rgba(57,255,20,0.05)]">
                    <th className="px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">#</th>
                    <th className="px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">Joueur</th>
                    <th className="px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">Poste</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 10).map((player) => (
                    <tr key={player.id} className="border-b border-[rgba(57,255,20,0.1)] hover:bg-[rgba(57,255,20,0.05)] transition-colors">
                      <td className="px-6 py-4 text-[#39FF14] font-bold">{player.number || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] font-bold text-xs">
                              {player.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[#F3F4F6] font-semibold">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#9CA3AF] text-sm">{player.position}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {players.length > 10 && (
                <div className="px-6 py-4 bg-[rgba(57,255,20,0.05)] text-center text-[#9CA3AF] text-sm">
                  +{players.length - 10} autres joueurs
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Features */}
        <div className="bg-[#141E1A] border border-[#39FF14] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">⚡ Fonctionnalités ProSéance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">🎬</div>
              <div>
                <h3 className="font-bold text-[#39FF14] mb-1">Analyse Vidéo</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Analysez vos matchs automatiquement avec l'IA
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">⚡</div>
              <div>
                <h3 className="font-bold text-[#39FF14] mb-1">Génération Séances</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Créez des entraînements en 3 secondes
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">📊</div>
              <div>
                <h3 className="font-bold text-[#39FF14] mb-1">Suivi Joueurs</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Suivez la performance de chaque joueur
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl flex-shrink-0">📅</div>
              <div>
                <h3 className="font-bold text-[#39FF14] mb-1">Programmation</h3>
                <p className="text-[#9CA3AF] text-sm">
                  Programmez votre saison automatiquement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[rgba(57,255,20,0.1)] to-[rgba(16,185,129,0.1)] border border-[#39FF14] rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-3">
            Prêt à optimiser votre gestion d'équipe?
          </h2>
          <p className="text-[#9CA3AF] mb-6">
            Accédez aux outils complets de ProSéance pour entraîneurs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/session"
              className="px-8 py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-all"
            >
              Générer une Séance
            </a>
            <a
              href="/video"
              className="px-8 py-3 border-2 border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-all"
            >
              Analyser une Vidéo
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CoachDashboardPage() {
  return (
    <AccessGate>
      <CoachDashboardContent />
    </AccessGate>
  );
}
