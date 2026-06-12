'use client';

/**
 * Coach de Tir — upload d'une vidéo de frappe, analyse biomécanique par
 * Gemini Vision, restitution façon télémétrie (HUD) : vitesse, distance,
 * résultat, notes par critère du geste, corrections et exercices.
 */

import { useState } from 'react';
import Link from 'next/link';

interface CritereTir {
  nom: string;
  note: number;
  observation: string;
  correction: string;
}

interface AnalyseTir {
  resultat: 'but' | 'rate' | 'arrete' | 'indetermine';
  vitesseEstimee: number | null;
  distanceEstimee: number | null;
  trajectoire: string;
  criteres: CritereTir[];
  noteGlobale: number;
  pointFort: string;
  prioriteTravail: string;
  exercices: string[];
}

const MAX_SIZE_MB = 20;

const RESULTAT_LABEL: Record<AnalyseTir['resultat'], { label: string; cls: string }> = {
  but: { label: 'BUT ✓', cls: 'text-[#39FF14]' },
  rate: { label: 'RATÉ ✗', cls: 'text-red-400' },
  arrete: { label: 'ARRÊTÉ 🧤', cls: 'text-yellow-400' },
  indetermine: { label: '— —', cls: 'text-[#9CA3AF]' },
};

function noteColor(note: number): string {
  if (note >= 7.5) return '#39FF14';
  if (note >= 5) return '#FACC15';
  return '#F87171';
}

function HudCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgba(57,255,20,0.25)] bg-black/50 p-4 font-mono">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#39FF14]">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ShotAnalyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contexte, setContexte] = useState('');
  const [analyse, setAnalyse] = useState<AnalyseTir | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Sélectionne une vidéo (mp4, mov…).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Vidéo trop lourde (max ${MAX_SIZE_MB} Mo). Filme la frappe en 5-15 secondes.`);
      return;
    }

    setError(null);
    setAnalyse(null);
    setAnalyzing(true);
    setProgress('Lecture de la vidéo…');

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const videoBase64 = (e.target?.result as string).split(',')[1];
        setProgress('Détection ballon / but / joueur + angles du corps…');
        const res = await fetch('/api/analyse-tir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoBase64, mimeType: file.type, contexte }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Analyse échouée');
        setAnalyse(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur pendant l'analyse.");
      } finally {
        setAnalyzing(false);
        setProgress('');
      }
    };
    reader.onerror = () => {
      setError('Lecture du fichier impossible.');
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-6">
        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#9CA3AF]">
            Contexte (optionnel)
          </label>
          <input
            value={contexte}
            onChange={(e) => setContexte(e.target.value)}
            placeholder="Ex : frappe du droit, 16 m, joueur U15, travaille les frappes enroulées…"
            className="w-full rounded-lg border border-[rgba(57,255,20,0.2)] bg-[#0A0F0D] px-4 py-3 text-[#F3F4F6] placeholder-[#4B5563] transition-all focus:border-[#39FF14] focus:outline-none"
            disabled={analyzing}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) handleUpload(f);
                e.currentTarget.value = '';
              }}
              disabled={analyzing}
              className="hidden"
            />
            <span className="block w-full cursor-pointer rounded-lg bg-[#39FF14] py-4 text-center font-bold text-[#0A0F0D] transition-all hover:scale-105 active:scale-95">
              {analyzing ? '⏳ Analyse…' : '🎬 Vidéo de la frappe (galerie)'}
            </span>
          </label>
          <label className="block">
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) handleUpload(f);
                e.currentTarget.value = '';
              }}
              disabled={analyzing}
              className="hidden"
            />
            <span className="block w-full cursor-pointer rounded-lg border-2 border-[#39FF14] py-4 text-center font-bold text-[#39FF14] transition-all hover:bg-[rgba(57,255,20,0.08)] active:scale-95">
              {analyzing ? '⏳ Analyse…' : '📱 Filmer maintenant'}
            </span>
          </label>
        </div>
        <p className="mt-3 text-xs text-[#9CA3AF]">
          💡 Filme de côté ou de derrière le tireur, but visible dans le cadre, 5-15 secondes, max {MAX_SIZE_MB} Mo.
        </p>

        {analyzing && (
          <div className="mt-4 rounded-lg border border-[rgba(57,255,20,0.25)] bg-black/40 p-4 font-mono text-xs text-[#39FF14]">
            <span className="mr-2 inline-block animate-spin">⟳</span>
            {progress}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>

      {analyse && (
        <div className="space-y-5">
          {/* ── HUD télémétrie ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HudCard label="Shot speed">
              <p className="text-3xl font-black text-[#F3F4F6]">
                {analyse.vitesseEstimee !== null ? analyse.vitesseEstimee : '--'}
                <span className="ml-1 text-sm text-[#9CA3AF]">KM/H</span>
              </p>
              <p className="text-[10px] text-[#9CA3AF]">estimation vidéo</p>
            </HudCard>
            <HudCard label="Distance au but">
              <p className="text-3xl font-black text-[#F3F4F6]">
                {analyse.distanceEstimee !== null ? analyse.distanceEstimee : '--'}
                <span className="ml-1 text-sm text-[#9CA3AF]">M</span>
              </p>
              <p className="text-[10px] text-[#9CA3AF]">frappe → ligne</p>
            </HudCard>
            <HudCard label="Goal ?">
              <p className={`text-3xl font-black ${RESULTAT_LABEL[analyse.resultat].cls}`}>
                {RESULTAT_LABEL[analyse.resultat].label}
              </p>
            </HudCard>
            <HudCard label="Note du geste">
              <p className="text-3xl font-black" style={{ color: noteColor(analyse.noteGlobale) }}>
                {analyse.noteGlobale}
                <span className="ml-1 text-sm text-[#9CA3AF]">/10</span>
              </p>
            </HudCard>
          </div>

          <div className="rounded-xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-4">
            <p className="text-xs font-black uppercase tracking-wider text-[#39FF14]">Trajectoire</p>
            <p className="mt-1 text-sm text-[#F3F4F6]">{analyse.trajectoire}</p>
          </div>

          {/* ── Biomécanique ── */}
          <div className="rounded-2xl border border-[rgba(57,255,20,0.2)] bg-[#141E1A] p-6">
            <h3 className="mb-4 text-lg font-black text-[#F3F4F6]">🦴 Analyse du geste</h3>
            <div className="space-y-4">
              {analyse.criteres.map((c, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#F3F4F6]">{c.nom}</p>
                    <span className="font-mono text-sm font-black" style={{ color: noteColor(c.note) }}>
                      {c.note}/10
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.note * 10}%`, backgroundColor: noteColor(c.note) }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">{c.observation}</p>
                  {c.correction !== '—' && (
                    <p className="mt-0.5 text-xs leading-relaxed text-[#F3F4F6]">
                      <span className="font-bold text-[#39FF14]">→ Correction : </span>
                      {c.correction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Synthèse + exercices ── */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)] p-5">
              <p className="text-xs font-black uppercase tracking-wider text-[#10B981]">✅ À conserver</p>
              <p className="mt-1 text-sm leading-relaxed text-[#F3F4F6]">{analyse.pointFort}</p>
            </div>
            <div className="rounded-xl border border-orange-400/30 bg-orange-400/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-orange-400">🎯 Priorité n°1</p>
              <p className="mt-1 text-sm leading-relaxed text-[#F3F4F6]">{analyse.prioriteTravail}</p>
            </div>
          </div>

          {analyse.exercices.length > 0 && (
            <div className="rounded-2xl border border-[rgba(57,255,20,0.3)] bg-[rgba(57,255,20,0.06)] p-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#39FF14]">
                Exercices correctifs
              </h3>
              <ol className="mt-3 space-y-2">
                {analyse.exercices.map((e, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#F3F4F6]">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-xs font-black text-[#0A0F0D]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{e}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/session?theme=finition"
                className="mt-5 inline-block rounded-lg bg-[#39FF14] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#0A0F0D] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.5)]"
              >
                ⚡ Générer une séance Finition complète →
              </Link>
            </div>
          )}

          {videoUrl && (
            <details className="rounded-xl border border-white/10 bg-black/30 p-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                Revoir la vidéo analysée
              </summary>
              <video src={videoUrl} controls className="mt-3 w-full rounded-lg" />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
