'use client';

/**
 * TacticalDiagram — rendu fidèle du JSON généré par Gemini
 *
 * x=0 gauche, x=100 droite, y=0 haut, y=100 bas (% du terrain)
 *
 * Props optionnelles :
 *   zoneWidth  — largeur de la zone d'exercice en mètres (ex: 30)
 *   zoneHeight — hauteur de la zone d'exercice en mètres (ex: 20)
 *
 * Quand elles sont fournies :
 *   - Un rectangle aux bonnes proportions est tracé sur le terrain (centré)
 *   - Les coordonnées joueurs (0-100) sont remappées à l'intérieur de la zone
 *   - Les dimensions sont affichées sur le schéma
 */

const PITCH_WIDTH_M  = 105;
const PITCH_HEIGHT_M = 68;

interface Player {
  x: number;
  y: number;
  number?: number;
  team: 'attaque' | 'défense';
  role?: string;
}

interface Movement {
  from: { x: number; y: number };
  to:   { x: number; y: number };
  style?: 'dribble' | 'passe' | 'déplacement';
  label?: string;
}

interface TacticalDiagramProps {
  title?:      string;
  players:     Player[];
  movements?:  Movement[];
  showGrid?:   boolean;
  width?:      number;
  height?:     number;
  /** Largeur de la zone d'exercice en mètres (ex: 30) */
  zoneWidth?:  number;
  /** Hauteur de la zone d'exercice en mètres (ex: 20) */
  zoneHeight?: number;
}

function arrowHead(x1: number, y1: number, x2: number, y2: number, color: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const AL = 9, AW = 4;
  const ax1 = x2 - AL * Math.cos(angle) + AW * Math.sin(angle);
  const ay1 = y2 - AL * Math.sin(angle) - AW * Math.cos(angle);
  const ax2 = x2 - AL * Math.cos(angle) - AW * Math.sin(angle);
  const ay2 = y2 - AL * Math.sin(angle) + AW * Math.cos(angle);
  return <polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} opacity={0.95} />;
}

function shorten(x1: number, y1: number, x2: number, y2: number, r = 13) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < r * 2 + 2) return { x1, y1, x2, y2 };
  const f = (len - r) / len;
  return { x1: x1 + (dx / len) * r, y1: y1 + (dy / len) * r, x2: x1 + dx * f, y2: y1 + dy * f };
}

