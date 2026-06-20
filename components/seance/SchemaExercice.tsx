'use client';

/**
 * SchemaExercice — rendu SVG d'un plan d'exercice façon fiche FFF.
 *
 * Conventions graphiques (légende affichée sous le schéma) :
 *  - passe        : flèche en pointillés (trajectoire du ballon)
 *  - deplacement  : flèche pleine (course du joueur sans ballon)
 *  - conduite     : flèche ondulée (conduite de balle / dribble)
 *  - tir          : flèche double épaisse
 */

import type {
  SchemaExercice as SchemaData,
  SchemaFleche,
  TypeFleche,
} from '@/lib/seance/schema';

const COULEURS_EQUIPE: Record<string, { fill: string; stroke: string; text: string }> = {
  A: { fill: '#2563EB', stroke: '#1E3A8A', text: '#fff' },
  B: { fill: '#DC2626', stroke: '#7F1D1D', text: '#fff' },
  J: { fill: '#FACC15', stroke: '#A16207', text: '#1F2937' },
  G: { fill: '#16A34A', stroke: '#14532D', text: '#fff' },
};

const COULEURS_PLOT: Record<string, string> = {
  jaune: '#FACC15',
  orange: '#F97316',
  rouge: '#DC2626',
  bleu: '#2563EB',
  blanc: '#F3F4F6',
};

const COULEURS_FLECHE: Record<TypeFleche, string> = {
  passe: '#111827',
  deplacement: '#2563EB',
  conduite: '#16A34A',
  tir: '#DC2626',
};

const LABELS_FLECHE: Record<TypeFleche, string> = {
  passe: 'Passe',
  deplacement: 'Déplacement',
  conduite: 'Conduite de balle',
  tir: 'Tir',
};

interface Props {
  schema: SchemaData;
  /** Mode impression : fond blanc, traits plus sombres */
  print?: boolean;
}

function fleches(schema: SchemaData): SchemaFleche[] {
  return schema.fleches ?? [];
}

/** Chemin ondulé pour la conduite de balle */
function cheminOndule(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const nx = -dy / len;
  const ny = dx / len;
  const waves = Math.max(2, Math.round(len / 26));
  const amp = 5;
  let d = `M ${x1} ${y1}`;
  for (let i = 1; i <= waves; i++) {
    const t = i / waves;
    const tm = (i - 0.5) / waves;
    const sign = i % 2 === 0 ? 1 : -1;
    const cx = x1 + dx * tm + nx * amp * sign;
    const cy = y1 + dy * tm + ny * amp * sign;
    d += ` Q ${cx} ${cy} ${x1 + dx * t} ${y1 + dy * t}`;
  }
  return d;
}

function teteFleche(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  size = 9
) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const p1 = `${x2},${y2}`;
  const p2 = `${x2 - size * Math.cos(a - 0.45)},${y2 - size * Math.sin(a - 0.45)}`;
  const p3 = `${x2 - size * Math.cos(a + 0.45)},${y2 - size * Math.sin(a + 0.45)}`;
  return <polygon points={`${p1} ${p2} ${p3}`} fill={color} />;
}

