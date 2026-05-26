'use client';

import { useState, useEffect } from 'react';

interface Fixture {
  id: number | string;
  date: string;
  homeTeam: {
    id?: number;
    name: string;
    logo?: string;
  };
  awayTeam: {
    id?: number;
    name: string;
    logo?: string;
  };
  league?: string;
  division?: string;
  status: string;
  score?: {
    home: number;
    away: number;
  };
}

type LeagueType = 'pro' | 'amateur';

export function FootballFixturesBoard() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leagueType, setLeagueType] = useState<LeagueType>('pro');
  const [division, setDivision] = useState('FR');
  const [amateur, setAmateur] = useState('D1');

  const fetchFixtures = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint =
        leagueType === 'pro'
          ? `/api/football/fixtures?league=${division}`
          : `/api/football/amateur?division=${amateur}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setFixtures(data.data.fixtures);
      } else {
        setError(data.error || 'Failed to fetch fixtures');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, [leagueType, division, amateur]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-[#0A0F0D] rounded-2xl border border-[#39FF14]/20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-black text-[#F3F4F6] mb-4">⚽ Calendrier Matchs</h2>

        {/* League Selector */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-bold text-[#A0AEA8] mb-2 uppercase">
              Catégorie
            </label>
            <select
              value={leagueType}
              onChange={(e) => setLeagueType(e.target.value as LeagueType)}
              className="px-4 py-2 bg-[#141E1A] border border-[#39FF14]/30 rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
            >
              <option value="pro">Professionnel</option>
              <option value="amateur">Amateur</option>
            </select>
          </div>

          {leagueType === 'pro' ? (
            <div>
              <label className="block text-sm font-bold text-[#A0AEA8] mb-2 uppercase">
                Ligue
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="px-4 py-2 bg-[#141E1A] border border-[#39FF14]/30 rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="FR">Ligue 1 (FR)</option>
                <option value="1">Ligue 2</option>
                <option value="National">National</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-[#A0AEA8] mb-2 uppercase">
                Division
              </label>
              <select
                value={amateur}
                onChange={(e) => setAmateur(e.target.value)}
                className="px-4 py-2 bg-[#141E1A] border border-[#39FF14]/30 rounded-lg text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
              >
                <option value="D1">Division 1</option>
                <option value="D2">Division 2</option>
                <option value="D3">Division 3</option>
                <option value="D4">Division 4</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-[#A0AEA8]">Chargement des matchs...</span>
        </div>
      )}

      {/* Fixtures List */}
      {!loading && fixtures.length > 0 && (
        <div className="space-y-3">
          {fixtures.map((fixture) => (
            <div
              key={fixture.id}
              className="p-4 bg-[#141E1A] border border-[#39FF14]/20 rounded-lg hover:border-[#39FF14]/50 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Date */}
                <div className="min-w-[140px]">
                  <p className="text-xs text-[#A0AEA8] uppercase font-bold">
                    {formatDate(fixture.date)}
                  </p>
                </div>

                {/* Match Details */}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    {/* Home Team */}
                    <div className="flex-1 text-right">
                      <p className="text-sm font-bold text-[#F3F4F6]">
                        {fixture.homeTeam.name}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="w-16">
                      {fixture.score ? (
                        <p className="text-lg font-black text-[#39FF14] text-center">
                          {fixture.score.home} - {fixture.score.away}
                        </p>
                      ) : (
                        <p className="text-sm text-[#A0AEA8] text-center">vs</p>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-[#F3F4F6]">
                        {fixture.awayTeam.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="min-w-[90px]">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      fixture.status === 'finished' || fixture.score
                        ? 'bg-[#10B981]/20 text-[#10B981]'
                        : fixture.status === 'postponed'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-[#39FF14]/20 text-[#39FF14]'
                    }`}
                  >
                    {fixture.status === 'finished' || fixture.score
                      ? 'Joué'
                      : fixture.status === 'postponed'
                        ? 'Reporté'
                        : 'À venir'}
                  </span>
                </div>
              </div>

              {/* League Info */}
              <div className="mt-2 text-xs text-[#A0AEA8]">
                {fixture.league && <span>{fixture.league}</span>}
                {fixture.division && <span>{fixture.division}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && fixtures.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-[#A0AEA8]">Aucun match trouvé</p>
        </div>
      )}
    </div>
  );
}
