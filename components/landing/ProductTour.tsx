'use client';

/**
 * ProductTour — « vidéo » explicative en motion design.
 *
 * Un lecteur auto-joué de 4 scènes (~21 s en boucle) qui montre le produit :
 *   1. Configurer la séance   2. Génération IA + bibliothèque FFF
 *   3. Le plan animé de l'exercice   4. Sur le terrain (PDF + PWA)
 *
 * Tout est rendu en React/CSS/SVG — pas de fichier vidéo : léger, net sur
 * tous les écrans, et traduit la vraie interface du produit.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatedSchema } from './AnimatedSchema';

const CSS = (v: Record<string, string | number>) => v as React.CSSProperties;

interface Scene {
  id: string;
  titre: string;
  caption: string;
  dur: number; // secondes
}

const SCENES: Scene[] = [
  {
    id: 'config',
    titre: '1 · Configure',
    caption: 'Choisis le thème, la catégorie, l’effectif et la durée — 10 secondes chrono.',
    dur: 5,
  },
  {
    id: 'ia',
    titre: '2 · Génération',
    caption: 'L’IA construit une séance complète selon la méthodologie FFF. Sans réseau ? La bibliothèque intégrée prend le relais.',
    dur: 4.5,
  },
  {
    id: 'plan',
    titre: '3 · Le plan',
    caption: 'Chaque exercice arrive avec son schéma : joueurs, plots, passes, conduite, tir. Comme une fiche FFF.',
    dur: 6.5,
  },
  {
    id: 'terrain',
    titre: '4 · Sur le terrain',
    caption: 'Imprime la fiche en PDF ou installe l’app sur ton téléphone — elle marche même hors-ligne.',
    dur: 5,
  },
];

const TOTAL = SCENES.reduce((s, sc) => s + sc.dur, 0);

/** Texte qui se tape tout seul */
function TypeText({ text, delay, speed = 45 }: { text: string; delay: number; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay, speed]);
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="anim-caret text-[#39FF14]">▍</span>}
    </span>
  );
}

// ── Scène 1 : configuration ──────────────────────────────────────────────────
function SceneConfig() {
  const fields = [
    { label: 'Thème', value: 'Transitions off. / déf.', delay: 300 },
    { label: 'Catégorie', value: 'U12-U13', delay: 1500 },
    { label: 'Effectif', value: '12 joueurs', delay: 2300 },
    { label: 'Durée', value: '75 minutes', delay: 3100 },
  ];
  return (
    <div className="anim-scene-in flex h-full flex-col justify-center gap-3 p-5 sm:p-8">
      {fields.map((f, i) => (
        <div
          key={i}
          className="anim-pop-el rounded-lg border border-[rgba(57,255,20,0.25)] bg-[#0A0F0D] px-4 py-2.5"
          style={CSS({ '--pop-delay': `${0.1 + i * 0.75}s` })}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">{f.label}</p>
          <p className="font-bold text-[#F3F4F6]">
            <TypeText text={f.value} delay={f.delay} />
          </p>
        </div>
      ))}
      <div
        className="anim-pop-el mt-1 rounded-lg bg-[#39FF14] py-2.5 text-center text-sm font-black uppercase text-[#0A0F0D]"
        style={CSS({ '--pop-delay': '4s' })}
      >
        ⚽ Générer la séance
      </div>
    </div>
  );
}

// ── Scène 2 : génération IA ──────────────────────────────────────────────────
function SceneIA() {
  const steps = [
    'Structure FFF : 4 phases + retour au calme',
    'Fiches : but, consignes, variantes, critères',
    'Schémas tactiques de chaque exercice',
    'Adaptation à la catégorie U12-U13',
  ];
  return (
    <div className="anim-scene-in flex h-full flex-col items-center justify-center gap-5 p-5 sm:p-8">
      {/* Radar */}
      <div className="relative h-24 w-24">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="anim-pulse-ring absolute inset-0 rounded-full border-2 border-[#39FF14]"
            style={CSS({ '--ring-delay': `${i * 0.5}s` })}
          />
        ))}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(57,255,20,0.12)] text-3xl">
          🧠
        </span>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className="anim-pop-el flex items-center gap-2 rounded-md border border-white/5 bg-black/30 px-3 py-2 text-xs text-[#F3F4F6] sm:text-sm"
            style={CSS({ '--pop-delay': `${0.5 + i * 0.8}s` })}
          >
            <span className="font-black text-[#39FF14]">✓</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scène 3 : le plan animé ──────────────────────────────────────────────────
function ScenePlan() {
  return (
    <div className="anim-scene-in flex h-full flex-col items-center justify-center gap-2 p-4 sm:p-6">
      <div className="flex w-full max-w-[420px] items-center justify-between sm:max-w-[480px]">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#F97316] sm:text-xs">
          Situation · 20 min
        </p>
        <p className="text-[10px] font-bold text-[#9CA3AF] sm:text-xs">Transition 3c2 — attaque rapide</p>
      </div>
      <div className="w-full max-w-[420px] sm:max-w-[480px]">
        <AnimatedSchema />
      </div>
    </div>
  );
}

