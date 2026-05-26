'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';

interface AmateurTeam {
  rank: number;
  name: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  points?: number;
}

interface StandingEntry {
  rank: number;
  team: { name: string; logo: string };
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  form?: string;
  isAmateur?: boolean;
}

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
  photoUrl?: string;
}

interface NextMatch {
  opponent: string;
  date: string;
  competition?: string;
}

function rankBadgeStyle(rank: number, total: number) {
  if (rank <= 3) return 'border-yellow-400 bg-yellow-400/10 text-yellow-400';
  if (rank <= 6) return 'border-blue-400 bg-blue-400/10 text-blue-400';
  if (rank > total - 3) return 'border-red-400 bg-red-400/10 text-red-400';
  return 'border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.05)] text-[#F3F4F6]';
}

function FormDot({ result }: { result: string }) {
  const styles: Record<string, string> = {
    W: 'bg-[#10B981] text-white',
    D: 'bg-yellow-400 text-black',
    L: 'bg-red-500 text-white',
  };
  const labels: Record<string, string> = { W: 'V', D: 'N', L: 'D' };
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${styles[result] ?? 'bg-[#374151] text-[#9CA3AF]'}`}>
      {labels[result] ?? result}
    </div>
  );
}

function CoachDashboardContent() {
  const [selectedLeague, setSelectedLeague] = useState('ligue1');
  const [selectedTeam, setSelectedTeam] = useState<StandingEntry | null>(null);
  const [nextMatch, setNextMatch] = useState<NextMatch | undefined>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mounted, setMounted] = useState(false);
  // Pro standings
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsAmateur, setStandingsAmateur] = useState(false);
  // Amateur: Gemini search
  const [cityInput, setCityInput] = useState('');
  const [amateurTeams, setAmateurTeams] = useState<AmateurTeam[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchDone, setSearchDone] = useState(false);

  const regionInputRef = useRef<HTMLInputElement>(null);

  const leagues = [
    { id: 'ligue1',    name: 'Ligue 1',    level: 1, teams: '20' },
    { id: 'ligue2',    name: 'Ligue 2',    level: 2, teams: '20' },
    { id: 'national',  name: 'National',   level: 3, teams: '18' },
    { id: 'national2', name: 'National 2', level: 4, teams: '64' },
    { id: 'regional',  name: 'Régional 1', level: 5, teams: 'Var.' },
    { id: 'regional2', name: 'Régional 2', level: 6, teams: 'Var.' },
    { id: 'regional3', name: 'Régional 3', level: 7, teams: 'Var.' },
    { id: 'district1', name: 'District 1', level: 8, teams: 'Var.' },
    { id: 'district2', name: 'District 2', level: 9, teams: 'Var.' },
  ];

  const loadAmateurCache = useCallback((leagueId: string) => {
    try {
      const cached = localStorage.getItem(`mastro_amateur_${leagueId}`);
      if (cached) {
        const { teams, city } = JSON.parse(cached);
        setAmateurTeams(teams || []);
        setCityInput(city || '');
        setSearchDone(true);
      } else {
        setAmateurTeams([]);
        setCityInput('');
        setSearchDone(false);
      }
      setSearchError('');
    } catch {
      setAmateurTeams([]);
    }
  }, []);

  const fetchStandings = useCallback(async (leagueId: string) => {
    setStandingsLoading(true);
    setStandings([]);
    setStandingsAmateur(false);
    setSelectedTeam(null);
    setSearchDone(false);
    try {
      const res = await fetch(`/api/football/standings?league=${leagueId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStandings(data.data.standings || []);
          const isAmateur = data.data.amateur === true;
          setStandingsAmateur(isAmateur);
          if (isAmateur) loadAmateurCache(leagueId);
        }
      }
    } catch (err) {
      console.error('Error loading standings:', err);
    } finally {
      setStandingsLoading(false);
    }
  }, [loadAmateurCache]);

  useEffect(() => {
    setMounted(true);
    const savedLeague = localStorage.getItem('mastro_league') || 'ligue1';
    setSelectedLeague(savedLeague);
    fetchStandings(savedLeague);

    const savedTeam = localStorage.getItem('mastro_selected_team');
    if (savedTeam) {
      try { setSelectedTeam(JSON.parse(savedTeam)); } catch { /* ignore */ }
    }

    const email = localStorage.getItem('mastro_user');
    if (!email) return;

    fetch(`/api/team?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPlayers(d.players || []); })
      .catch(() => {});

    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/schedule/matches?email=${encodeURIComponent(email)}&from=${today}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const m = d?.matches?.[0];
        if (m) setNextMatch({ opponent: m.opponent, date: m.date, competition: m.competition });
      })
      .catch(() => {});
  }, [fetchStandings]);

  const handleLeagueSelect = (leagueId: string) => {
    setSelectedLeague(leagueId);
    localStorage.setItem('mastro_league', leagueId);
    fetchStandings(leagueId);
  };

  const handleTeamSelect = (team: StandingEntry) => {
    setSelectedTeam(team);
    localStorage.setItem('mastro_selected_team', JSON.stringify(team));
  };

  const searchAmateurLeague = async () => {
    const city = cityInput.trim();
    if (!city) {
      regionInputRef.current?.focus();
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setAmateurTeams([]);
    setSearchDone(false);
    try {
      const res = await fetch(
        `/api/football/amateur-search?league=${selectedLeague}&city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      if (!data.success) {
        setSearchError(data.error || 'Classement introuvable');
        return;
      }
      const teams: AmateurTeam[] = data.data.teams || [];
      setAmateurTeams(teams);
      setSearchDone(true);
      localStorage.setItem(`mastro_amateur_${selectedLeague}`, JSON.stringify({ teams, city }));
    } catch {
      setSearchError('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setSearchLoading(false);
    }
  };

  const selectAmateurTeam = (team: AmateurTeam) => {
    const entry: StandingEntry = {
      rank: team.rank,
      team: { name: team.name, logo: '' },
      points: team.points ?? 0,
      played: team.played ?? 0,
      won: team.won ?? 0,
      drawn: team.drawn ?? 0,
      lost: team.lost ?? 0,
      goalsFor: team.goalsFor ?? 0,
      goalsAgainst: team.goalsAgainst ?? 0,
      goalDiff: (team.goalsFor ?? 0) - (team.goalsAgainst ?? 0),
      isAmateur: true,
    };
    handleTeamSelect(entry);
  };

  if (!mounted) return null;

  const selectedLeagueName = leagues.find(l => l.id === selectedLeague)?.name || selectedLeague;
  const totalTeams = standings.length || amateurTeams.length || 20;

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="coach-dashboard" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-[#F3F4F6] mb-2">
            Tableau de Bord Entraîneur
          </h1>
          <p className="text-[#9CA3AF] text-base md:text-lg">
            Gestion de votre équipe et suivi de saison en temps réel
          </p>
        </div>

        {/* League Selection + Team Box */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10">

          {/* ── LEFT: League Selector ── */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-5 md:p-8 flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-bold text-[#F3F4F6]">🏅 Votre Ligue</h2>

            {/* League list */}
            <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedLeague === league.id
                      ? 'border-[#39FF14] bg-[rgba(57,255,20,0.15)]'
                      : 'border-[rgba(57,255,20,0.1)] hover:border-[rgba(57,255,20,0.3)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#F3F4F6] text-sm">{league.name}</p>
                      <p className="text-xs text-[#9CA3AF]">Niv. {league.level} · {league.teams} équipes</p>
                    </div>
                    {selectedLeague === league.id && (
                      <span className="text-[#39FF14] font-black text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* ── PRO: live standings table ── */}
            {standingsLoading && (
              <div className="p-4 rounded-lg border border-[rgba(57,255,20,0.2)] text-center">
                <p className="text-[#9CA3AF] text-sm animate-pulse">Chargement…</p>
              </div>
            )}

            {!standingsLoading && !standingsAmateur && standings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wide">
                    Classement · {selectedLeagueName}
                  </p>
                  <p className="text-xs text-[#39FF14]">Cliquer pour sélectionner</p>
                </div>
                <div className="rounded-xl overflow-hidden border border-[rgba(57,255,20,0.2)] overflow-y-auto max-h-72">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#141E1A] border-b border-[rgba(57,255,20,0.2)]">
                      <tr className="text-[#9CA3AF]">
                        <th className="px-2 py-2 text-left w-6">#</th>
                        <th className="px-2 py-2 text-left">Équipe</th>
                        <th className="px-2 py-2 text-center">Mj</th>
                        <th className="px-2 py-2 text-center text-[#10B981]">V</th>
                        <th className="px-2 py-2 text-center">N</th>
                        <th className="px-2 py-2 text-center text-red-400">D</th>
                        <th className="px-2 py-2 text-center font-bold text-[#39FF14]">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row) => {
                        const isSelected =
                          selectedTeam?.rank === row.rank &&
                          selectedTeam?.team.name === row.team.name;
                        return (
                          <tr
                            key={row.rank}
                            onClick={() => handleTeamSelect(row)}
                            className={`border-t border-[rgba(57,255,20,0.1)] cursor-pointer transition-colors ${
                              isSelected ? 'bg-[rgba(57,255,20,0.18)]' : 'hover:bg-[rgba(57,255,20,0.07)]'
                            }`}
                          >
                            <td className={`px-2 py-2 font-bold ${
                              row.rank <= 3 ? 'text-yellow-400' :
                              row.rank <= 6 ? 'text-blue-400' :
                              row.rank > totalTeams - 3 ? 'text-red-400' : 'text-[#9CA3AF]'
                            }`}>{row.rank}</td>
                            <td className="px-2 py-2 text-[#F3F4F6]">
                              <div className="flex items-center gap-1.5">
                                {row.team.logo && (
                                  <img src={row.team.logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                                )}
                                <span className="truncate max-w-[90px]">{row.team.name}</span>
                                {isSelected && <span className="text-[#39FF14] text-xs">●</span>}
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center text-[#9CA3AF]">{row.played}</td>
                            <td className="px-2 py-2 text-center text-[#10B981] font-semibold">{row.won}</td>
                            <td className="px-2 py-2 text-center text-[#9CA3AF]">{row.drawn}</td>
                            <td className="px-2 py-2 text-center text-red-400">{row.lost}</td>
                            <td className="px-2 py-2 text-center font-black text-[#39FF14]">{row.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── AMATEUR: Gemini Search ── */}
            {!standingsLoading && standingsAmateur && (
              <div className="flex flex-col gap-4">
                {/* Search form */}
                <div className="bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.2)] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="text-sm font-bold text-[#F3F4F6]">Recherche automatique</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Entrez votre ville — Gemini cherche le classement sur internet
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={regionInputRef}
                      type="text"
                      value={cityInput}
                      onChange={e => setCityInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !searchLoading && searchAmateurLeague()}
                      placeholder="Votre ville (ex: Bordeaux, Lyon…)"
                      className="flex-1 min-w-0 bg-[#0A0F0D] border border-[rgba(57,255,20,0.3)] rounded-lg px-3 py-2.5 text-sm text-[#F3F4F6] placeholder-[#4B5563] focus:outline-none focus:border-[#39FF14] transition-colors"
                    />
                    <button
                      onClick={searchAmateurLeague}
                      disabled={!cityInput.trim() || searchLoading}
                      className="px-4 py-2.5 bg-[#39FF14] text-[#0A0F0D] font-black text-sm rounded-lg hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0 flex items-center gap-1.5"
                    >
                      {searchLoading ? (
                        <>
                          <span className="animate-spin text-sm">⟳</span>
                          <span>IA…</span>
                        </>
                      ) : (
                        <>🔍 Rechercher</>
                      )}
                    </button>
                  </div>
                  {searchLoading && (
                    <p className="text-xs text-[#9CA3AF] animate-pulse">
                      Gemini recherche le classement {selectedLeagueName} près de {cityInput}…
                    </p>
                  )}
                  {searchError && (
                    <p className="text-xs text-red-400">{searchError}</p>
                  )}
                </div>

                {/* Results */}
                {searchDone && amateurTeams.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wide">
                        {selectedLeagueName} · {cityInput}
                      </p>
                      <button
                        onClick={() => {
                          setSearchDone(false);
                          setAmateurTeams([]);
                          localStorage.removeItem(`mastro_amateur_${selectedLeague}`);
                          setSelectedTeam(null);
                          localStorage.removeItem('mastro_selected_team');
                        }}
                        className="text-xs text-[#4B5563] hover:text-red-400 transition-colors"
                      >
                        Réinitialiser
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-[rgba(57,255,20,0.2)] overflow-y-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#141E1A] border-b border-[rgba(57,255,20,0.2)]">
                          <tr className="text-[#9CA3AF]">
                            <th className="px-2 py-2 text-left w-6">#</th>
                            <th className="px-2 py-2 text-left">Équipe</th>
                            {amateurTeams[0]?.won !== undefined && (
                              <>
                                <th className="px-2 py-2 text-center text-[#10B981]">V</th>
                                <th className="px-2 py-2 text-center">N</th>
                                <th className="px-2 py-2 text-center text-red-400">D</th>
                              </>
                            )}
                            <th className="px-2 py-2 text-center font-bold text-[#39FF14]">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amateurTeams.map((team) => {
                            const isSelected =
                              selectedTeam?.isAmateur &&
                              selectedTeam.team.name === team.name;
                            return (
                              <tr
                                key={team.rank}
                                onClick={() => selectAmateurTeam(team)}
                                className={`border-t border-[rgba(57,255,20,0.1)] cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[rgba(57,255,20,0.18)]' : 'hover:bg-[rgba(57,255,20,0.07)]'
                                }`}
                              >
                                <td className={`px-2 py-2 font-bold ${
                                  team.rank <= 3 ? 'text-yellow-400' :
                                  team.rank > (amateurTeams.length - 3) ? 'text-red-400' : 'text-[#9CA3AF]'
                                }`}>{team.rank}</td>
                                <td className="px-2 py-2 text-[#F3F4F6]">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="truncate max-w-[100px]">{team.name}</span>
                                    {isSelected && <span className="text-[#39FF14] text-xs flex-shrink-0">●</span>}
                                  </div>
                                </td>
                                {team.won !== undefined && (
                                  <>
                                    <td className="px-2 py-2 text-center text-[#10B981] font-semibold">{team.won}</td>
                                    <td className="px-2 py-2 text-center text-[#9CA3AF]">{team.drawn}</td>
                                    <td className="px-2 py-2 text-center text-red-400">{team.lost}</td>
                                  </>
                                )}
                                <td className="px-2 py-2 text-center font-black text-[#39FF14]">{team.points ?? '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No data for pro */}
            {!standingsLoading && !standingsAmateur && standings.length === 0 && (
              <div className="p-4 bg-[rgba(57,255,20,0.04)] border border-[rgba(57,255,20,0.1)] rounded-xl">
                <p className="text-xs text-[#9CA3AF]">
                  Aucune donnée. Vérifiez <code>API_FOOTBALL_KEY</code> dans Vercel.
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Team Stats Box ── */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-5 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#F3F4F6] mb-5">📊 Votre Équipe</h2>

            {selectedTeam ? (
              <div className="space-y-4 animate-fade-in">
                {/* Identity */}
                <div className="flex items-center gap-3 pb-4 border-b border-[rgba(57,255,20,0.1)]">
                  {selectedTeam.team.logo ? (
                    <img src={selectedTeam.team.logo} alt="" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] font-black text-xl">
                      {selectedTeam.team.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-0.5">{selectedLeagueName}</p>
                    <p className="text-lg md:text-xl font-black text-[#F3F4F6] leading-tight">
                      {selectedTeam.team.name}
                    </p>
                  </div>
                </div>

                {/* Position + Points + Joués */}
                <div className="flex gap-2 flex-wrap">
                  <div className={`px-3 py-2 rounded-xl border-2 text-center min-w-[72px] ${rankBadgeStyle(selectedTeam.rank, totalTeams)}`}>
                    <p className="text-xs opacity-60 mb-0.5">Position</p>
                    <p className="text-2xl font-black leading-none">#{selectedTeam.rank}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl border-2 border-[#39FF14] bg-[rgba(57,255,20,0.1)] text-center min-w-[72px]">
                    <p className="text-xs text-[#9CA3AF] mb-0.5">Points</p>
                    <p className="text-2xl font-black text-[#39FF14] leading-none">{selectedTeam.points}</p>
                  </div>
                  {selectedTeam.played > 0 && (
                    <div className="px-3 py-2 rounded-xl border-2 border-[rgba(57,255,20,0.2)] text-center min-w-[72px]">
                      <p className="text-xs text-[#9CA3AF] mb-0.5">Joués</p>
                      <p className="text-2xl font-black text-[#F3F4F6] leading-none">{selectedTeam.played}</p>
                    </div>
                  )}
                </div>

                {/* V / D / N chips */}
                {selectedTeam.played > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[rgba(16,185,129,0.1)] border border-[#10B981] rounded-xl p-3 text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">✅ Victoires</p>
                        <p className="text-2xl font-black text-[#10B981]">{selectedTeam.won}</p>
                      </div>
                      <div className="bg-[rgba(167,139,250,0.1)] border border-purple-400 rounded-xl p-3 text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">🤝 Nuls</p>
                        <p className="text-2xl font-black text-purple-400">{selectedTeam.drawn}</p>
                      </div>
                      <div className="bg-[rgba(239,68,68,0.1)] border border-red-400 rounded-xl p-3 text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">❌ Défaites</p>
                        <p className="text-2xl font-black text-red-400">{selectedTeam.lost}</p>
                      </div>
                    </div>

                    {(selectedTeam.goalsFor > 0 || selectedTeam.goalsAgainst > 0) && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[rgba(57,255,20,0.04)] border border-[rgba(57,255,20,0.15)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[#9CA3AF] mb-1">⚽ Pour</p>
                          <p className="text-xl font-black text-[#10B981]">{selectedTeam.goalsFor}</p>
                        </div>
                        <div className="bg-[rgba(57,255,20,0.04)] border border-[rgba(57,255,20,0.15)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[#9CA3AF] mb-1">🥅 Contre</p>
                          <p className="text-xl font-black text-red-400">{selectedTeam.goalsAgainst}</p>
                        </div>
                        <div className="bg-[rgba(57,255,20,0.04)] border border-[rgba(57,255,20,0.15)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[#9CA3AF] mb-1">📊 Diff.</p>
                          <p className={`text-xl font-black ${
                            selectedTeam.goalDiff > 0 ? 'text-[#10B981]' :
                            selectedTeam.goalDiff < 0 ? 'text-red-400' : 'text-[#9CA3AF]'
                          }`}>
                            {selectedTeam.goalDiff > 0 ? '+' : ''}{selectedTeam.goalDiff}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Form strip (pro only) */}
                {selectedTeam.form && (
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-2 uppercase font-bold tracking-wide">Forme récente</p>
                    <div className="flex gap-1.5">
                      {selectedTeam.form.split('').slice(-5).map((r, i) => (
                        <FormDot key={i} result={r} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Next match */}
                {nextMatch && (
                  <div className="pt-3 border-t border-[rgba(57,255,20,0.1)]">
                    <p className="text-xs text-[#9CA3AF] mb-2 uppercase font-bold tracking-wide">Prochain Match</p>
                    <div className="bg-[rgba(57,255,20,0.1)] p-3 rounded-xl border border-[#39FF14]">
                      <p className="font-bold text-[#F3F4F6]">vs {nextMatch.opponent}</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        📅 {new Date(nextMatch.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setSelectedTeam(null); localStorage.removeItem('mastro_selected_team'); }}
                  className="text-xs text-[#4B5563] hover:text-red-400 transition-colors"
                >
                  × Réinitialiser la sélection
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[240px] text-center gap-4">
                <div className="text-5xl opacity-20">👆</div>
                <p className="text-[#9CA3AF] text-sm max-w-[240px]">
                  {standingsAmateur
                    ? 'Recherchez votre ligue et cliquez sur votre équipe'
                    : 'Cliquez une équipe dans le classement pour voir ses statistiques'
                  }
                </p>
                {nextMatch && (
                  <div className="w-full pt-4 border-t border-[rgba(57,255,20,0.1)]">
                    <p className="text-xs text-[#9CA3AF] mb-2 uppercase font-bold tracking-wide">Prochain Match</p>
                    <div className="bg-[rgba(57,255,20,0.1)] p-3 rounded-xl border border-[#39FF14]">
                      <p className="font-bold text-[#F3F4F6]">vs {nextMatch.opponent}</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        📅 {new Date(nextMatch.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Players */}
        {players.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-[#F3F4F6]">👥 Effectif ({players.length})</h2>
              <a href="/team" className="text-[#39FF14] hover:text-[#10B981] font-semibold text-sm">Gérer →</a>
            </div>
            <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(57,255,20,0.2)] bg-[rgba(57,255,20,0.05)]">
                    <th className="px-4 md:px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">#</th>
                    <th className="px-4 md:px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">Joueur</th>
                    <th className="px-4 md:px-6 py-3 text-left text-[#9CA3AF] text-sm font-semibold">Poste</th>
                  </tr>
                </thead>
                <tbody>
                  {players.slice(0, 10).map((player) => (
                    <tr key={player.id} className="border-b border-[rgba(57,255,20,0.1)] hover:bg-[rgba(57,255,20,0.05)] transition-colors">
                      <td className="px-4 md:px-6 py-4 text-[#39FF14] font-bold">{player.number || '-'}</td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-3">
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] font-bold text-xs">
                              {player.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[#F3F4F6] font-semibold">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-[#9CA3AF] text-sm">{player.position}</td>
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

        {/* Features */}
        <div className="bg-[#141E1A] border border-[#39FF14] rounded-2xl p-6 md:p-8 mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-[#F3F4F6] mb-6">⚡ Fonctionnalités ProSéance</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: '🎬', title: 'Analyse Vidéo', desc: "Analysez vos matchs automatiquement avec l'IA" },
              { icon: '⚡', title: 'Génération Séances', desc: 'Créez des entraînements en 3 secondes' },
              { icon: '📊', title: 'Suivi Joueurs', desc: 'Suivez la performance de chaque joueur' },
              { icon: '📅', title: 'Programmation', desc: 'Programmez votre saison automatiquement' },
            ].map(f => (
              <div key={f.title} className="flex gap-4">
                <div className="text-3xl flex-shrink-0">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-[#39FF14] mb-1">{f.title}</h3>
                  <p className="text-[#9CA3AF] text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-[rgba(57,255,20,0.1)] to-[rgba(16,185,129,0.1)] border border-[#39FF14] rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#F3F4F6] mb-3">
            Prêt à optimiser votre gestion d'équipe?
          </h2>
          <p className="text-[#9CA3AF] mb-6">Accédez aux outils complets de ProSéance pour entraîneurs</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/session" className="px-8 py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-all">
              Générer une Séance
            </a>
            <a href="/video" className="px-8 py-3 border-2 border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-all">
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