export function TacticalDiagram({
  title,
  players,
  movements = [],
  width  = 500,
  height = 320,
  zoneWidth,
  zoneHeight,
}: TacticalDiagramProps) {
  const W = width;
  const H = height;
  const PAD = 16;
  const FW = W - PAD * 2;
  const FH = H - PAD * 2;

  // ── Zone d'exercice ─────────────────────────────────────────────────────────
  const hasZone = zoneWidth != null && zoneHeight != null && zoneWidth > 0 && zoneHeight > 0;
  const zoneRatioW = hasZone ? Math.min(zoneWidth!  / PITCH_WIDTH_M,  1) : 1;
  const zoneRatioH = hasZone ? Math.min(zoneHeight! / PITCH_HEIGHT_M, 1) : 1;
  const zonePxW    = FW * zoneRatioW;
  const zonePxH    = FH * zoneRatioH;
  // Centrée sur le terrain
  const zoneOriginX = PAD + (FW - zonePxW) / 2;
  const zoneOriginY = PAD + (FH - zonePxH) / 2;

  // Conversion % → px  (remappé dans la zone si dimensions fournies)
  const px = (x: number) => hasZone ? zoneOriginX + (x / 100) * zonePxW : PAD + (x / 100) * FW;
  const py = (y: number) => hasZone ? zoneOriginY + (y / 100) * zonePxH : PAD + (y / 100) * FH;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const STRIPES = 8;
  const sw = FW / STRIPES;

  const movementStyle = (style?: string) => {
    if (style === 'passe' || !style)  return { color: '#F5A623', dash: 'none', width: 2 };
    if (style === 'dribble')          return { color: '#39FF14', dash: '7,3',  width: 2 };
    if (style === 'déplacement')      return { color: 'rgba(255,255,255,0.6)', dash: '4,3', width: 1.5 };
    return { color: '#F5A623', dash: 'none', width: 2 };
  };

  const teamColors = {
    attaque: { body: '#F5A623', border: '#c47d00' },
    défense: { body: '#E8501A', border: '#a83010' },
  };

  const hasAtt   = players.some(p => p.team === 'attaque');
  const hasDef   = players.some(p => p.team === 'défense');
  const hasPasse = movements.some(m => m.style === 'passe' || !m.style);
  const hasDrib  = movements.some(m => m.style === 'dribble');
  const hasDep   = movements.some(m => m.style === 'déplacement');

  // Label largeur de la zone — largeur dynamique selon texte
  const zoneLabel = hasZone ? `${zoneWidth}m × ${zoneHeight}m` : null;
  const labelW    = hasZone ? Math.max(44, String(zoneLabel).length * 5.2) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      {title && (
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#39FF14]/60 text-center">
          {title}
        </p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-xl overflow-hidden"
        style={{ maxWidth: W, border: '1.5px solid rgba(57,255,20,0.18)', background: '#0d180d' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="td-shadow">
            <feDropShadow dx="0.8" dy="1.2" stdDeviation="1.8" floodColor="#000" floodOpacity="0.6" />
          </filter>
          <filter id="td-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="zone-glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── GAZON ── */}
        {Array.from({ length: STRIPES }).map((_, i) => (
          <rect key={`gs${i}`} x={PAD + i * sw} y={PAD} width={sw} height={FH}
            fill={i % 2 === 0 ? '#2a6430' : '#245a2a'} />
        ))}

        {/* ── TERRAIN : lignes ── */}
        <rect x={PAD} y={PAD} width={FW} height={FH} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" />
        <line x1={PAD + FW/2} y1={PAD} x2={PAD + FW/2} y2={PAD + FH} stroke="rgba(255,255,255,0.65)" strokeWidth="1.2" />
        <circle cx={PAD + FW/2} cy={PAD + FH/2} r={Math.min(FW, FH) * 0.115} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
        <circle cx={PAD + FW/2} cy={PAD + FH/2} r="3" fill="rgba(255,255,255,0.75)" />
        {/* Surface gauche */}
        <rect x={PAD}              y={PAD + FH*0.28} width={FW*0.145} height={FH*0.44} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <rect x={PAD}              y={PAD + FH*0.38} width={FW*0.065} height={FH*0.24} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        {/* Surface droite */}
        <rect x={PAD + FW*0.855}   y={PAD + FH*0.28} width={FW*0.145} height={FH*0.44} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <rect x={PAD + FW*0.935}   y={PAD + FH*0.38} width={FW*0.065} height={FH*0.24} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        {/* Buts */}
        <rect x={PAD - 6}          y={PAD + FH*0.41} width="6" height={FH*0.18} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <rect x={PAD + FW}         y={PAD + FH*0.41} width="6" height={FH*0.18} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />

        {/* ── ZONE D'EXERCICE ── */}
        {hasZone && (
          <g>
            {/* Fond légèrement éclairé */}
            <rect x={zoneOriginX} y={zoneOriginY} width={zonePxW} height={zonePxH}
              fill="rgba(255,230,50,0.07)" />
            {/* Bordure pointillée jaune avec glow */}
            <rect x={zoneOriginX} y={zoneOriginY} width={zonePxW} height={zonePxH}
              fill="none" stroke="#FFE234" strokeWidth="1.8" strokeDasharray="6,3"
              filter="url(#zone-glow)" opacity={0.9} />
            {/* Coins marqués */}
            {([[zoneOriginX, zoneOriginY],[zoneOriginX+zonePxW, zoneOriginY],[zoneOriginX, zoneOriginY+zonePxH],[zoneOriginX+zonePxW, zoneOriginY+zonePxH]] as [number,number][]).map(([cx,cy], i) => (
              <circle key={`zc${i}`} cx={cx} cy={cy} r="2.5" fill="#FFE234" opacity={0.85} />
            ))}
            {/* Badge dimensions centré en haut */}
            <rect
              x={zoneOriginX + zonePxW/2 - labelW/2}
              y={zoneOriginY - 12}
              width={labelW} height={11} rx="3"
              fill="rgba(0,0,0,0.78)"
            />
            <text
              x={zoneOriginX + zonePxW/2} y={zoneOriginY - 4}
              textAnchor="middle" fontSize="7" fontWeight="bold"
              fill="#FFE234" fontFamily="Arial, sans-serif"
            >
              {zoneLabel}
            </text>
          </g>
        )}

        {/* ── MOUVEMENTS ── */}
        {movements.map((mov, idx) => {
          const x1r = px(mov.from.x), y1r = py(mov.from.y);
          const x2r = px(mov.to.x),   y2r = py(mov.to.y);
          const { x1, y1, x2, y2 } = shorten(x1r, y1r, x2r, y2r, 13);
          const { color, dash, width: lw } = movementStyle(mov.style);
          return (
            <g key={`mv${idx}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color} strokeWidth={lw}
                strokeDasharray={dash === 'none' ? undefined : dash} opacity={0.9} />
              {arrowHead(x1, y1, x2, y2, color)}
            </g>
          );
        })}

        {/* ── JOUEURS ── */}
        {players.map((player, idx) => {
          const x   = px(player.x);
          const y   = py(player.y);
          const col = teamColors[player.team] ?? teamColors.attaque;
          const R   = 11;
          return (
            <g key={`pl${idx}`} filter="url(#td-shadow)">
              <circle cx={x} cy={y} r={R} fill={col.body} stroke={col.border} strokeWidth="1.5" />
              <circle cx={x - R*0.28} cy={y - R*0.28} r={R*0.38} fill="rgba(255,255,255,0.18)" />
              <circle cx={x} cy={y - R - 5} r={4.5} fill="#F5CBA7" stroke={col.border} strokeWidth="1" />
              {player.number !== undefined && (
                <text x={x} y={y+0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {player.number}
                </text>
              )}
            </g>
          );
        })}

        {/* ── LÉGENDE ── */}
        {(() => {
          const items: { color: string; dash?: string; label: string; isCircle?: boolean }[] = [];
          if (hasAtt)   items.push({ color: '#F5A623', label: 'Attaque', isCircle: true });
          if (hasDef)   items.push({ color: '#E8501A', label: 'Défense', isCircle: true });
          if (hasPasse) items.push({ color: '#F5A623', dash: 'none', label: 'Passe' });
          if (hasDrib)  items.push({ color: '#39FF14', dash: '7,3',  label: 'Dribble' });
          if (hasDep)   items.push({ color: 'rgba(255,255,255,0.6)', dash: '4,3', label: 'Déplacement' });
          const itemW = 62;
          const legendW = items.length * itemW + 8;
          const lx = PAD + 4;
          const ly = PAD + FH - 16;
          return (
            <g>
              <rect x={lx} y={ly} width={legendW} height={13} rx="3" fill="rgba(0,0,0,0.6)" />
              {items.map((item, i) => {
                const ix = lx + 6 + i * itemW;
                const iy = ly + 6.5;
                if (item.isCircle) return (
                  <g key={`lg${i}`}>
                    <circle cx={ix+5} cy={iy} r={4.5} fill={item.color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.8" />
                    <text x={ix+12} y={iy+3.5} fontSize="7" fill="rgba(255,255,255,0.85)" fontFamily="Arial">{item.label}</text>
                  </g>
                );
                return (
                  <g key={`lg${i}`}>
                    <line x1={ix+2} y1={iy} x2={ix+16} y2={iy} stroke={item.color} strokeWidth="1.8" strokeDasharray={item.dash === 'none' ? undefined : item.dash} />
                    <polygon points={`${ix+16},${iy} ${ix+12},${iy-2.5} ${ix+12},${iy+2.5}`} fill={item.color} />
                    <text x={ix+19} y={iy+3.5} fontSize="7" fill="rgba(255,255,255,0.85)" fontFamily="Arial">{item.label}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
