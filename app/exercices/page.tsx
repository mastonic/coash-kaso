'use client';

/**
 * Bibliothèque d'exercices — fiches FFF illustrées depuis la bibliothèque
 * intégrée ET depuis le catalogue Firestore (exercices externes, unecatef, etc.)
 */

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { SchemaExercice } from '@/components/seance/SchemaExercice';
import { buildSeance } from '@/lib/seance/library';
import {
  CATEGORIES,
  DOMAINES,
  PROCEDE_LABELS,
  THEMES,
  themeLabel,
  type Categorie,
  type DomaineId,
  type PhaseSeance,
  type Procede,
  type SousThemeId,
  type ThemeId,
} from '@/lib/seance/schema';
import type { ExerciceCatalogue } from '@/lib/exercices/types';

// ── Types unifiés ──────────────────────────────────────────────────────────────

interface FicheBiblio extends PhaseSeance {
  theme: ThemeId;
  origine: 'bibliotheque';
}

interface FicheCatalogue extends ExerciceCatalogue {
  origine: 'catalogue';
}

type Fiche = FicheBiblio | FicheCatalogue;

// ── Helpers ────────────────────────────────────────────────────────────────────

const COULEURS_PROCEDE: Record<Procede, string> = {
  echauffement: '#FACC15',
  jeu: '#39FF14',
  exercice: '#38BDF8',
  situation: '#F97316',
  match: '#F472B6',
};

const inputCls =
  'bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] transition-all min-h-[48px]';

function ficheId(f: Fiche): string {
  return f.origine === 'bibliotheque' ? `bib-${f.theme}-${f.titre}` : `cat-${f.id}`;
}

function ficheTheme(f: Fiche): string {
  if (f.origine === 'bibliotheque') return themeLabel(f.theme);
  return f.themes.length > 0 ? themeLabel(f.themes[0]) : '';
}

async function chargerCatalogue(): Promise<ExerciceCatalogue[]> {
  try {
    const res = await fetch('/api/exercices?limit=200');
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? (json.exercices as ExerciceCatalogue[]) : [];
  } catch {
    return [];
  }
}

// ── Composant carte ────────────────────────────────────────────────────────────

