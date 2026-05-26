'use client';

import { useState } from 'react';
import { LeadModal } from './LeadModal';

export function MiniGeneratorDemo() {
  const [theme, setTheme] = useState('possession');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const generateDemo = async () => {
    setLoading(true);
    setGenerated(false);
    // Simule 2 secondes de génération
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setGenerated(true);
  };

  const THEMES = ['possession', 'pressing', 'transitions', 'controle', 'vitesse'];

  return (
    <div className="relative max-w-2xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-xl md:text-2xl font-black text-[#F3F4F6] mb-2 md:mb-3">Essaie ProSéance</h3>
        <p className="text-xs md:text-base text-[#9CA3AF]">Génère une séance d'entraînement en 3 secondes</p>
      </div>

      {/* Demo Container */}
      <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-8 space-y-4 md:space-y-6 animate-fade-in-up">
        {/* Input */}
        {!generated && (
          <div className="space-y-3 md:space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-[#F3F4F6] font-bold mb-2 md:mb-3 uppercase text-xs md:text-sm">
                Thème de Séance
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-3 md:px-4 py-2 md:py-3 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all"
              >
                {THEMES.map((t) => (
                  <option key={t} value={t} className="bg-[#0A0F0D]">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generateDemo}
              disabled={loading}
              className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-2 md:py-4 px-3 md:px-4 rounded-lg hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] disabled:opacity-50 transition-all uppercase group animate-pop text-xs md:text-base"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="inline-block w-3 md:w-4 h-3 md:h-4 border-2 border-[#0A0F0D] border-t-transparent rounded-full animate-spin" />
                  Génération...
                </span>
              ) : (
                '⚡ Générer Séance Démo'
              )}
            </button>
          </div>
        )}

        {/* Loading State with Shimmer */}
        {loading && (
          <div className="space-y-3 md:space-y-4 animate-fade-in-up">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded bg-gradient-to-r from-[#0A0F0D] via-[#1A3A28] to-[#0A0F0D] bg-[length:1000px_100%] animate-shimmer"
              />
            ))}
          </div>
        )}

        {/* Generated Content */}
        {generated && (
          <div className="space-y-3 md:space-y-4 animate-fade-in-up">
            {/* Échauffement */}
            <div className="bg-[#0A0F0D] border border-[#39FF14] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#39FF14] font-bold text-xs md:text-sm uppercase">⚡ Échauffement</h4>
                <span className="text-[#9CA3AF] text-xs">15min</span>
              </div>
              <p className="text-[#9CA3AF] text-xs md:text-sm line-clamp-2">
                Possession en carré 4v4 avec contrainte tactique selon l'école {theme}
              </p>
            </div>

            {/* Jeu Principal */}
            <div className="bg-[#0A0F0D] border border-[#10B981] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#10B981] font-bold text-xs md:text-sm uppercase">🎮 Jeu Principal</h4>
                <span className="text-[#9CA3AF] text-xs">25min</span>
              </div>
              <p className="text-[#9CA3AF] text-xs md:text-sm line-clamp-2">
                Situation de match 8v8 + 2 jokers avec focus sur transitions rapides
              </p>
            </div>

            {/* Situation */}
            <div className="bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#F3F4F6] font-bold text-xs md:text-sm uppercase">🏟️ Situation</h4>
                <span className="text-[#9CA3AF] text-xs">20min</span>
              </div>
              <p className="text-[#9CA3AF] text-xs md:text-sm line-clamp-2">
                3 équipes de 4 en possession progressive avec cibles défensives
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setGenerated(false)}
              className="w-full mt-2 md:mt-4 border-2 border-[#39FF14] text-[#39FF14] font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-xs md:text-sm"
            >
              ← Générer une autre séance
            </button>
          </div>
        )}
      </div>

      {/* Paywall Blur Effect - Hook d'inscription */}
      <div className="absolute inset-0 bottom-0 h-20 md:h-32 bg-gradient-to-t from-[#0A0F0D] via-transparent to-transparent rounded-2xl pointer-events-none" />

      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-0 right-4 md:right-0 text-center pointer-events-auto z-10">
        <p className="text-[#9CA3AF] text-xs md:text-sm mb-2 md:mb-3 whitespace-nowrap">
          ⭐ Accès complet + 50+ séances IA
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative px-4 md:px-8 py-2 md:py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] animate-pop text-xs md:text-sm whitespace-nowrap"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
          <span className="relative z-10">Débloquer la séance (Gratuit)</span>
        </button>
      </div>

      {/* Lead Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
