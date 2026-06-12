'use client';

import { useState } from 'react';
import { LeadModal } from './LeadModal';
import { SchemaExercice } from '@/components/seance/SchemaExercice';
import { buildSeance } from '@/lib/seance/library';
import { PROCEDE_LABELS, THEMES, type Seance, type ThemeId } from '@/lib/seance/schema';

/**
 * Démo réelle du générateur : construit une vraie séance (bibliothèque
 * intégrée, côté client) et affiche le plan illustré de la phase principale.
 */
export function MiniGeneratorDemo() {
  const [theme, setTheme] = useState<ThemeId>('possession');
  const [loading, setLoading] = useState(false);
  const [seance, setSeance] = useState<Seance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const generateDemo = async () => {
    setLoading(true);
    setSeance(null);
    // Petit délai pour le feedback visuel
    await new Promise((r) => setTimeout(r, 1200));
    setSeance(
      buildSeance({
        theme,
        categorie: 'U14-U15',
        effectif: 14,
        duree: 90,
        charge: 'Modérée',
      })
    );
    setLoading(false);
  };

  const phasePrincipale = seance?.phases[1];

  return (
    <div className="relative max-w-2xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8 animate-fade-in-up">
        <h3 className="text-xl md:text-2xl font-black text-[#F3F4F6] mb-2 md:mb-3">Essaie ProSéance</h3>
        <p className="text-xs md:text-base text-[#9CA3AF]">
          Une vraie séance méthodologie FFF, avec le plan de chaque exercice
        </p>
      </div>

      {/* Demo Container */}
      <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-4 md:p-8 space-y-4 md:space-y-6 animate-fade-in-up">
        {/* Input */}
        {!seance && (
          <div className="space-y-3 md:space-y-4 animate-fade-in-up">
            <div>
              <label htmlFor="demo-theme" className="block text-[#F3F4F6] font-bold mb-2 md:mb-3 uppercase text-xs md:text-sm">
                Thème de séance
              </label>
              <select
                id="demo-theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeId)}
                className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-3 md:px-4 py-2 md:py-3 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all"
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#0A0F0D]">
                    {t.label}
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
                '⚡ Générer une séance démo'
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

        {/* Generated Content : vraie séance */}
        {seance && phasePrincipale && (
          <div className="space-y-3 md:space-y-4 animate-fade-in-up">
            {/* Chronologie des 4 phases */}
            <div className="flex flex-wrap gap-1.5">
              {seance.phases.map((ph, i) => (
                <span
                  key={i}
                  className="rounded-full border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.08)] px-2.5 py-1 text-[10px] font-bold text-[#39FF14]"
                >
                  {PROCEDE_LABELS[ph.procede]} · {ph.duree}′
                </span>
              ))}
            </div>

            {/* Phase principale avec son plan */}
            <div className="bg-[#0A0F0D] border border-[#39FF14] rounded-lg p-3 md:p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <h4 className="text-[#39FF14] font-bold text-xs md:text-sm uppercase">
                  {phasePrincipale.titre}
                </h4>
                <span className="text-[#9CA3AF] text-xs whitespace-nowrap">⏱ {phasePrincipale.duree} min</span>
              </div>
              <SchemaExercice schema={phasePrincipale.schema} />
              <p className="mt-3 text-[#9CA3AF] text-xs md:text-sm">
                <span className="font-bold text-[#F3F4F6]">But : </span>
                {phasePrincipale.but}
              </p>
            </div>

            <button
              onClick={() => setSeance(null)}
              className="w-full mt-2 md:mt-4 border-2 border-[#39FF14] text-[#39FF14] font-bold py-2 md:py-3 px-3 md:px-4 rounded-lg hover:bg-[rgba(57,255,20,0.1)] transition-all uppercase text-xs md:text-sm"
            >
              ← Générer une autre séance
            </button>
          </div>
        )}
      </div>

      {/* Hook d'inscription */}
      <div className="mt-6 text-center">
        <p className="text-[#9CA3AF] text-xs md:text-sm mb-2 md:mb-3">
          ⭐ La séance complète : 4 fiches détaillées, consignes, variantes, impression PDF
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative px-4 md:px-8 py-2 md:py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] animate-pop text-xs md:text-sm whitespace-nowrap"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
          <span className="relative z-10">Débloquer la séance complète (Gratuit)</span>
        </button>
      </div>

      {/* Lead Modal */}
      <LeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
