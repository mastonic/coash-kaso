'use client';

/**
 * FicheSeance — fiche de séance complète façon FFF.
 *
 * Rendu écran (thème sombre de l'app) et rendu impression (fond blanc,
 * une phase par page) via la prop `print`. L'export PDF utilise
 * l'impression navigateur (window.print) avec les styles `@media print`.
 */

import type { PhaseSeance, Seance } from '@/lib/seance/schema';
import { ECOLES, PROCEDE_LABELS, themeLabel } from '@/lib/seance/schema';
import { SchemaExercice } from './SchemaExercice';

const COULEURS_PROCEDE: Record<PhaseSeance['procede'], string> = {
  echauffement: '#FACC15',
  jeu: '#39FF14',
  exercice: '#38BDF8',
  situation: '#F97316',
  match: '#F472B6',
};

interface Props {
  seance: Seance;
  date?: string;
  clubName?: string;
  print?: boolean;
}

export function FicheSeance({ seance, date, clubName = 'ProSéance', print = false }: Props) {
  const dateStr =
    date ??
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const txt = print ? 'text-gray-900' : 'text-[#F3F4F6]';
  const sub = print ? 'text-gray-600' : 'text-[#9CA3AF]';
  const card = print
    ? 'bg-white border border-gray-300'
    : 'bg-[#141E1A] border border-[rgba(57,255,20,0.2)]';

  return (
    <div className={`space-y-6 ${print ? 'fiche-print' : ''}`}>
      {/* ── En-tête de séance ── */}
      <header className={`${card} rounded-2xl p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${print ? 'text-gray-500' : 'text-[#39FF14]'}`}>
              {clubName} — Fiche de séance
            </p>
            <h1 className={`mt-1 text-2xl font-black ${txt}`}>{seance.titre}</h1>
            <p className={`mt-1 text-sm capitalize ${sub}`}>{dateStr}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge print={print} label={seance.categorie} />
            <Badge print={print} label={themeLabel(seance.theme)} />
            {seance.ecole && (
              <Badge
                print={print}
                label={ECOLES.find((e) => e.id === seance.ecole)?.label ?? seance.ecole}
              />
            )}
            <Badge print={print} label={`Charge : ${seance.charge}`} />
          </div>
        </div>

        <p className={`mt-4 text-sm leading-relaxed ${txt}`}>
          <span className="font-bold">Objectif de la séance : </span>
          {seance.objectif}
        </p>

        <div className={`mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 ${txt}`}>
          <Info print={print} label="Durée totale" value={`${seance.dureeTotale} min`} />
          <Info print={print} label="Effectif" value={`${seance.effectif} joueurs`} />
          <Info print={print} label="Phases" value={`${seance.phases.length} + retour au calme`} />
          <Info print={print} label="Matériel" value={seance.materiel} small />
        </div>
      </header>

      {/* ── Chronologie ── */}
      <div className={`${card} rounded-2xl p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          {seance.phases.map((ph, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className={sub}>→</span>}
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: `${COULEURS_PROCEDE[ph.procede]}${print ? '33' : '22'}`,
                  color: print ? '#1F2937' : COULEURS_PROCEDE[ph.procede],
                  border: `1px solid ${COULEURS_PROCEDE[ph.procede]}66`,
                }}
              >
                {PROCEDE_LABELS[ph.procede]} · {ph.duree}′
              </span>
            </div>
          ))}
          <span className={sub}>→</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${print ? 'border border-gray-300 text-gray-600' : 'border border-white/15 text-gray-300'}`}>
            Retour au calme · 5′
          </span>
        </div>
      </div>

      {/* ── Phases ── */}
      {seance.phases.map((phase, i) => (
        <FichePhase key={i} phase={phase} index={i + 1} print={print} />
      ))}

      {/* ── Retour au calme + conseils ── */}
      <div className={`${card} rounded-2xl p-6 fiche-page`}>
        <h3 className={`text-sm font-black uppercase tracking-wider ${print ? 'text-gray-700' : 'text-[#39FF14]'}`}>
          Retour au calme
        </h3>
        <p className={`mt-2 text-sm leading-relaxed ${txt}`}>{seance.retourAuCalme}</p>

        {seance.conseilsCoach.length > 0 && (
          <>
            <h3 className={`mt-5 text-sm font-black uppercase tracking-wider ${print ? 'text-gray-700' : 'text-[#39FF14]'}`}>
              Conseils du coach
            </h3>
            <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm ${txt}`}>
              {seance.conseilsCoach.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function FichePhase({
  phase,
  index,
  print,
}: {
  phase: PhaseSeance;
  index: number;
  print: boolean;
}) {
  const txt = print ? 'text-gray-900' : 'text-[#F3F4F6]';
  const sub = print ? 'text-gray-600' : 'text-[#9CA3AF]';
  const card = print
    ? 'bg-white border border-gray-300'
    : 'bg-[#141E1A] border border-[rgba(57,255,20,0.2)]';
  const heading = print ? 'text-gray-700' : 'text-[#39FF14]';
  const couleur = COULEURS_PROCEDE[phase.procede];

  return (
    <article className={`${card} overflow-hidden rounded-2xl fiche-page`}>
      {/* Bandeau */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
        style={{ backgroundColor: print ? '#F3F4F6' : 'rgba(0,0,0,0.35)', borderBottom: `2px solid ${couleur}` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black"
            style={{ backgroundColor: couleur, color: '#10210F' }}
          >
            {index}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: print ? '#6B7280' : couleur }}>
              {PROCEDE_LABELS[phase.procede]}
            </p>
            <h2 className={`text-lg font-black leading-tight ${txt}`}>{phase.titre}</h2>
          </div>
        </div>
        <span className={`rounded-lg px-3 py-1 text-sm font-black ${print ? 'bg-white border border-gray-300 text-gray-800' : 'bg-black/40 text-white'}`}>
          ⏱ {phase.duree} min
        </span>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {/* Schéma */}
        <div>
          <SchemaExercice schema={phase.schema} print={print} />
          <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${sub}`}>
            <p>
              <span className={`font-bold ${txt}`}>Espace : </span>
              {phase.schema.terrain.longueur} × {phase.schema.terrain.largeur} m
            </p>
            <p>
              <span className={`font-bold ${txt}`}>Effectif : </span>
              {phase.effectif}
            </p>
            <p className="col-span-2">
              <span className={`font-bold ${txt}`}>Matériel : </span>
              {phase.materiel}
            </p>
          </div>
        </div>

        {/* Contenu pédagogique */}
        <div className="space-y-4 text-sm">
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${heading}`}>Objectif</h4>
            <p className={`mt-1 ${txt}`}>{phase.objectif}</p>
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${heading}`}>But pour les joueurs</h4>
            <p className={`mt-1 ${txt}`}>{phase.but}</p>
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${heading}`}>Consignes</h4>
            <ul className={`mt-1 list-disc space-y-1 pl-5 ${txt}`}>
              {phase.consignes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${heading}`}>Variantes</h4>
            <ul className={`mt-1 list-disc space-y-1 pl-5 ${txt}`}>
              {phase.variantes.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider ${heading}`}>Critères de réussite</h4>
            <ul className={`mt-1 list-disc space-y-1 pl-5 ${txt}`}>
              {phase.criteresReussite.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
          {phase.conseilCoach && (
            <div className={`rounded-lg p-3 ${print ? 'bg-blue-50 border border-blue-200' : 'bg-blue-950/30 border border-blue-900/50'}`}>
              <h4 className={`text-xs font-black uppercase tracking-wider ${print ? 'text-blue-700' : 'text-blue-400'}`}>💡 Conseil coach</h4>
              <p className={`mt-1 text-sm ${txt}`}>{phase.conseilCoach}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Badge({ label, print }: { label: string; print: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        print
          ? 'border border-gray-400 bg-gray-100 text-gray-800'
          : 'border border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.1)] text-[#39FF14]'
      }`}
    >
      {label}
    </span>
  );
}

function Info({
  label,
  value,
  print,
  small,
}: {
  label: string;
  value: string;
  print: boolean;
  small?: boolean;
}) {
  return (
    <div className={`rounded-lg p-3 ${print ? 'bg-gray-50 border border-gray-200' : 'bg-black/30 border border-white/5'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${print ? 'text-gray-500' : 'text-[#9CA3AF]'}`}>
        {label}
      </p>
      <p className={`${small ? 'text-xs' : 'text-sm'} mt-0.5 font-bold`}>{value}</p>
    </div>
  );
}
