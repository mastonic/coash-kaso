'use client';

/**
 * StatsBand — compteurs animés au scroll + bandeau défilant des thèmes.
 */

import { useEffect, useRef, useState } from 'react';
import { THEMES } from '@/lib/seance/schema';

function Counter({
  to,
  suffix = '',
  duration = 1400,
  started,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  started: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration]);

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

const STATS = [
  { to: 30, suffix: ' s', label: 'pour une séance complète' },
  { to: 4, suffix: '', label: 'phases — méthodologie FFF' },
  { to: 10, suffix: '', label: 'thèmes de travail' },
  { to: 100, suffix: ' %', label: 'utilisable hors-ligne (PWA)' },
];

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="border-y border-[rgba(57,255,20,0.12)] bg-[#0D1410]">
      {/* Compteurs */}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4 md:py-12">
        {STATS.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-3xl font-black text-[#39FF14] md:text-5xl">
              <Counter to={s.to} suffix={s.suffix} started={started} duration={1200 + i * 250} />
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF] md:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Marquee des thèmes */}
      <div className="overflow-hidden border-t border-[rgba(57,255,20,0.08)] py-3">
        <div className="anim-marquee flex w-max gap-3">
          {[...THEMES, ...THEMES].map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap rounded-full border border-[rgba(57,255,20,0.2)] bg-[rgba(57,255,20,0.05)] px-4 py-1.5 text-xs font-bold text-[#9CA3AF]"
            >
              ⚽ {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
