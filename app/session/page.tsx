'use client';

import { useEffect, useState } from 'react';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { GenerationLoader } from '@/components/GenerationLoader';
import { FicheSeance } from '@/components/seance/FicheSeance';
import {
  CATEGORIES,
  CHARGES,
  THEMES,
  type Categorie,
  type Charge,
  type Seance,
  type ThemeId,
} from '@/lib/seance/schema';

const DUREES = [45, 60, 75, 90, 105, 120];

const inputCls =
  'w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200 min-h-[48px]';

function SessionContent() {
  const [theme, setTheme] = useState<ThemeId>('possession');
  const [categorie, setCategorie] = useState<Categorie>('Seniors');
  const [effectif, setEffectif] = useState('14');
  const [duree, setDuree] = useState('90');
  const [charge, setCharge] = useState<Charge>('Modérée');
  const [seance, setSeance] = useState<Seance | null>(null);
  const [source, setSource] = useState<'ia' | 'bibliotheque' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('seance_prefs');
      if (saved) {
        const p = JSON.parse(saved);
        if (THEMES.some((t) => t.id === p.theme)) setTheme(p.theme);
        if (CATEGORIES.includes(p.categorie)) setCategorie(p.categorie);
        if (p.effectif) setEffectif(String(p.effectif));
        if (p.duree) setDuree(String(p.duree));
        if (CHARGES.includes(p.charge)) setCharge(p.charge);
      }
    } catch {
      // préférences corrompues : on repart des valeurs par défaut
    }
    // Lien profond depuis Coach IA (cycle / débrief) : /session?theme=pressing
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    if (fromUrl && THEMES.some((t) => t.id === fromUrl)) {
      setTheme(fromUrl as ThemeId);
    }
    setMounted(true);
  }, []);

  const generer = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        theme,
        categorie,
        effectif: parseInt(effectif) || 14,
        duree: parseInt(duree) || 90,
        charge,
      };
      localStorage.setItem('seance_prefs', JSON.stringify(params));

      const email = localStorage.getItem('mastro_user') || undefined;
      const response = await fetch('/api/generate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, email }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'La génération a échoué');
      }

      const generated: Seance = json.data;
      setSeance(generated);
      setSource(json.source ?? null);

      // Historique local
      try {
        const sessions = JSON.parse(localStorage.getItem('mastro_sessions') || '[]');
        sessions.push({
          id: `seance-${Date.now()}`,
          version: 2,
          theme,
          categorie,
          effectif: params.effectif,
          duree: params.duree,
          charge,
          date: new Date().toISOString(),
          content: generated,
        });
        // Conserve les 50 dernières séances
        localStorage.setItem('mastro_sessions', JSON.stringify(sessions.slice(-50)));
      } catch (e) {
        console.error('Sauvegarde historique impossible :', e);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération, réessayez.');
    } finally {
      setLoading(false);
    }
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
          theme,
          load: charge,
          school: categorie,
          playerCount: parseInt(effectif) || 14,
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

  // ── Affichage de la séance générée ──
  if (seance) {
    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <div className="print:hidden">
          <ToolsNav currentPage="session" />

          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setSeance(null);
                  setShareMsg('');
                }}
                className="font-bold text-[#39FF14] transition-all hover:text-[#10B981]"
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

        {/* Version impression (blanche) */}
        <div className="hidden bg-white p-6 print:block">
          <FicheSeance seance={seance} print />
        </div>
      </main>
    );
  }

  // ── Formulaire de configuration ──
  return (
    <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
      <ToolsNav currentPage="session" />

      <section className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-2 text-3xl font-black text-[#F3F4F6] md:text-4xl">
          Générateur de séance
        </h1>
        <p className="mb-8 text-[#9CA3AF]">
          Une séance complète selon la méthodologie FFF : mise en train, jeu,
          situation et match final — chaque exercice avec son plan illustré.
        </p>

        <div className="space-y-6 rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-6 md:p-8">
          <div>
            <label htmlFor="theme" className="mb-2 block text-xs font-bold uppercase text-[#F3F4F6]">
              Thème de travail
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeId)}
              className={inputCls}
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
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
                  <option key={c} value={c}>
                    {c}
                  </option>
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
                  <option key={c} value={c}>
                    {c}
                  </option>
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
                  <option key={d} value={d}>
                    {d} minutes
                  </option>
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
            onClick={generer}
            disabled={loading}
            className="min-h-[48px] w-full rounded-lg bg-[#39FF14] py-4 text-sm font-bold uppercase text-[#0A0F0D] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] disabled:opacity-50 md:text-base"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0A0F0D] border-t-transparent" />
                Génération en cours…
              </span>
            ) : (
              '⚽ Générer la séance'
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
