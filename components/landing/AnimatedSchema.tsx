'use client';

/**
 * AnimatedSchema — un exercice FFF qui se joue tout seul.
 *
 * Scénario (≈ 5,5 s, à remonter via `key` pour rejouer) :
 *   1. l'espace et les plots apparaissent,
 *   2. les joueurs se placent,
 *   3. passe → conduite → tir : les flèches se dessinent pendant que le
 *      ballon suit l'action (SMIL animateMotion),
 *   4. « BUT ! ».
 */

const CSS = (v: Record<string, string | number>) => v as React.CSSProperties;

interface Props {
  /** Libellé sous le schéma */
  caption?: boolean;
}

export function AnimatedSchema({ caption = true }: Props) {
  // Acteurs (viewBox 600 × 380)
  const A1 = { x: 110, y: 120 };
  const A2 = { x: 230, y: 250 };
  const A3 = { x: 330, y: 110 };
  const D1 = { x: 360, y: 210 };
  const D2 = { x: 430, y: 140 };
  const GB = { x: 545, y: 190 };
  const SHOT = { x: 528, y: 178 };
  const CONDUITE_END = { x: 420, y: 235 };

  const ballPath =
    `M ${A1.x + 16} ${A1.y + 10} ` +
    `L ${A2.x} ${A2.y - 14} ` +
    `Q ${320} ${255} ${CONDUITE_END.x} ${CONDUITE_END.y} ` +
    `L ${SHOT.x} ${SHOT.y}`;

  const joueurs = [
    { ...A1, equipe: 'A', label: 'A1', delay: 0.9 },
    { ...A2, equipe: 'A', label: 'A2', delay: 1.05 },
    { ...A3, equipe: 'A', label: 'A3', delay: 1.2 },
    { ...D1, equipe: 'B', label: 'D1', delay: 1.35 },
    { ...D2, equipe: 'B', label: 'D2', delay: 1.5 },
    { ...GB, equipe: 'G', label: 'GB', delay: 1.65 },
  ];

  const plots = [
    { x: 40, y: 40 },
    { x: 560, y: 40 },
    { x: 40, y: 340 },
    { x: 560, y: 340 },
    { x: 300, y: 40 },
    { x: 300, y: 340 },
  ];

  return (
    <div className="w-full">
      <svg viewBox="0 0 600 380" className="w-full rounded-xl" role="img" aria-label="Exercice animé : transition 3 contre 2 et finition">
        <defs>
          <filter id="as-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Espace de travail */}
        <rect x="0" y="0" width="600" height="380" rx="14" fill="#13290F" />
        {Array.from({ length: 5 }).map((_, i) => (
          <rect key={i} x={i * 120} y="0" width="60" height="380" fill="#fff" opacity="0.018" />
        ))}
        <rect
          x="28" y="28" width="544" height="324"
          fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5"
          className="anim-pop-el"
          style={CSS({ '--pop-delay': '0.1s' })}
        />
        <text x="300" y="20" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#FACC15" fontFamily="Arial" className="anim-pop-el" style={CSS({ '--pop-delay': '0.3s' })}>
          40 m × 30 m
        </text>

        {/* Plots */}
        {plots.map((p, i) => (
          <polygon
            key={i}
            points={`${p.x},${p.y - 8} ${p.x - 8},${p.y + 7} ${p.x + 8},${p.y + 7}`}
            fill="#FACC15"
            stroke="rgba(0,0,0,0.45)"
            className="anim-pop-el"
            style={CSS({ '--pop-delay': `${0.3 + i * 0.09}s` })}
          />
        ))}

        {/* But + gardien */}
        <path
          d="M 572 152 h 14 v 76 h -14"
          fill="rgba(255,255,255,0.12)"
          stroke="#fff"
          strokeWidth="3"
          className="anim-pop-el"
          style={CSS({ '--pop-delay': '0.7s' })}
        />

        {/* Flèches de l'action */}
        {/* Passe A1 → A2 (pointillés) */}
        <line
          x1={A1.x + 16} y1={A1.y + 10} x2={A2.x - 6} y2={A2.y - 16}
          stroke="#F9FAFB" strokeWidth="3" strokeDasharray="9,7" strokeLinecap="round"
          className="anim-draw"
          style={CSS({ '--line-len': 180, '--draw-dur': '0.55s', '--draw-delay': '2.1s' })}
        />
        {/* Conduite A2 → intérieur (ondulée) */}
        <path
          d="M 236 240 Q 280 268 320 250 Q 370 230 416 238"
          fill="none" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round"
          className="anim-draw"
          style={CSS({ '--line-len': 200, '--draw-dur': '0.8s', '--draw-delay': '2.8s' })}
        />
        {/* Tir (double trait) */}
        <line x1={CONDUITE_END.x} y1={CONDUITE_END.y - 3} x2={SHOT.x} y2={SHOT.y - 3}
          stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"
          className="anim-draw"
          style={CSS({ '--line-len': 130, '--draw-dur': '0.3s', '--draw-delay': '3.8s' })}
        />
        <line x1={CONDUITE_END.x} y1={CONDUITE_END.y + 4} x2={SHOT.x} y2={SHOT.y + 4}
          stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"
          className="anim-draw"
          style={CSS({ '--line-len': 130, '--draw-dur': '0.3s', '--draw-delay': '3.8s' })}
        />
        {/* Appel de A3 (déplacement, trait plein bleu) */}
        <line
          x1={A3.x} y1={A3.y + 18} x2={470} y2={250}
          stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"
          className="anim-draw"
          style={CSS({ '--line-len': 210, '--draw-dur': '0.9s', '--draw-delay': '2.9s' })}
        />

        {/* Joueurs */}
        {joueurs.map((j, i) => {
          const fill = j.equipe === 'A' ? '#2563EB' : j.equipe === 'B' ? '#DC2626' : '#16A34A';
          const stroke = j.equipe === 'A' ? '#1E3A8A' : j.equipe === 'B' ? '#7F1D1D' : '#14532D';
          return (
            <g key={i} className="anim-pop-el" style={CSS({ '--pop-delay': `${j.delay}s` })}>
              <circle cx={j.x} cy={j.y} r="15" fill={fill} stroke={stroke} strokeWidth="2.5" />
              <text x={j.x} y={j.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff" fontFamily="Arial">
                {j.label}
              </text>
            </g>
          );
        })}

        {/* Ballon : suit passe → conduite → tir */}
        <g filter="url(#as-glow)" className="anim-pop-el" style={CSS({ '--pop-delay': '1.9s' })}>
          <circle r="7" fill="#fff" stroke="#111" strokeWidth="1.5">
            <animateMotion begin="2.1s" dur="2.1s" fill="freeze" path={ballPath} />
          </circle>
          <circle r="2.4" fill="#111">
            <animateMotion begin="2.1s" dur="2.1s" fill="freeze" path={ballPath} />
          </circle>
        </g>

        {/* BUT ! */}
        <g className="anim-pop-el" style={CSS({ '--pop-delay': '4.25s' })}>
          <circle cx={SHOT.x + 14} cy={SHOT.y} r="26" fill="none" stroke="#39FF14" strokeWidth="2" className="anim-pulse-ring" style={CSS({ '--ring-delay': '4.3s' })} />
          <rect x="455" y="92" width="104" height="34" rx="17" fill="#39FF14" />
          <text x="507" y="115" textAnchor="middle" fontSize="17" fontWeight="900" fill="#0A0F0D" fontFamily="Arial">
            BUT !
          </text>
        </g>
      </svg>

      {caption && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-md border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] text-gray-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-gray-100" /> Passe
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[#16A34A]" /> Conduite
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[#60A5FA]" /> Déplacement
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1 w-5 border-y-2 border-[#DC2626]" /> Tir
          </span>
        </div>
      )}
    </div>
  );
}
