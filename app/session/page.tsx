'use client';

import { useEffect, useState } from 'react';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { GenerationLoader } from '@/components/GenerationLoader';
import { FicheSeance } from '@/components/seance/FicheSeance';
import { SchemaExercice } from '@/components/seance/SchemaExercice';
import {
  CATEGORIES,
  CHARGES,
  DOMAINES,
  ECOLES,
  THEMES,
  type Categorie,
  type Charge,
  type DomaineId,
  type EcoleDeJeu,
  type PhaseSeance,
  type PhaseType,
  type Seance,
  type SeanceDraft,
  type SousThemeId,
} from '@/lib/seance/schema';

const DUREES = [45, 60, 75, 90, 105, 120];

const inputCls =
  'w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200 min-h-[48px]';

const PHASE_LABELS: Record<PhaseType, string> = {
  echauffement: 'Mise en train',
  corps1: 'Corps — exercice 1',
  corps2: 'Corps — exercice 2',
  match: 'Jeu final',
};

// ── Persistance exercices récents ─────────────────────────────────────────────

function chargerExercicesRecents(): string[] {
  try {
    const raw = localStorage.getItem('mastro_exercise_history');
    if (!raw) return [];
    const history: { exerciceTitres: string[] }[] = JSON.parse(raw);
    return history.flatMap((h) => h.exerciceTitres);
  } catch {
    return [];
  }
}

function sauvegarderExercices(titres: string[]) {
  try {
    const raw = localStorage.getItem('mastro_exercise_history');
    const history: { date: string; exerciceTitres: string[] }[] = raw
      ? JSON.parse(raw)
      : [];
    history.push({ date: new Date().toISOString(), exerciceTitres: titres });
    localStorage.setItem(
      'mastro_exercise_history',
      JSON.stringify(history.slice(-10))
    );
  } catch {
    // ignore
  }
}

// ── Composant carte d'une option de phase ────────────────────────────────────