function CarteExercice({ fiche, ouvert, onToggle }: {
  fiche: Fiche;
  ouvert: boolean;
  onToggle: () => void;
}) {
  const procede: Procede = fiche.procede;
  const couleur = COULEURS_PROCEDE[procede];
  const schema = fiche.origine === 'bibliotheque' ? fiche.schema : fiche.schema;
  const but = fiche.origine === 'bibliotheque' ? fiche.but : fiche.but;
  const duree = fiche.origine === 'bibliotheque' ? fiche.duree : `${fiche.dureeMin}–${fiche.dureeMax}`;
  const consignes = fiche.consignes;
  const variantes = fiche.variantes;
  const criteresReussite = fiche.criteresReussite;
  const materiel = fiche.materiel;
  const effectifInfo = fiche.origine === 'bibliotheque'
    ? fiche.effectif
    : `${fiche.effectifMin}–${fiche.effectifMax} joueurs`;
  const sourceLabel = fiche.origine === 'catalogue' && fiche.source !== 'interne'
    ? fiche.source
    : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] transition-all hover:border-[rgba(57,255,20,0.45)]">
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderBottom: `2px solid ${couleur}` }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: couleur }}>
              {PROCEDE_LABELS[procede]} · {ficheTheme(fiche)}
            </p>
            {sourceLabel && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[rgba(57,255,20,0.15)] text-[#39FF14] uppercase tracking-wide">
                {sourceLabel}
              </span>
            )}
          </div>
          <h2 className="truncate text-sm font-black text-[#F3F4F6]">{fiche.titre}</h2>
        </div>
        <span className="flex-shrink-0 rounded bg-black/40 px-2 py-1 text-xs font-black text-white">
          {duree}′
        </span>
      </div>

      <div className="p-4">
        {schema && <SchemaExercice schema={schema} />}
        <p className="mt-3 text-xs leading-relaxed text-[#9CA3AF]">
          <span className="font-bold text-[#F3F4F6]">But : </span>
          {but}
        </p>

        {ouvert && (
          <div className="mt-3 space-y-3 border-t border-white/5 pt-3 text-xs">
            {schema && (
              <p className="text-[#9CA3AF]">
                <span className="font-bold text-[#F3F4F6]">Espace : </span>
                {schema.terrain.longueur} × {schema.terrain.largeur} m
                <span className="mx-2 text-white/20">|</span>
                <span className="font-bold text-[#F3F4F6]">Organisation : </span>
                {effectifInfo}
              </p>
            )}
            {materiel && (
              <p className="text-[#9CA3AF]">
                <span className="font-bold text-[#F3F4F6]">Matériel : </span>
                {materiel}
              </p>
            )}
            {consignes.length > 0 && (
              <div>
                <p className="font-black uppercase tracking-wider text-[#39FF14]">Consignes</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                  {consignes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {variantes.length > 0 && (
              <div>
                <p className="font-black uppercase tracking-wider text-[#39FF14]">Variantes</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                  {variantes.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}
            {criteresReussite.length > 0 && (
              <div>
                <p className="font-black uppercase tracking-wider text-[#39FF14]">Critères de réussite</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#F3F4F6]">
                  {criteresReussite.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {fiche.origine === 'catalogue' && fiche.conseilCoach && (
              <div className="rounded-lg bg-[rgba(57,255,20,0.06)] border border-[rgba(57,255,20,0.15)] p-3">
                <p className="font-black uppercase tracking-wider text-[#39FF14]">Conseil coach</p>
                <p className="mt-1 text-[#F3F4F6]">{fiche.conseilCoach}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onToggle}
          className="mt-3 w-full rounded-lg border border-[rgba(57,255,20,0.25)] py-2 text-xs font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.08)]"
        >
          {ouvert ? 'Réduire ▲' : 'Voir la fiche complète ▼'}
        </button>
      </div>
    </article>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

function ExercicesContent() {
  const [categorie, setCategorie] = useState<Categorie>('Seniors');
  const [effectif, setEffectif] = useState(14);
  const [filtreTheme, setFiltreTheme] = useState<SousThemeId | 'tous'>('tous');
  const [filtreDomaine, setFiltreDomaine] = useState<DomaineId | 'tous'>('tous');
  const [filtreProcede, setFiltreProcede] = useState<Procede | 'tous'>('tous');
  const [filtreSource, setFiltreSource] = useState<'tous' | 'bibliotheque' | 'catalogue'>('tous');
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<ExerciceCatalogue[]>([]);
  const [catalogueCharge, setCatalogueCharge] = useState(false);

  useEffect(() => {
    chargerCatalogue().then((data) => {
      setCatalogue(data);
      setCatalogueCharge(true);
    });
  }, []);

  // Fiches depuis la bibliothèque intégrée
  const fichesBiblio = useMemo<FicheBiblio[]>(() => {
    const out: FicheBiblio[] = [];
    const vus = new Set<string>();
    for (const t of THEMES) {
      const seance = buildSeance({ theme: t.id, categorie, effectif, duree: 90, charge: 'Modérée' });
      for (const phase of seance.phases) {
        const cle =
          phase.procede === 'echauffement' || phase.procede === 'match'
            ? phase.procede
            : `${t.id}-${phase.titre}`;
        if (vus.has(cle)) continue;
        vus.add(cle);
        out.push({ ...phase, theme: t.id, origine: 'bibliotheque' });
      }
    }
    return out;
  }, [categorie, effectif]);

  // Fiches depuis le catalogue Firestore
  const fichesCatalogue = useMemo<FicheCatalogue[]>(() => {
    return catalogue.map((e) => ({ ...e, origine: 'catalogue' as const }));
  }, [catalogue]);

  // Fusion et déduplication par titre
  const toutesLesFiches = useMemo<Fiche[]>(() => {
    const titresCatalogue = new Set(fichesCatalogue.map((f) => f.titre.toLowerCase()));
    const bibUnique = fichesBiblio.filter((f) => !titresCatalogue.has(f.titre.toLowerCase()));
    return [...fichesCatalogue, ...bibUnique];
  }, [fichesBiblio, fichesCatalogue]);

  // Application des filtres
  const fichesFiltrees = useMemo(() => {
    return toutesLesFiches.filter((f) => {
      if (filtreSource === 'bibliotheque' && f.origine !== 'bibliotheque') return false;
      if (filtreSource === 'catalogue' && f.origine !== 'catalogue') return false;
      if (filtreProcede !== 'tous' && f.procede !== filtreProcede) return false;
      if (filtreDomaine !== 'tous') {
        if (f.origine === 'bibliotheque') {
          // Retrouver le domaine du thème bibliothèque
          const dom = DOMAINES.find((d) => d.sousThemes.some((s) => s.id === f.theme));
          if (dom?.id !== filtreDomaine) return false;
        } else {
          if (f.domaine !== filtreDomaine) return false;
        }
      }
      if (filtreTheme !== 'tous') {
        if (f.origine === 'bibliotheque') {
          if (f.theme !== filtreTheme) return false;
        } else {
          if (!f.themes.includes(filtreTheme as SousThemeId)) return false;
        }
      }
      if (f.origine === 'catalogue') {
        if (!f.categoriesAge.includes(categorie)) return false;
        if (effectif < f.effectifMin || effectif > f.effectifMax) return false;
      }
      return true;
    });
  }, [toutesLesFiches, filtreSource, filtreProcede, filtreDomaine, filtreTheme, categorie, effectif]);

  const nbCatalogue = fichesCatalogue.length;
  const nbBiblio = fichesBiblio.length;

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="exercices" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#F3F4F6] md:text-5xl">
              Bibliothèque <span className="text-[#39FF14]">d'exercices</span>
            </h1>
            <p className="mt-2 text-base text-[#9CA3AF] md:text-lg">
              {fichesFiltrees.length} fiches disponibles
              {nbCatalogue > 0 && (
                <> — <span className="text-[#39FF14] font-bold">{nbCatalogue} du catalogue</span> + {nbBiblio} FFF intégrées</>
              )}
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
        <div className="mb-8 grid gap-3 rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Source</label>
            <select
              className={`${inputCls} w-full`}
              value={filtreSource}
              onChange={(e) => setFiltreSource(e.target.value as typeof filtreSource)}
            >
              <option value="tous">Toutes les sources</option>
              <option value="catalogue">Catalogue DB</option>
              <option value="bibliotheque">Bibliothèque FFF</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Domaine</label>
            <select
              className={`${inputCls} w-full`}
              value={filtreDomaine}
              onChange={(e) => {
                setFiltreDomaine(e.target.value as DomaineId | 'tous');
                setFiltreTheme('tous');
              }}
            >
              <option value="tous">Tous les domaines</option>
              {DOMAINES.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#9CA3AF]">Thème</label>
            <select
              className={`${inputCls} w-full`}
              value={filtreTheme}
              onChange={(e) => setFiltreTheme(e.target.value as SousThemeId | 'tous')}
            >
              <option value="tous">Tous les thèmes</option>
              {filtreDomaine !== 'tous'
                ? DOMAINES.find((d) => d.id === filtreDomaine)?.sousThemes.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))
                : THEMES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))
              }
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
              min={4}
              max={22}
              value={effectif}
              onChange={(e) => setEffectif(parseInt(e.target.value))}
              className="h-12 w-full accent-[#39FF14]"
            />
          </div>
        </div>

        {!catalogueCharge ? (
          <div className="flex justify-center py-16">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#39FF14] border-t-transparent" />
          </div>
        ) : fichesFiltrees.length === 0 ? (
          <p className="py-16 text-center text-[#9CA3AF]">Aucune fiche pour ces filtres.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fichesFiltrees.map((f) => {
              const id = ficheId(f);
              return (
                <CarteExercice
                  key={id}
                  fiche={f}
                  ouvert={ouvert === id}
                  onToggle={() => setOuvert(ouvert === id ? null : id)}
                />
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