export function SchemaExercice({ schema, print = false }: Props) {
  const { terrain } = schema;
  const ratio = Math.min(Math.max(terrain.largeur / terrain.longueur, 0.45), 1.2);
  const W = 640;
  const H = Math.round(W * ratio);
  const PAD = 34;
  const FW = W - PAD * 2;
  const FH = H - PAD * 2;

  const px = (x: number) => PAD + (x / 100) * FW;
  const py = (y: number) => PAD + (y / 100) * FH;

  const herbe1 = print ? '#EAF5EA' : '#2F7A3D';
  const herbe2 = print ? '#E0F0E0' : '#2A6E37';
  const ligne = print ? '#374151' : 'rgba(255,255,255,0.85)';

  const R = Math.max(11, Math.min(15, FW / 38)); // rayon joueur

  const typesPresents = new Set(fleches(schema).map((f) => f.type));
  const equipesPresentes = new Set(schema.joueurs.map((j) => j.equipe));

  const BANDES = 6;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg"
        style={{
          background: print ? '#fff' : '#1A2E1A',
          border: print ? '1px solid #D1D5DB' : '1px solid rgba(255,255,255,0.12)',
        }}
        role="img"
        aria-label="Schéma de l'exercice"
      >
        {/* Pelouse */}
        {Array.from({ length: BANDES }).map((_, i) => (
          <rect
            key={i}
            x={PAD + (i * FW) / BANDES}
            y={PAD}
            width={FW / BANDES}
            height={FH}
            fill={i % 2 === 0 ? herbe1 : herbe2}
          />
        ))}

        {/* Bordure de l'espace de travail */}
        <rect x={PAD} y={PAD} width={FW} height={FH} fill="none" stroke={ligne} strokeWidth={2.5} />

        {/* Cotes (dimensions en mètres) */}
        <text
          x={PAD + FW / 2}
          y={PAD - 10}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill={print ? '#111827' : '#FACC15'}
          fontFamily="Arial, sans-serif"
        >
          {terrain.longueur} m
        </text>
        <text
          x={PAD - 10}
          y={PAD + FH / 2}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fill={print ? '#111827' : '#FACC15'}
          fontFamily="Arial, sans-serif"
          transform={`rotate(-90 ${PAD - 10} ${PAD + FH / 2})`}
        >
          {terrain.largeur} m
        </text>

        {/* Zones */}
        {(schema.zones ?? []).map((z, i) => {
          const zx = px(z.x);
          const zy = py(z.y);
          const zw = (z.largeur / 100) * FW;
          const zh = (z.hauteur / 100) * FH;
          return (
            <g key={`z${i}`}>
              <rect
                x={zx}
                y={zy}
                width={zw}
                height={zh}
                fill={print ? 'rgba(250,204,21,0.15)' : 'rgba(250,204,21,0.12)'}
                stroke="#EAB308"
                strokeWidth={1.6}
                strokeDasharray="7,5"
              />
              {z.label && (
                <text
                  x={zx + zw / 2}
                  y={zy + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={print ? '#854D0E' : '#FDE68A'}
                  fontFamily="Arial, sans-serif"
                >
                  {z.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Buts */}
        {(schema.buts ?? []).map((b, i) => {
          const bx = px(b.x);
          const by = py(b.y);
          const demi = b.taille === 'grand' ? Math.max(22, FH * 0.11) : Math.max(12, FH * 0.06);
          const prof = b.taille === 'grand' ? 14 : 9;
          let d = '';
          if (b.orientation === 'gauche')
            d = `M ${bx} ${by - demi} h ${-prof} v ${demi * 2} h ${prof}`;
          else if (b.orientation === 'droite')
            d = `M ${bx} ${by - demi} h ${prof} v ${demi * 2} h ${-prof}`;
          else if (b.orientation === 'haut')
            d = `M ${bx - demi} ${by} v ${-prof} h ${demi * 2} v ${prof}`;
          else d = `M ${bx - demi} ${by} v ${prof} h ${demi * 2} v ${-prof}`;
          return (
            <path
              key={`b${i}`}
              d={d}
              fill={print ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.15)'}
              stroke={print ? '#111827' : '#fff'}
              strokeWidth={3}
            />
          );
        })}

        {/* Flèches */}
        {fleches(schema).map((f, i) => {
          const x1 = px(f.de.x);
          const y1 = py(f.de.y);
          const x2 = px(f.vers.x);
          const y2 = py(f.vers.y);
          const c = print && f.type === 'passe' ? '#111827' : COULEURS_FLECHE[f.type];
          if (f.type === 'conduite') {
            return (
              <g key={`f${i}`}>
                <path
                  d={cheminOndule(x1, y1, x2, y2)}
                  fill="none"
                  stroke={c}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
                {teteFleche(x1, y1, x2, y2, c)}
              </g>
            );
          }
          if (f.type === 'tir') {
            const a = Math.atan2(y2 - y1, x2 - x1);
            const off = 2.4;
            const ox = -Math.sin(a) * off;
            const oy = Math.cos(a) * off;
            return (
              <g key={`f${i}`}>
                <line x1={x1 + ox} y1={y1 + oy} x2={x2 + ox} y2={y2 + oy} stroke={c} strokeWidth={2.4} />
                <line x1={x1 - ox} y1={y1 - oy} x2={x2 - ox} y2={y2 - oy} stroke={c} strokeWidth={2.4} />
                {teteFleche(x1, y1, x2, y2, c, 12)}
              </g>
            );
          }
          return (
            <g key={`f${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={f.type === 'passe' && !print ? '#F9FAFB' : c}
                strokeWidth={2.6}
                strokeDasharray={f.type === 'passe' ? '8,6' : undefined}
                strokeLinecap="round"
              />
              {teteFleche(x1, y1, x2, y2, f.type === 'passe' && !print ? '#F9FAFB' : c)}
            </g>
          );
        })}

        {/* Plots (coupelles) */}
        {(schema.plots ?? []).map((p, i) => {
          const cx = px(p.x);
          const cy = py(p.y);
          const s = 7;
          return (
            <polygon
              key={`p${i}`}
              points={`${cx},${cy - s} ${cx - s},${cy + s * 0.8} ${cx + s},${cy + s * 0.8}`}
              fill={COULEURS_PLOT[p.couleur ?? 'jaune']}
              stroke="rgba(0,0,0,0.45)"
              strokeWidth={1}
            />
          );
        })}

        {/* Ballons */}
        {(schema.ballons ?? []).map((b, i) => {
          const cx = px(b.x);
          const cy = py(b.y);
          return (
            <g key={`bl${i}`}>
              <circle cx={cx} cy={cy} r={6} fill="#fff" stroke="#111827" strokeWidth={1.4} />
              <path
                d={`M ${cx - 2.6} ${cy - 1.6} L ${cx + 2.6} ${cy - 1.6} L ${cx} ${cy + 2.8} Z`}
                fill="#111827"
              />
            </g>
          );
        })}

        {/* Joueurs */}
        {schema.joueurs.map((j, i) => {
          const cx = px(j.x);
          const cy = py(j.y);
          const c = COULEURS_EQUIPE[j.equipe] ?? COULEURS_EQUIPE.A;
          return (
            <g key={`j${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={R}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={2}
              />
              {j.label && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={j.label.length > 2 ? 9 : 11}
                  fontWeight={700}
                  fill={c.text}
                  fontFamily="Arial, sans-serif"
                  style={{ userSelect: 'none' }}
                >
                  {j.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div
        className={`mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-md px-3 py-2 text-[11px] ${
          print
            ? 'border border-gray-300 bg-gray-50 text-gray-700'
            : 'border border-white/10 bg-black/30 text-gray-200'
        }`}
      >
        {equipesPresentes.has('A') && <LegendeJoueur couleur="#2563EB" label="Équipe A" />}
        {equipesPresentes.has('B') && <LegendeJoueur couleur="#DC2626" label="Équipe B" />}
        {equipesPresentes.has('J') && <LegendeJoueur couleur="#FACC15" label="Joker" />}
        {equipesPresentes.has('G') && <LegendeJoueur couleur="#16A34A" label="Gardien" />}
        {(['passe', 'deplacement', 'conduite', 'tir'] as TypeFleche[])
          .filter((t) => typesPresents.has(t))
          .map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <svg width="26" height="10" viewBox="0 0 26 10">
                {t === 'conduite' ? (
                  <path
                    d="M1 5 Q 5 1 9 5 Q 13 9 17 5 Q 19 3 21 5"
                    fill="none"
                    stroke={COULEURS_FLECHE[t]}
                    strokeWidth={1.8}
                  />
                ) : t === 'tir' ? (
                  <>
                    <line x1="1" y1="3.5" x2="20" y2="3.5" stroke={COULEURS_FLECHE[t]} strokeWidth={1.6} />
                    <line x1="1" y1="6.5" x2="20" y2="6.5" stroke={COULEURS_FLECHE[t]} strokeWidth={1.6} />
                  </>
                ) : (
                  <line
                    x1="1"
                    y1="5"
                    x2="20"
                    y2="5"
                    stroke={print && t === 'passe' ? '#111827' : COULEURS_FLECHE[t]}
                    strokeWidth={1.8}
                    strokeDasharray={t === 'passe' ? '4,3' : undefined}
                  />
                )}
                <polygon points="26,5 19,1.5 19,8.5" fill={print && t === 'passe' ? '#111827' : COULEURS_FLECHE[t]} />
              </svg>
              {LABELS_FLECHE[t]}
            </span>
          ))}
        {(schema.plots ?? []).length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <svg width="12" height="11" viewBox="0 0 12 11">
              <polygon points="6,1 1,10 11,10" fill="#FACC15" stroke="rgba(0,0,0,0.4)" />
            </svg>
            Coupelle
          </span>
        )}
      </div>
    </div>
  );
}

function LegendeJoueur({ couleur, label }: { couleur: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-full border border-black/30"
        style={{ backgroundColor: couleur }}
      />
      {label}
    </span>
  );
}
