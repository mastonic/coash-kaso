'use client';

/**
 * HeroPitch — terrain tactique animé du héros.
 *
 * Un rondo vivant : le ballon circule en boucle entre les joueurs
 * (SMIL animateMotion), chaque passe se dessine au passage du ballon
 * (keyframe heroPass synchronisée sur la même période de 9 s).
 */

// Positions des 6 attaquants (viewBox 600 × 400)
const ATT = [
  { x: 440, y: 200 },
  { x: 372, y: 102 },
  { x: 228, y: 102 },
  { x: 160, y: 200 },
  { x: 228, y: 298 },
  { x: 372, y: 298 },
];

// Ordre de circulation du ballon (indices dans ATT) — passes croisées
const SEQ = [0, 2, 4, 1, 3, 5];

const PERIOD = 9; // secondes — doit rester aligné avec heroPass (globals.css)

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function HeroPitch() {
  // Chemin fermé du ballon à travers la séquence
  const pts = SEQ.map((i) => ATT[i]);
  const ballPath =
    `M ${pts[0].x} ${pts[0].y} ` +
    pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${pts[0].x} ${pts[0].y}`;

  // Segments de passe + délai proportionnel à la distance parcourue
  const totalLen = pts.reduce(
    (acc, p, i) => acc + dist(p, pts[(i + 1) % pts.length]),
    0
  );
  let traveled = 0;
  const passes = pts.map((p, i) => {
    const next = pts[(i + 1) % pts.length];
    const delay = (traveled / totalLen) * PERIOD;
    traveled += dist(p, next);
    return { from: p, to: next, delay, len: Math.ceil(dist(p, next)) };
  });

  return (
    <svg
      viewBox="0 0 600 400"
      className="w-full"
      role="img"
      aria-label="Animation : circulation de balle en rondo"
    >
      <defs>
        <filter id="hp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="hp-grass" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#16301B" />
          <stop offset="100%" stopColor="#0C1810" />
        </radialGradient>
      </defs>

      {/* Pelouse */}
      <rect x="0" y="0" width="600" height="400" rx="18" fill="url(#hp-grass)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={i}
          x={20 + i * 93.5}
          y="20"
          width="46.75"
          height="360"
          fill="#39FF14"
          opacity="0.025"
        />
      ))}

      {/* Lignes du terrain */}
      <rect x="20" y="20" width="560" height="360" rx="8" fill="none" stroke="rgba(57,255,20,0.35)" strokeWidth="2" />
      <line x1="300" y1="20" x2="300" y2="380" stroke="rgba(57,255,20,0.22)" strokeWidth="1.5" />
      <circle cx="300" cy="200" r="58" fill="none" stroke="rgba(57,255,20,0.22)" strokeWidth="1.5" />
      <rect x="20" y="120" width="70" height="160" fill="none" stroke="rgba(57,255,20,0.16)" strokeWidth="1.5" />
      <rect x="510" y="120" width="70" height="160" fill="none" stroke="rgba(57,255,20,0.16)" strokeWidth="1.5" />

      {/* Passes : se dessinent au rythme du ballon */}
      {passes.map((p, i) => (
        <line
          key={i}
          x1={p.from.x}
          y1={p.from.y}
          x2={p.to.x}
          y2={p.to.y}
          stroke="#39FF14"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="anim-hero-pass"
          style={
            {
              '--line-len': p.len,
              '--pass-delay': `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Défenseurs (centre) */}
      {[
        { x: 268, y: 188 },
        { x: 332, y: 215 },
      ].map((d, i) => (
        <g key={`d${i}`} className={i === 0 ? 'animate-float-slow' : 'animate-float'}>
          <circle cx={d.x} cy={d.y} r="13" fill="#E8501A" stroke="#7F1D1D" strokeWidth="2" />
          <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff" fontFamily="Arial">
            {i + 1}
          </text>
        </g>
      ))}

      {/* Attaquants */}
      {ATT.map((p, i) => (
        <g key={`a${i}`}>
          <circle cx={p.x} cy={p.y} r="20" fill="none" stroke="#39FF14" strokeWidth="1.5" opacity="0.5" className="anim-pulse-ring" style={{ '--ring-delay': `${i * 0.27}s` } as React.CSSProperties} />
          <circle cx={p.x} cy={p.y} r="14" fill="#39FF14" stroke="#0E3D0A" strokeWidth="2.5" filter="url(#hp-glow)" />
          <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0A0F0D" fontFamily="Arial">
            {i + 1}
          </text>
        </g>
      ))}

      {/* Ballon */}
      <g filter="url(#hp-glow)">
        <circle r="7.5" fill="#fff" stroke="#111" strokeWidth="1.5">
          <animateMotion dur={`${PERIOD}s`} repeatCount="indefinite" path={ballPath} />
        </circle>
        <circle r="2.6" fill="#111">
          <animateMotion dur={`${PERIOD}s`} repeatCount="indefinite" path={ballPath} />
        </circle>
      </g>

      {/* Badge méthodologie */}
      <g>
        <rect x="380" y="338" width="196" height="34" rx="17" fill="rgba(10,15,13,0.85)" stroke="rgba(57,255,20,0.4)" />
        <circle cx="402" cy="355" r="5" fill="#39FF14">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <text x="416" y="360" fontSize="13" fontWeight="bold" fill="#F3F4F6" fontFamily="Arial">
          Méthodologie FFF — live
        </text>
      </g>
    </svg>
  );
}
