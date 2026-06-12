'use client';

/**
 * Bibliothèque d’exercices — toutes les fiches FFF illustrées de la
 * bibliothèque intégrée, consultables et filtrables, 100 % hors-ligne.
 *
 * Les fiches sont construites à la volée depuis lib/seance/library pour
 * chaque thème, adaptées à la catégorie et à l’effectif choisis.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { SchemaExercice } from '@/components/seance/SchemaExercice';
import { buildSeance } from '@/lib/seance/library';
import {
  CATEGORIES,
  PROCEDE_LABELS,
  THEMES,
  themeLabel,
  type Categorie,
  type PhaseSeance,
  type Procede,
  type ThemeId,
} from '@/lib/seance/schema';

interface FicheBiblio extends PhaseSeance {
  theme: ThemeId;
}

const COULEURS_PROCEDE: Record<Procede, string> = {
  echauffement: '#FACC15',
  jeu: '#39FF14',
  exercice: '#38BDF8',
  situation: '#F97316',
  match: '#F472B6',
};

const inputCls =
  'bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] transition-all min-h-[48px]';

function ExercicesContent() {
  const [categorie, setCategorie] = useState<Categorie>('Seniors');
  const [effectif, setEffectif] = useState(14);
  const [filtreTheme, setFiltreTheme] = useState<ThemeId | 'tous'>('tous');
  const [filtreProcede, setFiltreProcede] = useState<Procede | 'tous'>('tous');
  const [ouvert, setOuvert] = useState<string | null>(null);

  const fiches = useMemo<FicheBiblio[]>(() => {
    const out: FicheBiblio[] = [];
    const vus = new Set<string>();
    for (const t of THEMES) {
      const seance = buildSeance({
        theme: t.id,
        categorie,
        effectif,
        duree: 90,
        charge: 'Modérée',
      });
      for (const phase of seance.phases) {
        // L’échauffement et le match sont mutualisés entre thèmes : on les garde une fois
        const cle =
          phase.procede === 'echauffement' || phase.procede === 'match'
            ? phase.procede
            : `${t.id}-${phase.titre}`;
        if (vus.has(cle)) continue;
        vus.add(cle);
        out.push({ ...phase, theme: t.id });
      }
    }
    return out;
  }, [categorie, effectif]);

  const filtrees = fiches.filter(
    (f) =>
      (filtreTheme === 'tous' || f.theme === filtreTheme) &&
      (filtreProcede === 'tous' || f.procede === filtreProcede)
  );

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="exercices" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#F3F4F6] md:text-5xl">
              Bibliothèque <span className="text-[#39FF14]">d’exercices</span>
            </h1>
            <p className="mt-2 text-base text-[#9CA3AF] md:text-lg">
              {fiches.length} fiches FFF illustrées, adaptées à ta catégorie — disponibles même hors-ligne.
            </p>
          </div>
          <Link
            href="/session"
            className="rounded-lg bg-[#39FF14] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#0A0F0D] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
          >
            ⚡ Générer une séance complète
          </Link>
        </div>

        {/* Filtres */}
        <div className="mb-8 grid gap-3 rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Thème</label>
            <select
              className={`${inputCls} w-full`}
              value={filtreTheme}
              onChange={(e) => setFiltreTheme(e.target.value as ThemeId | 'tous')}
            >
              <option value="tous">Tous les thèmes</option>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Procédé</label>
            <select
              className={`${inputCls} w-full`}
              value={filtreProcede}
              onChange={(e) => setFiltreProcede(e.target.value as Procede | 'tous')}
            >
              <option value="tous">Tous les procédés</option>
              {(Object.keys(PROCEDE_LABELS) as Procede[]).map((p) => (
                <option key={p} value={p}>{PROCEDE_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Catégorie</label>
            <select
              className={`${inputCls} w-full`}
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as Categorie)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">
              Effectif : {effectif} joueurs
            </label>
            <input
              type="range"
              min={6}
              max={22}
              value={effectif}
              onChange={(e) => setEffectif(parseInt(e.target.value))}
              className="h-12 w-full accent-[#39FF14]"
            />
          </div>
        </div>

        {/* Grille de fiches */}
        {filtrees.length === 0 ? (
          <p className="py-16 text-center text-[#9CA3AF]">Aucune fiche pour ces filtres.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtrees.map((f) => {
              const id = `${f.theme}-${f.titre}`;
              const estOuvert = ouvert === id;
              const couleur = COULEURS_PROCEDE[f.procede];
              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] transition-all hover:border-[rgba(57,255,20,0.45)]"
                >
                  <div
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                    style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderBottom: `2px solid ${couleur}` }}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: couleur }}>
                        {PROCEDE_LABELS[f.procede]} · {themeLabel(f.theme)}
                      </p>
                      <h2 className="truncate text-sm font-black text-[#F3F4F6]">{f.titre}</h2>
                    </div>
                    <span className="flex-shrink-0 rounded bg-black/40 px-2 py-1 text-xs font-black text-white">
                      {f.duree}′
                    </span>
                  </div>

                  <div className="p-4">
                    <SchemaExercice schema={f.schema} />
                    <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
                      <span className="font-bold text-[#F3F4F6]">But : </span>
                      {f.but}
                    </p>

                    {estOuvert && (
                      <div className="mt-3 space-y-3 border-t border-white/5 pt-3 text-xs">
                        <p className="text-[#9CA3AF]">
                          <span className="font-bold text-[#F3F4F6]">Espace : </span>
                          {f.schema.terrain.longueur} × {f.schema.terrain.largeur} m
                          <span className="mx-2 text-white/20">|</span>
                          <span className="font-bold text-[#F3F4F6]">Organisation : </span>
                          {f.effectif}
                        </p>
                        <div>
                          <p className="font-black uppercase tracking-wider text-[#39FF14]">Consignes</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                            {f.consignes.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-wider text-[#39FF14]">Variantes</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                            {f.variantes.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-wider text-[#39FF14]">Critères de réussite</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                            {f.criteresReussite.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setOuvert(estOuvert ? null : id)}
                      className="mt-3 w-full rounded-lg border border-[rgba(57,255,20,0.25)] py-2 text-xs font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.08)]"
                    >
                      {estOuvert ? 'Réduire ▲' : 'Voir la fiche complète ▼'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ExercicesPage() {
  return (
    <AccessGate>
      <ExercicesContent />
    </AccessGate>
  );
}
