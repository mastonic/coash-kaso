'use client';

import { useState, useEffect } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';
import { PlanGate } from '@/components/PlanGate';

interface TeamPerformance {
  name: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

function RTDashboardContent() {
  const [selectedMetric, setSelectedMetric] = useState('general');
  const [mounted, setMounted] = useState(false);

  const metrics = [
    { id: 'general', label: 'Général', icon: '📊' },
    { id: 'technique', label: 'Technique', icon: '⚽' },
    { id: 'physique', label: 'Physique', icon: '💪' },
    { id: 'tactique', label: 'Tactique', icon: '🎯' },
  ];

  const teamStats: TeamPerformance = {
    name: 'AS Exemple',
    wins: 16,
    draws: 8,
    losses: 4,
    points: 56,
    goalsFor: 48,
    goalsAgainst: 22,
    goalDifference: 26,
  };

  const playerStats = [
    { name: 'Joueur 1', position: 'Attaquant', goals: 12, assists: 3, rating: 8.2 },
    { name: 'Joueur 2', position: 'Milieu', goals: 5, assists: 7, rating: 7.8 },
    { name: 'Joueur 3', position: 'Défenseur', goals: 2, assists: 1, rating: 7.5 },
    { name: 'Joueur 4', position: 'Gardien', goals: 0, assists: 0, rating: 7.9 },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="rt-dashboard" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-[#F3F4F6] mb-3">
            Dashboard Responsable Technique
          </h1>
          <p className="text-[#9CA3AF] text-lg">
            Analyse détaillée des performances et suivi technique de l'équipe
          </p>
        </div>

        {/* Metric Selection */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedMetric === metric.id
                  ? 'border-[#39FF14] bg-[rgba(57,255,20,0.15)]'
                  : 'border-[rgba(57,255,20,0.1)] hover:border-[rgba(57,255,20,0.3)]'
              }`}
            >
              <p className="text-3xl mb-2">{metric.icon}</p>
              <p className={`font-bold ${selectedMetric === metric.id ? 'text-[#39FF14]' : 'text-[#F3F4F6]'}`}>
                {metric.label}
              </p>
            </button>
          ))}
        </div>

        {/* Team Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Team Stats Card */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">📈 Statistiques Équipe</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[rgba(57,255,20,0.1)]">
                <p className="text-[#9CA3AF]">Équipe</p>
                <p className="text-[#F3F4F6] font-bold">{teamStats.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9CA3AF] text-xs mb-1">Victoires</p>
                  <p className="text-2xl font-bold text-[#39FF14]">{teamStats.wins}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-xs mb-1">Nuls</p>
                  <p className="text-2xl font-bold text-[#10B981]">{teamStats.draws}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-xs mb-1">Défaites</p>
                  <p className="text-2xl font-bold text-red-400">{teamStats.losses}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-xs mb-1">Points</p>
                  <p className="text-2xl font-bold text-[#39FF14]">{teamStats.points}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-[rgba(57,255,20,0.1)]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Buts marqués</p>
                    <p className="text-xl font-bold text-[#39FF14]">{teamStats.goalsFor}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF] text-xs mb-1">Buts encaissés</p>
                    <p className="text-xl font-bold text-red-400">{teamStats.goalsAgainst}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Indicators */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">🎯 Indicateurs Clés</h2>
            <div className="space-y-4">
              <div className="bg-[rgba(57,255,20,0.05)] p-4 rounded-lg border border-[#39FF14]">
                <p className="text-[#9CA3AF] text-sm mb-2">Différence de buts</p>
                <p className="text-3xl font-black text-[#39FF14]">+{teamStats.goalDifference}</p>
              </div>
              <div className="bg-[rgba(57,255,20,0.05)] p-4 rounded-lg border border-[#39FF14]">
                <p className="text-[#9CA3AF] text-sm mb-2">Ratio victoires/matchs</p>
                <p className="text-3xl font-black text-[#10B981]">
                  {((teamStats.wins / (teamStats.wins + teamStats.draws + teamStats.losses)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-[rgba(57,255,20,0.05)] p-4 rounded-lg border border-[#39FF14]">
                <p className="text-[#9CA3AF] text-sm mb-2">Moyenne buts par match</p>
                <p className="text-3xl font-black text-[#39FF14]">
                  {(teamStats.goalsFor / (teamStats.wins + teamStats.draws + teamStats.losses)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Player Performance */}
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-6">⭐ Performance des Joueurs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(57,255,20,0.1)]">
                  <th className="text-left py-3 px-4 text-[#9CA3AF] font-semibold">Joueur</th>
                  <th className="text-left py-3 px-4 text-[#9CA3AF] font-semibold">Poste</th>
                  <th className="text-center py-3 px-4 text-[#9CA3AF] font-semibold">⚽ Buts</th>
                  <th className="text-center py-3 px-4 text-[#9CA3AF] font-semibold">🎯 Passes</th>
                  <th className="text-center py-3 px-4 text-[#9CA3AF] font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((player, idx) => (
                  <tr key={idx} className="border-b border-[rgba(57,255,20,0.1)] hover:bg-[rgba(57,255,20,0.05)]">
                    <td className="py-3 px-4 text-[#F3F4F6] font-semibold">{player.name}</td>
                    <td className="py-3 px-4 text-[#9CA3AF]">{player.position}</td>
                    <td className="py-3 px-4 text-center text-[#39FF14] font-bold">{player.goals}</td>
                    <td className="py-3 px-4 text-center text-[#10B981] font-bold">{player.assists}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-[rgba(57,255,20,0.1)] text-[#39FF14] px-3 py-1 rounded-full font-bold">
                        {player.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="bg-gradient-to-r from-[rgba(57,255,20,0.1)] to-[rgba(16,185,129,0.1)] border border-[#39FF14] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">💡 Recommandations</h2>
          <ul className="space-y-3 text-[#9CA3AF]">
            <li className="flex gap-3">
              <span className="text-[#39FF14] flex-shrink-0">✓</span>
              <span>Améliorer la défense avec un focus sur les marquages aériens</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#39FF14] flex-shrink-0">✓</span>
              <span>Optimiser les transitions offensives au milieu de terrain</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#39FF14] flex-shrink-0">✓</span>
              <span>Travailler la finition en première mi-temps</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#39FF14] flex-shrink-0">✓</span>
              <span>Renforcer la possession de balle en zone médiane</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function RTDashboardPage() {
  return (
    <AccessGate>
      <PlanGate module="rt_dashboard">
        <RTDashboardContent />
      </PlanGate>
    </AccessGate>
  );
}
