'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';

interface StandingEntry {
  rank: number;
  team: { name: string; logo: string };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDiff: number;
}

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
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsAmateur, setStandingsAmateur] = useState(false);

  const leagues = [
    { id: 'ligue1', name: 'Ligue 1', level: 1, teams: 20 },
    { id: 'ligue2', name: 'Ligue 2', level: 2, teams: 20 },
    { id: 'national', name: 'National', level: 3, teams: 40 },
    { id: 'national2', name: 'National 2', level: 4, teams: 160 },
    { id: 'regional', name: 'Régional 1', level: 5, teams: 'Nombreux' },
  ];

  const fetchStandings = useCallback(async (leagueId: string) => {
    setStandingsLoading(true);
    setStandings([]);
    setStandingsAmateur(false);
    try {
      const res = await fetch(`/api/football/standings?league=${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStandings(data.data.standings || []);
          setStandingsAmateur(data.data.amateur === true);
        }
      }
    } catch (err) {
      console.error('Error loading standings:', err);
    } finally {
      setStandingsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const savedLeague = localStorage.getItem('mastro_league');
    const initialLeague = savedLeague || 'ligue1';
    setSelectedLeague(initialLeague);
    fetchStandings(initialLeague);

    const email = localStorage.getItem('mastro_user');
    if (!email) return;

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
  }, [fetchStandings]);

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId);
    localStorage.setItem('mastro_league', leagueId);
    fetchStandings(leagueId);
  };

  if (!mounted) return null;

  const selectedLeagueName = leagues.find(l => l.id === selectedLeague)?.name || selectedLeague;

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
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6 flex items-center gap-2">
              🏅 Sélectionner votre Ligue
            </h2>
            <div className="space-y-3">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league.id)}
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

            {/* Standings or amateur note */}
            <div className="mt-6">
              {standingsLoading && (
                <div className="p-4 bg-[rgba(57,255,20,0.05)] border border-[rgba(57,255,20,0.2)] rounded-lg text-center">
                  <p className="text-[#9CA3AF] text-sm animate-pulse">Chargement du classement…</p>
                </div>
              )}

              {!standingsLoading && standingsAmateur && (
                <div className="p-4 bg-[rgba(57,255,20,0.1)] border border-[#39FF14] rounded-lg">
                  <p className="text-xs text-[#9CA3AF] mb-2">📌 Ligue amateur :</p>
                  <a
                    href="https://www.fff.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm flex items-center gap-2"
                  >
                    Consulter le classement sur fff.fr →
                  </a>
                  <a
                    href="https://epreuves.fff.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm flex items-center gap-2 mt-2"
                  >
                    Voir les épreuves FFF →
                  </a>
                </div>
              )}

              {!standingsLoading && !standingsAmateur && standings.length > 0 && (
                <div>
                  <p className="text-xs text-[#9CA3AF] font-bold uppercase mb-2">
                    Classement — {selectedLeagueName}
                  </p>
                  <div className="rounded-xl overflow-hidden border border-[rgba(57,255,20,0.2)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[rgba(57,255,20,0.08)] text-[#9CA3AF]">
                          <th className="px-2 py-2 text-left w-7">#</th>
                          <th className="px-2 py-2 text-left">Équipe</th>
                          <th className="px-2 py-2 text-center">Mj</th>
                          <th className="px-2 py-2 text-center">V</th>
                          <th className="px-2 py-2 text-center">N</th>
                          <th className="px-2 py-2 text-center">D</th>
                          <th className="px-2 py-2 text-center font-bold text-[#39FF14]">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.slice(0, 10).map((row, i) => (
                          <tr
                            key={row.rank}
                            className={`border-t border-[rgba(57,255,20,0.1)] ${
                              i % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
                            }`}
                          >
                            <td className="px-2 py-2 text-[#9CA3AF] font-bold">{row.rank}</td>
                            <td className="px-2 py-2 text-[#F3F4F6] truncate max-w-[110px]">
                              <div className="flex items-center gap-1.5">
                                {row.team.logo && (
                                  <img
                                    src={row.team.logo}
                                    alt=""
                                    className="w-4 h-4 object-contain flex-shrink-0"
                                  />
                                )}
                                <span className="truncate">{row.team.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-[#9CA3AF]">{row.played}</td>
                            <td className="px-2 py-2 text-center text-[#10B981]">{row.won}</td>
                            <td className="px-2 py-2 text-center text-[#9CA3AF]">{row.drawn}</td>
                            <td className="px-2 py-2 text-center text-red-400">{row.lost}</td>
                            <td className="px-2 py-2 text-center font-black text-[#39FF14]">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {standings.length > 10 && (
                      <div className="px-3 py-2 text-center text-[#9CA3AF] text-xs bg-[rgba(57,255,20,0.03)]">
                        +{standings.length - 10} équipes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!standingsLoading && !standingsAmateur && standings.length === 0 && (
                <div className="p-4 bg-[rgba(57,255,20,0.1)] border border-[#39FF14] rounded-lg">
                  <p className="text-xs text-[#9CA3AF] mb-2">📌 Info FFF :</p>
                  <a
                    href="https://www.fff.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm flex items-center gap-2"
                  >
                    Consulter le site officiel FFF →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 md:p-8">
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
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-[rgba(57,255,20,0.05)] rounded-lg p-3 text-center border border-[rgba(57,255,20,0.1)]">
                    <p className="text-[#9CA3AF] text-xs mb-1">Victoires</p>
                    <p className="text-xl font-black text-[#10B981]">{teamInfo.wins}</p>
                  </div>
                  <div className="bg-[rgba(57,255,20,0.05)] rounded-lg p-3 text-center border border-[rgba(57,255,20,0.1)]">
                    <p className="text-[#9CA3AF] text-xs mb-1">Nuls</p>
                    <p className="text-xl font-black text-purple-400">{teamInfo.draws}</p>
                  </div>
                  <div className="bg-[rgba(57,255,20,0.05)] rounded-lg p-3 text-center border border-[rgba(57,255,20,0.1)]">
                    <p className="text-[#9CA3AF] text-xs mb-1">Défaites</p>
                    <p className="text-xl font-black text-red-400">{teamInfo.losses}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[rgba(57,255,20,0.1)]">
                  <p className="text-[#9CA3AF] text-xs mb-3">Prochain Match</p>
                  {teamInfo.nextMatch ? (
                    <div className="bg-[rgba(57,255,20,0.1)] p-3 rounded-lg border border-[#39FF14]">
                      <p className="font-bold text-[#F3F4F6]">
                        vs {teamInfo.nextMatch.opponent}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        📅 {new Date(teamInfo.nextMatch.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#9CA3AF] text-sm italic">Aucun match programmé</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">📈 Statistiques de saison</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🏆', label: 'Classement', value: `#${teamInfo?.position ?? '—'}`, color: 'text-yellow-400', detail: `${teamInfo?.position ?? '—'} sur 20 équipes` },
              { icon: '⚽', label: 'Matches joués', value: `${(teamInfo?.wins ?? 0) + (teamInfo?.draws ?? 0) + (teamInfo?.losses ?? 0)}`, color: 'text-green-400', detail: 'Total de la saison' },
              { icon: '✅', label: 'Victoires', value: `${teamInfo?.wins ?? '—'}`, color: 'text-blue-400', detail: 'Matchs gagnés' },
              { icon: '🤝', label: 'Nuls', value: `${teamInfo?.draws ?? '—'}`, color: 'text-purple-400', detail: 'Matchs nuls' },
              { icon: '❌', label: 'Défaites', value: `${teamInfo?.losses ?? '—'}`, color: 'text-red-400', detail: 'Matchs perdus' },
              { icon: '📊', label: 'Points', value: `${teamInfo?.points ?? '—'}`, color: 'text-[#39FF14]', detail: teamInfo ? `${(teamInfo.points / Math.max((teamInfo.wins + teamInfo.draws + teamInfo.losses), 1)).toFixed(1)} pts/match` : '' },
            ].map((stat, idx) => {
              const statKey = `stat-${idx}`;
              const isHovered = hoveredStat === statKey;
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
                      {stat.detail}
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
