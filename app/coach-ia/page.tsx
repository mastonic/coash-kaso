'use client';

/**
 * Coach IA — le staff virtuel : causerie d’avant-match, plan de cycle,
 * débrief post-match. Trois outils, un seul endroit.
 */

import { useState } from 'react';
import Link from 'next/link';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { CATEGORIES, themeLabel } from '@/lib/seance/schema';
import type { Causerie, Cycle, Debrief } from '@/lib/coach-ia';

type Outil = 'causerie' | 'cycle' | 'debrief';

const inputCls =
  'w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] placeholder-[#4B5563] focus:outline-none focus:border-[#39FF14] transition-all min-h-[48px]';

const labelCls = 'block text-xs font-black uppercase tracking-wider text-[#9CA3AF] mb-2';

const cardCls = 'bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-black uppercase tracking-wider text-[#39FF14]">{children}</h3>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <span className="rounded-full border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.08)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#39FF14]">
      {source === 'ia' ? '🤖 Généré par IA' : '📚 Bibliothèque ProSéance'}
    </span>
  );
}

function GenerateButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-[#39FF14] px-6 py-4 text-sm font-black uppercase tracking-wide text-[#0A0F0D] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(57,255,20,0.5)] disabled:opacity-50 disabled:hover:scale-100"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0A0F0D] border-t-transparent" />
          Génération…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// ── Causerie ─────────────────────────────────────────────────────────────────

function OutilCauserie() {
  const [adversaire, setAdversaire] = useState('');
  const [enjeu, setEnjeu] = useState('Match de championnat');
  const [categorie, setCategorie] = useState('Seniors');
  const [contexte, setContexte] = useState('');
  const [ton, setTon] = useState<'motivant' | 'calme' | 'exigeant'>('motivant');
  const [result, setResult] = useState<Causerie | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coach-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'causerie', adversaire, enjeu, categorie, contexte, ton }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Génération échouée');
      setResult(json.data);
      setSource(json.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={generer} className={`${cardCls} h-fit space-y-4 p-6`}>
        <div>
          <label className={labelCls}>Adversaire</label>
          <input
            className={inputCls}
            value={adversaire}
            onChange={(e) => setAdversaire(e.target.value)}
            placeholder="FC Exemple"
          />
        </div>
        <div>
          <label className={labelCls}>Enjeu</label>
          <select className={inputCls} value={enjeu} onChange={(e) => setEnjeu(e.target.value)}>
            {[
              'Match de championnat',
              'Match de coupe',
              'Derby',
              'Match pour la montée',
              'Match pour le maintien',
              'Match amical',
              'Tournoi / plateau',
            ].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Catégorie</label>
          <select className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ton de la causerie</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['motivant', '🔥 Motivant'],
                ['calme', '🧘 Calme'],
                ['exigeant', '⚡ Exigeant'],
              ] as const
            ).map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTon(id)}
                className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition-all ${
                  ton === id
                    ? 'border-[#39FF14] bg-[rgba(57,255,20,0.15)] text-[#39FF14]'
                    : 'border-[rgba(57,255,20,0.15)] text-[#9CA3AF] hover:border-[rgba(57,255,20,0.4)]'
                }`}
              >
                {lab}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Contexte (optionnel)</label>
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={contexte}
            onChange={(e) => setContexte(e.target.value)}
            placeholder="Ex : 2 défaites de suite, gros match aller perdu 3-0, groupe un peu tendu…"
          />
        </div>
        {error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
        )}
        <GenerateButton loading={loading} label="🎤 Générer ma causerie" />
      </form>

      {result ? (
        <div className={`${cardCls} space-y-5 p-6 md:p-8`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black text-[#F3F4F6]">{result.titre}</h2>
            <SourceBadge source={source} />
          </div>

          <div>
            <SectionTitle>L’accroche</SectionTitle>
            <p className="mt-2 border-l-2 border-[#39FF14] pl-4 text-base italic leading-relaxed text-[#F3F4F6]">
              « {result.accroche} »
            </p>
          </div>

          <div>
            <SectionTitle>Les 3 messages du match</SectionTitle>
            <ol className="mt-2 space-y-2">
              {result.messages.map((m, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#F3F4F6]">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-xs font-black text-[#0A0F0D]">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SectionTitle>Consignes par ligne</SectionTitle>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {result.tactique.map((t, i) => (
                <div key={i} className="rounded-lg border border-white/5 bg-black/30 p-3">
                  <p className="text-xs font-black uppercase text-[#39FF14]">{t.ligne}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#F3F4F6]">{t.consigne}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.07)] p-4">
            <SectionTitle>La phrase finale</SectionTitle>
            <p className="mt-1 text-base font-bold leading-relaxed text-[#F3F4F6]">
              « {result.motivation} »
            </p>
          </div>

          <div>
            <SectionTitle>Pense-bête mi-temps</SectionTitle>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#9CA3AF]">
              {result.miTemps.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Placeholder
          icon="🎤"
          titre="Ta causerie d’avant-match, écrite pour toi"
          texte="Accroche, 3 messages clés, consignes par ligne, phrase finale et pense-bête mi-temps : tout le discours du vestiaire, adapté à l’adversaire, l’enjeu et l’état de ton groupe."
        />
      )}
    </div>
  );
}

// ── Cycle ────────────────────────────────────────────────────────────────────

const CHARGE_COLOR: Record<string, string> = {
  Récupération: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
  Modérée: 'text-[#39FF14] border-[rgba(57,255,20,0.4)] bg-[rgba(57,255,20,0.08)]',
  Élevée: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
};

function OutilCycle() {
  const [objectif, setObjectif] = useState('');
  const [semaines, setSemaines] = useState('4');
  const [categorie, setCategorie] = useState('Seniors');
  const [effectif, setEffectif] = useState('14');
  const [result, setResult] = useState<Cycle | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coach-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'cycle',
          objectif,
          semaines: parseInt(semaines) || 4,
          categorie,
          effectif: parseInt(effectif) || 14,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Génération échouée');
      setResult(json.data);
      setSource(json.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={generer} className={`${cardCls} h-fit space-y-4 p-6`}>
        <div>
          <label className={labelCls}>Objectif du cycle</label>
          <textarea
            className={`${inputCls} min-h-[90px] resize-y`}
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            placeholder="Ex : être plus efficaces devant le but / mieux ressortir le ballon sous pressing / préparer la phase retour…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Semaines</label>
            <select className={inputCls} value={semaines} onChange={(e) => setSemaines(e.target.value)}>
              {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>{n} semaines</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Effectif</label>
            <input
              type="number"
              min={4}
              max={30}
              className={inputCls}
              value={effectif}
              onChange={(e) => setEffectif(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Catégorie</label>
          <select className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        {error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
        )}
        <GenerateButton loading={loading} label="📈 Construire mon cycle" />
      </form>

      {result ? (
        <div className="space-y-4">
          <div className={`${cardCls} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-black text-[#F3F4F6]">{result.titre}</h2>
              <SourceBadge source={source} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">{result.objectif}</p>
          </div>

          {result.semaines.map((s) => (
            <div key={s.numero} className={`${cardCls} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#39FF14] text-sm font-black text-[#0A0F0D]">
                    S{s.numero}
                  </span>
                  <div>
                    <h3 className="font-black text-[#F3F4F6]">{s.titre}</h3>
                    <p className="text-xs text-[#9CA3AF]">{themeLabel(s.theme)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${CHARGE_COLOR[s.charge] ?? CHARGE_COLOR['Modérée']}`}>
                    {s.charge}
                  </span>
                  <Link
                    href={`/session?theme=${s.theme}`}
                    className="rounded-lg bg-[rgba(57,255,20,0.12)] px-3 py-1.5 text-xs font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.25)]"
                  >
                    ⚡ Générer la séance →
                  </Link>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#F3F4F6]">{s.objectif}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#9CA3AF]">
                {s.pointsCles.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className={`${cardCls} p-6`}>
            <SectionTitle>Conseils de pilotage</SectionTitle>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#F3F4F6]">
              {result.conseils.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Placeholder
          icon="📈"
          titre="Ta périodisation sur plusieurs semaines"
          texte="Décris ton objectif, choisis la durée : Coach IA construit un cycle progressif semaine par semaine — thème, charge, points clés — et chaque semaine se transforme en séance illustrée en un clic."
        />
      )}
    </div>
  );
}

// ── Débrief ──────────────────────────────────────────────────────────────────

function OutilDebrief() {
  const [adversaire, setAdversaire] = useState('');
  const [scoreEquipe, setScoreEquipe] = useState('1');
  const [scoreAdverse, setScoreAdverse] = useState('1');
  const [categorie, setCategorie] = useState('Seniors');
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<Debrief | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coach-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'debrief',
          adversaire,
          scoreEquipe: parseInt(scoreEquipe) || 0,
          scoreAdverse: parseInt(scoreAdverse) || 0,
          categorie,
          observations,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Génération échouée');
      setResult(json.data);
      setSource(json.source ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={generer} className={`${cardCls} h-fit space-y-4 p-6`}>
        <div>
          <label className={labelCls}>Adversaire</label>
          <input
            className={inputCls}
            value={adversaire}
            onChange={(e) => setAdversaire(e.target.value)}
            placeholder="FC Exemple"
          />
        </div>
        <div>
          <label className={labelCls}>Score (nous — eux)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={99}
              className={`${inputCls} text-center text-xl font-black`}
              value={scoreEquipe}
              onChange={(e) => setScoreEquipe(e.target.value)}
            />
            <span className="text-2xl font-black text-[#9CA3AF]">—</span>
            <input
              type="number"
              min={0}
              max={99}
              className={`${inputCls} text-center text-xl font-black`}
              value={scoreAdverse}
              onChange={(e) => setScoreAdverse(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Catégorie</label>
          <select className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Tes observations</label>
          <textarea
            className={`${inputCls} min-h-[110px] resize-y`}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex : beaucoup de pertes de balle dans la relance, on a souffert sur leurs transitions, bonne première mi-temps puis baisse physique…"
          />
        </div>
        {error && (
          <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
        )}
        <GenerateButton loading={loading} label="🔍 Analyser mon match" />
      </form>

      {result ? (
        <div className={`${cardCls} space-y-5 p-6 md:p-8`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black text-[#F3F4F6]">Débrief du match</h2>
            <SourceBadge source={source} />
          </div>

          <p className="border-l-2 border-[#39FF14] pl-4 text-sm leading-relaxed text-[#F3F4F6]">
            {result.resume}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)] p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#10B981]">✅ À valoriser</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[#F3F4F6]">
                {result.forces.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-orange-400/30 bg-orange-400/5 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">🎯 À travailler</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[#F3F4F6]">
                {result.axes.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.07)] p-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#39FF14]">
              Thème recommandé pour la semaine
            </h3>
            <p className="mt-1 text-lg font-black text-[#F3F4F6]">{themeLabel(result.themeRecommande)}</p>
            <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">{result.justification}</p>
            <p className="mt-3 text-sm leading-relaxed text-[#F3F4F6]">{result.prochaineSeance}</p>
            <Link
              href={`/session?theme=${result.themeRecommande}`}
              className="mt-4 inline-block rounded-lg bg-[#39FF14] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#0A0F0D] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
            >
              ⚡ Générer la séance de la semaine →
            </Link>
          </div>
        </div>
      ) : (
        <Placeholder
          icon="🔍"
          titre="Du match à la prochaine séance"
          texte="Donne le score et tes observations : Coach IA en tire un débrief structuré — points forts à valoriser, axes prioritaires — et te recommande le thème de la semaine, prêt à être généré en séance illustrée."
        />
      )}
    </div>
  );
}

function Placeholder({ icon, titre, texte }: { icon: string; titre: string; texte: string }) {
  return (
    <div className={`${cardCls} flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center`}>
      <div className="text-6xl opacity-30">{icon}</div>
      <h3 className="text-lg font-black text-[#F3F4F6]">{titre}</h3>
      <p className="max-w-md text-sm leading-relaxed text-[#9CA3AF]">{texte}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const OUTILS: { id: Outil; icon: string; label: string; desc: string }[] = [
  { id: 'causerie', icon: '🎤', label: 'Causerie', desc: 'Discours d’avant-match' },
  { id: 'cycle', icon: '📈', label: 'Plan de cycle', desc: 'Périodisation sur N semaines' },
  { id: 'debrief', icon: '🔍', label: 'Débrief', desc: 'Analyse post-match' },
];

function CoachIaContent() {
  const [outil, setOutil] = useState<Outil>('causerie');

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="coach-ia" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#F3F4F6] md:text-5xl">
            Coach <span className="text-[#39FF14]">IA</span>
          </h1>
          <p className="mt-2 text-base text-[#9CA3AF] md:text-lg">
            Ton staff virtuel : causerie d’avant-match, périodisation et débrief — connectés au générateur de séances.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {OUTILS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOutil(o.id)}
              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                outil === o.id
                  ? 'border-[#39FF14] bg-[rgba(57,255,20,0.1)] shadow-[0_0_25px_rgba(57,255,20,0.15)]'
                  : 'border-[rgba(57,255,20,0.12)] bg-[#141E1A] hover:border-[rgba(57,255,20,0.4)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{o.icon}</span>
                <div>
                  <p className={`font-black ${outil === o.id ? 'text-[#39FF14]' : 'text-[#F3F4F6]'}`}>{o.label}</p>
                  <p className="text-xs text-[#9CA3AF]">{o.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {outil === 'causerie' && <OutilCauserie />}
        {outil === 'cycle' && <OutilCycle />}
        {outil === 'debrief' && <OutilDebrief />}
      </div>
    </main>
  );
}

export default function CoachIaPage() {
  return (
    <AccessGate>
      <CoachIaContent />
    </AccessGate>
  );
}