function CarteOption({
  phase,
  selected,
  onSelect,
  onRegenerer,
  regenerating,
}: {
  phase: PhaseSeance;
  selected: boolean;
  onSelect: () => void;
  onRegenerer: () => void;
  regenerating: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border transition-all duration-200 ${
        selected
          ? 'border-[#39FF14] bg-[rgba(57,255,20,0.08)] shadow-[0_0_20px_rgba(57,255,20,0.15)]'
          : 'border-[rgba(57,255,20,0.15)] bg-[#141E1A] hover:border-[rgba(57,255,20,0.35)]'
      }`}
    >
      {/* Schéma tactique */}
      <div className="rounded-t-xl overflow-hidden">
        <SchemaExercice schema={phase.schema} />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              {phase.procede.toUpperCase()} · {phase.duree}′
            </span>
            <h4 className="mt-0.5 text-sm font-black text-[#F3F4F6]">{phase.titre}</h4>
          </div>
          {selected && (
            <span className="mt-0.5 rounded-full bg-[#39FF14] px-2 py-0.5 text-[10px] font-black text-[#0A0F0D]">
              CHOISIE
            </span>
          )}
        </div>

        <p className="mb-2 text-xs leading-relaxed text-[#9CA3AF] line-clamp-2">
          {phase.objectif}
        </p>

        <p className="mb-4 text-xs text-[#9CA3AF]">
          <span className="font-bold text-[#F3F4F6]">Effectif : </span>
          {phase.effectif}
        </p>

        <div className="mt-auto flex gap-2">
          <button
            onClick={onSelect}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              selected
                ? 'bg-[#39FF14] text-[#0A0F0D]'
                : 'border border-[rgba(57,255,20,0.4)] text-[#39FF14] hover:bg-[rgba(57,255,20,0.1)]'
            }`}
          >
            {selected ? '✓ Choisie' : 'Choisir'}
          </button>
          <button
            onClick={onRegenerer}
            disabled={regenerating}
            title="Régénérer cette phase"
            className="rounded-lg border border-[rgba(255,255,255,0.1)] px-3 py-2 text-xs text-[#9CA3AF] transition-all hover:border-[rgba(57,255,20,0.3)] hover:text-[#39FF14] disabled:opacity-40"
          >
            {regenerating ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[#39FF14] border-t-transparent" />
            ) : (
              '↺'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant bloc de phase avec ses 3 options ───────────────────────────────

function BlocPhase({
  phaseType,
  options,
  selectedIndex,
  onSelect,
  onRegenerer,
  regenerating,
}: {
  phaseType: PhaseType;
  options: PhaseSeance[];
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
  onRegenerer: () => void;
  regenerating: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(57,255,20,0.15)] bg-[#0D1510] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#39FF14]">
          {PHASE_LABELS[phaseType]}
        </h3>
        {selectedIndex !== null && (
          <span className="text-xs text-[#9CA3AF]">
            Option {selectedIndex + 1} sélectionnée
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((opt, i) => (
          <CarteOption
            key={i}
            phase={opt}
            selected={selectedIndex === i}
            onSelect={() => onSelect(i)}
            onRegenerer={onRegenerer}
            regenerating={regenerating}
          />
        ))}
        {options.length === 0 && (
          <p className="col-span-3 text-sm text-[#9CA3AF]">
            Aucune option disponible.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

type Step = 'form' | 'choix' | 'seance';

function SessionContent() {
  const [domaine, setDomaine] = useState<DomaineId>('tactique_collective');
  const [sousTheme, setSousTheme] = useState<SousThemeId>('animation_offensive');
  const [categorie, setCategorie] = useState<Categorie>('Seniors');
  const [effectif, setEffectif] = useState('14');
  const [duree, setDuree] = useState('90');
  const [charge, setCharge] = useState<Charge>('Modérée');
  const [ecole, setEcole] = useState<EcoleDeJeu | ''>('');

  const [step, setStep] = useState<Step>('form');
  const [draft, setDraft] = useState<SeanceDraft | null>(null);
  const [choix, setChoix] = useState<Partial<Record<PhaseType, number>>>({});
  const [regeneratingPhase, setRegeneratingPhase] = useState<PhaseType | null>(null);

  const [seance, setSeance] = useState<Seance | null>(null);
  const [source, setSource] = useState<'ia' | 'bibliotheque' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  // Sous-thèmes disponibles pour le domaine sélectionné
  const domaineObj = DOMAINES.find((d) => d.id === domaine);
  const sousThemesDisponibles = domaineObj?.sousThemes ?? [];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('seance_prefs');
      if (saved) {
        const p = JSON.parse(saved);
        if (CATEGORIES.includes(p.categorie)) setCategorie(p.categorie);
        if (p.effectif) setEffectif(String(p.effectif));
        if (p.duree) setDuree(String(p.duree));
        if (CHARGES.includes(p.charge)) setCharge(p.charge);
        // Restaurer domaine + sous-thème
        if (p.domaine && DOMAINES.some((d) => d.id === p.domaine)) {
          setDomaine(p.domaine as DomaineId);
          const d = DOMAINES.find((d) => d.id === p.domaine);
          if (d && d.sousThemes.some((s) => s.id === p.sousTheme)) {
            setSousTheme(p.sousTheme as SousThemeId);
          }
        } else if (p.theme) {
          // Compatibilité ancienne version : theme plat → retrouver le domaine
          const legacy = THEMES.find((t) => t.id === p.theme);
          if (legacy) setSousTheme(p.theme as SousThemeId);
        }
        if (p.ecole && ECOLES.some((e) => e.id === p.ecole)) {
          setEcole(p.ecole as EcoleDeJeu);
        }
      }
    } catch {
      // préférences corrompues
    }

    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    if (fromUrl && THEMES.some((t) => t.id === fromUrl)) {
      setSousTheme(fromUrl as SousThemeId);
    }

    setMounted(true);
  }, []);

  // Synchronise le sous-thème quand le domaine change
  useEffect(() => {
    const d = DOMAINES.find((d) => d.id === domaine);
    if (d && !d.sousThemes.some((s) => s.id === sousTheme)) {
      setSousTheme(d.sousThemes[0]?.id ?? 'animation_offensive');
    }
  }, [domaine, sousTheme]);

  const genererDraft = async () => {
    setLoading(true);
    setError('');
    setDraft(null);
    setChoix({});
    try {
      const effectifNum = parseInt(effectif) || 14;
      const dureeNum = parseInt(duree) || 90;
      const params = {
        theme: sousTheme,
        categorie,
        effectif: effectifNum,
        duree: dureeNum,
        charge,
        ecole: ecole || undefined,
      };

      localStorage.setItem(
        'seance_prefs',
        JSON.stringify({ ...params, domaine, sousTheme })
      );

      const email = localStorage.getItem('mastro_user') || undefined;
      const exercicesRecents = chargerExercicesRecents();

      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, email, exercicesRecents }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'La génération a échoué');
      }

      setDraft(json.data as SeanceDraft);
      setSource(json.source ?? null);
      setStep('choix');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const regenererPhase = async (phaseType: PhaseType) => {
    if (!draft) return;
    setRegeneratingPhase(phaseType);
    try {
      const email = localStorage.getItem('mastro_user') || undefined;
      const exercicesRecents = chargerExercicesRecents();
      // Ajouter aussi les titres du draft actuel comme "récents à éviter"
      const titresActuels = draft.alternatives.flatMap((a) =>
        a.options.map((o) => o.titre)
      );

      const response = await fetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft.params,
          email,
          exercicesRecents: [...exercicesRecents, ...titresActuels],
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error);

      const newDraft: SeanceDraft = json.data;
      const newAlt = newDraft.alternatives.find((a) => a.phase === phaseType);
      if (!newAlt) return;

      setDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alternatives: prev.alternatives.map((a) =>
            a.phase === phaseType ? newAlt : a
          ),
        };
      });
      // Désélectionne la phase régénérée
      setChoix((prev) => {
        const next = { ...prev };
        delete next[phaseType];
        return next;
      });
    } catch (err) {
      console.error('Régénération phase échouée :', err);
    } finally {
      setRegeneratingPhase(null);
    }
  };

  const assemblerSeance = () => {
    if (!draft) return;
    const PHASE_TYPES: PhaseType[] = ['echauffement', 'corps1', 'corps2', 'match'];
    const phases = PHASE_TYPES.map((pt) => {
      const alt = draft.alternatives.find((a) => a.phase === pt);
      const idx = choix[pt] ?? 0;
      return alt?.options[idx] ?? alt?.options[0];
    }).filter((p): p is PhaseSeance => p !== undefined);

    const assembled: Seance = {
      version: 2,
      titre: draft.titre,
      categorie: draft.params.categorie,
      theme: draft.params.theme,
      ecole: draft.params.ecole,
      objectif: draft.params.ecole
        ? `[${ECOLES.find((e) => e.id === draft.params.ecole)?.label ?? ''}] ${draft.objectif}`
        : draft.objectif,
      dureeTotale: draft.params.duree,
      effectif: draft.params.effectif,
      charge: draft.params.charge,
      materiel: draft.materiel,
      phases,
      retourAuCalme: draft.retourAuCalme,
      conseilsCoach: draft.conseilsCoach,
    };

    // Sauvegarder les exercices utilisés pour l'anti-répétition
    sauvegarderExercices(phases.map((p) => p.titre));

    // Historique local
    try {
      const sessions = JSON.parse(localStorage.getItem('mastro_sessions') || '[]');
      sessions.push({
        id: `seance-${Date.now()}`,
        version: 2,
        theme: draft.params.theme,
        categorie: draft.params.categorie,
        effectif: draft.params.effectif,
        duree: draft.params.duree,
        charge: draft.params.charge,
        ecole: draft.params.ecole,
        date: new Date().toISOString(),
        content: assembled,
      });
      localStorage.setItem('mastro_sessions', JSON.stringify(sessions.slice(-50)));
    } catch {
      // ignore
    }

    setSeance(assembled);
    setStep('seance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const partager = async () => {
    if (!seance) return;
    setShareMsg('');
    try {
      const response = await fetch('/api/share-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionData: seance,
          theme: seance.theme,
          load: seance.charge,
          school: seance.categorie,
          playerCount: seance.effectif,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await navigator.clipboard.writeText(result.shareUrl);
        setShareMsg('✅ Lien de partage copié dans le presse-papier');
      } else {
        setShareMsg('❌ Partage indisponible pour le moment');
      }
    } catch {
      setShareMsg('❌ Partage indisponible pour le moment');
    }
  };

  if (!mounted) return null;

  // ── Étape 3 : séance finale ──
  if (step === 'seance' && seance) {
    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <div className="print:hidden">
          <ToolsNav currentPage="session" />
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => { setStep('choix'); setShareMsg(''); }}
                className="font-bold text-[#39FF14] transition-all hover:text-[#10B981]"
              >
                ← Modifier les choix
              </button>
              <button
                onClick={() => { setStep('form'); setSeance(null); setDraft(null); setShareMsg(''); }}
                className="text-[#9CA3AF] transition-all hover:text-[#F3F4F6]"
              >
                ← Nouvelle séance
              </button>
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg bg-[#39FF14] px-5 py-2.5 font-bold text-[#0A0F0D] transition-all hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]"
                >
                  🖨 Imprimer / PDF
                </button>
                <button
                  onClick={partager}
                  className="rounded-lg border border-[rgba(57,255,20,0.4)] px-5 py-2.5 font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.1)]"
                >
                  🔗 Partager
                </button>
              </div>
            </div>

            {source === 'bibliotheque' && (
              <p className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
                Séance issue de la bibliothèque ProSéance (génération IA indisponible).
              </p>
            )}
            {shareMsg && (
              <p className="mb-4 rounded-lg border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.08)] px-4 py-2 text-sm text-[#F3F4F6]">
                {shareMsg}
              </p>
            )}
            <FicheSeance seance={seance} />
          </div>
        </div>
        <div className="hidden bg-white p-6 print:block">
          <FicheSeance seance={seance} print />
        </div>
      </main>
    );
  }

  // ── Étape 2 : choix par phase ──
  if (step === 'choix' && draft) {
    const PHASE_TYPES: PhaseType[] = ['echauffement', 'corps1', 'corps2', 'match'];
    const toutChoisi = PHASE_TYPES.every(
      (pt) => choix[pt] !== undefined || (draft.alternatives.find((a) => a.phase === pt)?.options.length ?? 0) <= 1
    );

    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <ToolsNav currentPage="session" />
        <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setStep('form')}
              className="font-bold text-[#39FF14] transition-all hover:text-[#10B981]"
            >
              ← Critères
            </button>
          </div>

          <h1 className="mb-1 text-2xl font-black text-[#F3F4F6]">
            Composez votre séance
          </h1>
          <p className="mb-8 text-sm text-[#9CA3AF]">
            Choisissez une option par phase. Cliquez sur ↺ pour régénérer les alternatives d'une phase.
          </p>

          {source === 'bibliotheque' && (
            <p className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
              Options issues de la bibliothèque ProSéance (génération IA indisponible). Les phases Corps affichent 1 seule option.
            </p>
          )}

          <div className="space-y-6">
            {PHASE_TYPES.map((pt) => {
              const alt = draft.alternatives.find((a) => a.phase === pt);
              return (
                <BlocPhase
                  key={pt}
                  phaseType={pt}
                  options={alt?.options ?? []}
                  selectedIndex={choix[pt] ?? null}
                  onSelect={(idx) => setChoix((prev) => ({ ...prev, [pt]: idx }))}
                  onRegenerer={() => regenererPhase(pt)}
                  regenerating={regeneratingPhase === pt}
                />
              );
            })}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={assemblerSeance}
              disabled={!toutChoisi}
              className="min-h-[52px] w-full max-w-md rounded-lg bg-[#39FF14] py-4 text-base font-bold uppercase text-[#0A0F0D] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ⚽ Assembler la séance finale
            </button>
            {!toutChoisi && (
              <p className="text-xs text-[#9CA3AF]">
                Sélectionnez une option pour chaque phase pour continuer.
              </p>
            )}
          </div>
        </section>
      </main>
    );
  }

  // ── Étape 1 : formulaire de critères ──
  return (
    <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
      <ToolsNav currentPage="session" />

      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-2 text-3xl font-black text-[#F3F4F6] md:text-4xl">
          Générateur de séance
        </h1>
        <p className="mb-8 text-[#9CA3AF]">
          Sélectionnez vos critères, recevez 3 options par phase et composez la séance idéale.
        </p>

        <div className="space-y-6 rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-6 md:p-8">

          {/* Domaine */}
          <div>
            <label htmlFor="domaine" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
              Domaine de travail
            </label>
            <select
              id="domaine"
              value={domaine}
              onChange={(e) => setDomaine(e.target.value as DomaineId)}
              className={inputCls}
            >
              {DOMAINES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sous-thème (filtré par domaine) */}
          <div>
            <label htmlFor="sousTheme" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
              Sous-thème / Objectif principal
            </label>
            <select
              id="sousTheme"
              value={sousTheme}
              onChange={(e) => setSousTheme(e.target.value as SousThemeId)}
              className={inputCls}
            >
              {sousThemesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* École de jeu (optionnel) */}
          <div>
            <label htmlFor="ecole" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
              École / Style de jeu{' '}
              <span className="ml-1 font-normal normal-case text-[#9CA3AF]">(optionnel)</span>
            </label>
            <select
              id="ecole"
              value={ecole}
              onChange={(e) => setEcole(e.target.value as EcoleDeJeu | '')}
              className={inputCls}
            >
              <option value="">— Aucun style particulier —</option>
              {ECOLES.map((e) => (
                <option key={e.id} value={e.id} title={e.description}>
                  {e.label}
                </option>
              ))}
            </select>
            {ecole && (
              <p className="mt-1.5 text-xs text-[#9CA3AF]">
                {ECOLES.find((e2) => e2.id === ecole)?.description}
              </p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="categorie" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
                Catégorie
              </label>
              <select
                id="categorie"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value as Categorie)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="charge" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
                Charge du jour
              </label>
              <select
                id="charge"
                value={charge}
                onChange={(e) => setCharge(e.target.value as Charge)}
                className={inputCls}
              >
                {CHARGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="effectif" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
                Nombre de joueurs
              </label>
              <input
                id="effectif"
                type="number"
                min="4"
                max="30"
                value={effectif}
                onChange={(e) => setEffectif(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="duree" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
                Durée de la séance
              </label>
              <select
                id="duree"
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                className={inputCls}
              >
                {DUREES.map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500 bg-red-500/20 px-4 py-3 text-red-200" role="alert">
              {error}
            </div>
          )}

          <button
            onClick={genererDraft}
            disabled={loading}
            className="min-h-[48px] w-full rounded-lg bg-[#39FF14] py-4 text-sm font-bold uppercase text-[#0A0F0D] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] disabled:opacity-50 md:text-base"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0A0F0D] border-t-transparent" />
                Génération des options…
              </span>
            ) : (
              '⚽ Générer les options par phase'
            )}
          </button>
        </div>

        {loading && (
          <div className="mt-12 animate-fade-in-up">
            <GenerationLoader />
          </div>
        )}
      </section>
    </main>
  );
}

export default function SessionPage() {
  return (
    <AccessGate>
      <SessionContent />
    </AccessGate>
  );
}