// ── Scène 4 : sur le terrain ─────────────────────────────────────────────────
function SceneTerrain() {
  return (
    <div className="anim-scene-in flex h-full items-center justify-center gap-6 p-5 sm:gap-10 sm:p-8">
      {/* Téléphone */}
      <div className="anim-hover-float relative h-56 w-28 rounded-2xl border-2 border-[rgba(57,255,20,0.4)] bg-[#0A0F0D] p-2 shadow-[0_0_40px_rgba(57,255,20,0.15)] sm:h-64 sm:w-32">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/20" />
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-[#39FF14]/70" />
          <div className="h-2 w-1/2 rounded bg-white/20" />
          <div className="mt-2 h-16 rounded-md bg-[#16301B] p-1.5 sm:h-20">
            <div className="h-full rounded border border-[rgba(57,255,20,0.35)]" />
          </div>
          <div className="h-2 w-2/3 rounded bg-white/15" />
          <div className="h-2 w-1/2 rounded bg-white/10" />
          <div className="h-2 w-3/5 rounded bg-white/10" />
        </div>
        <div
          className="anim-pop-el absolute -right-3 -top-3 rounded-full bg-[#39FF14] px-2.5 py-1 text-[10px] font-black text-[#0A0F0D]"
          style={CSS({ '--pop-delay': '1.2s' })}
        >
          PWA ✓
        </div>
        <div
          className="anim-pop-el absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white"
          style={CSS({ '--pop-delay': '2s' })}
        >
          📡 Hors-ligne OK
        </div>
      </div>

      {/* Fiche PDF */}
      <div
        className="anim-pop-el relative h-56 w-40 rotate-3 rounded-lg bg-white p-3 shadow-2xl sm:h-64 sm:w-48"
        style={CSS({ '--pop-delay': '0.6s' })}
      >
        <div className="h-2.5 w-2/3 rounded bg-gray-800" />
        <div className="mt-1 h-1.5 w-1/3 rounded bg-gray-400" />
        <div className="mt-2 h-20 rounded border-2 border-green-700/50 bg-green-50 sm:h-24" />
        <div className="mt-2 space-y-1">
          <div className="h-1.5 w-full rounded bg-gray-300" />
          <div className="h-1.5 w-5/6 rounded bg-gray-300" />
          <div className="h-1.5 w-4/6 rounded bg-gray-300" />
        </div>
        <div
          className="anim-pop-el absolute -bottom-3 -right-3 rounded-full bg-[#DC2626] px-2.5 py-1.5 text-[10px] font-black text-white"
          style={CSS({ '--pop-delay': '1.6s' })}
        >
          PDF
        </div>
      </div>
    </div>
  );
}

// ── Lecteur ──────────────────────────────────────────────────────────────────
export function ProductTour() {
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0); // secondes depuis le début du cycle
  const [cycle, setCycle] = useState(0); // pour remonter les scènes en boucle
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Ne joue que lorsque visible à l'écran
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;
    const it = setInterval(() => {
      setElapsed((t) => {
        const next = t + 0.1;
        if (next >= TOTAL) {
          setCycle((c) => c + 1);
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(it);
  }, [playing, inView]);

  // Scène courante
  let acc = 0;
  let sceneIdx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (elapsed < acc + SCENES[i].dur) {
      sceneIdx = i;
      break;
    }
    acc += SCENES[i].dur;
    sceneIdx = i;
  }
  const sceneElapsed = elapsed - SCENES.slice(0, sceneIdx).reduce((s, sc) => s + sc.dur, 0);

  const goTo = (i: number) => {
    setElapsed(SCENES.slice(0, i).reduce((s, sc) => s + sc.dur, 0));
    setCycle((c) => c + 1);
    setPlaying(true);
  };

  const scene = SCENES[sceneIdx];

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-3xl">
      {/* Cadre fenêtre */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(57,255,20,0.25)] bg-[#101913] shadow-[0_0_60px_rgba(57,255,20,0.12)]">
        {/* Barre de titre */}
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <p className="ml-2 text-xs font-bold text-[#9CA3AF]">
            ProSéance — la démo en 21 secondes
          </p>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[rgba(57,255,20,0.12)] px-2 py-0.5 text-[10px] font-black uppercase text-[#39FF14]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#39FF14]" />
            Motion
          </span>
        </div>

        {/* Segments de progression */}
        <div className="flex gap-1.5 px-4 pt-3">
          {SCENES.map((s, i) => {
            const pct =
              i < sceneIdx ? 100 : i > sceneIdx ? 0 : Math.min(100, (sceneElapsed / s.dur) * 100);
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`Aller à la scène ${s.titre}`}
                className="group h-4 flex-1 cursor-pointer"
              >
                <span className="block h-1 w-full overflow-hidden rounded-full bg-white/10 transition-all group-hover:h-1.5">
                  <span
                    className="block h-full rounded-full bg-[#39FF14]"
                    style={{ width: `${pct}%`, transition: 'width 120ms linear' }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        {/* Scène */}
        <div className="relative h-[340px] sm:h-[400px]">
          <div key={`${sceneIdx}-${cycle}`} className="absolute inset-0">
            {scene.id === 'config' && <SceneConfig />}
            {scene.id === 'ia' && <SceneIA />}
            {scene.id === 'plan' && <ScenePlan />}
            {scene.id === 'terrain' && <SceneTerrain />}
          </div>
        </div>

        {/* Légende + contrôles */}
        <div className="flex items-center gap-3 border-t border-white/5 bg-black/40 px-4 py-3">
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Mettre en pause' : 'Lire'}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-sm text-[#0A0F0D] transition-transform hover:scale-110"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-[#39FF14]">{scene.titre}</p>
            <p className="truncate text-xs text-[#9CA3AF] sm:whitespace-normal sm:text-sm">{scene.caption}</p>
          </div>
        </div>
      </div>

      {/* Chapitres */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all sm:text-xs ${
              i === sceneIdx
                ? 'border-[#39FF14] bg-[rgba(57,255,20,0.12)] text-[#39FF14]'
                : 'border-white/10 text-[#9CA3AF] hover:border-[rgba(57,255,20,0.4)] hover:text-[#F3F4F6]'
            }`}
          >
            {s.titre}
          </button>
        ))}
      </div>
    </div>
  );
}
