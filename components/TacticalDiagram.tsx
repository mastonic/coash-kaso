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

function arrowHead(x1: number, y1: number, x2: number, y2: number, color: string, METER: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const AL = 1.5 * METER, AW = 0.8 * METER;
  const ax1 = x2 - AL * Math.cos(angle) + AW * Math.sin(angle);
  const ay1 = y2 - AL * Math.sin(angle) - AW * Math.cos(angle);
  const ax2 = x2 - AL * Math.cos(angle) - AW * Math.sin(angle);
  const ay2 = y2 - AL * Math.sin(angle) + AW * Math.cos(angle);
  return <polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} opacity={0.95} />;
}

function shorten(x1: number, y1: number, x2: number, y2: number, r: number) {
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
  const METER = FW / PITCH_WIDTH_M;

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

  // ── Calcul de la ViewBox (Zoom intelligent) ─────────────────────────────────
  let vbX = 0, vbY = 0, vbW = W, vbH = H;
  if (hasZone) {
    // 15% padding autour de la zone
    const padW = zonePxW * 0.15;
    const padH = zonePxH * 0.15;
    const rawVbW = zonePxW + 2 * padW;
    const rawVbH = zonePxH + 2 * padH;
    const rawVbX = zoneOriginX - padW;
    const rawVbY = zoneOriginY - padH;

    const targetRatio = W / H;
    const currentRatio = rawVbW / rawVbH;

    if (currentRatio < targetRatio) {
      vbH = rawVbH;
      vbW = rawVbH * targetRatio;
    } else {
      vbW = rawVbW;
      vbH = rawVbW / targetRatio;
    }
    vbX = rawVbX - (vbW - rawVbW) / 2;
    vbY = rawVbY - (vbH - rawVbH) / 2;
  }

  // Échelle de rendu (combien d'unités SVG = 1 pixel d'écran)
  const scale = vbW / W;

  // Taille réaliste du joueur: ~1m80 de diamètre sur un terrain de 105m
  const playerDiameterCoord = 1.8 * METER;
  const MIN_SCREEN_RADIUS = 6; // En pixels pour assurer une visibilité de base quand non zoomé
  const R = Math.max(playerDiameterCoord / 2, MIN_SCREEN_RADIUS * scale);

  // Épaisseur des lignes de mouvement proportionnelle
  const LINE_WIDTH = 0.4 * METER;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const STRIPES = 8;
  const sw = FW / STRIPES;

  const movementStyle = (style?: string) => {
    if (style === 'passe' || !style)  return { color: '#F5A623', dash: 'none', width: LINE_WIDTH };
    if (style === 'dribble')          return { color: '#39FF14', dash: `${1.5*METER},${1*METER}`, width: LINE_WIDTH };
    if (style === 'déplacement')      return { color: 'rgba(255,255,255,0.6)', dash: `${1*METER},${0.8*METER}`, width: LINE_WIDTH * 0.8 };
    return { color: '#F5A623', dash: 'none', width: LINE_WIDTH };
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

  // Label largeur de la zone
  const zoneLabel = hasZone ? `${zoneWidth}m × ${zoneHeight}m` : null;
  const labelW    = hasZone ? Math.max(44, String(zoneLabel).length * 5.2) : 0;

  return (
    <div className="relative flex flex-col items-center gap-1.5 w-full">
      {title && (
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#39FF14]/60 text-center">
          {title}
        </p>
      )}

      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="w-full rounded-xl overflow-hidden"
        style={{ maxWidth: W, border: '1.5px solid rgba(57,255,20,0.18)', background: '#0d180d' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="td-shadow">
            <feDropShadow dx={0.8 * scale} dy={1.2 * scale} stdDeviation={1.8 * scale} floodColor="#000" floodOpacity="0.6" />
          </filter>
          <filter id="td-glow">
            <feGaussianBlur stdDeviation={3 * scale} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="zone-glow">
            <feGaussianBlur stdDeviation={2.5 * scale} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── GAZON ── */}
        {Array.from({ length: STRIPES }).map((_, i) => (
          <rect key={`gs${i}`} x={PAD + i * sw} y={PAD} width={sw} height={FH}
            fill={i % 2 === 0 ? '#2a6430' : '#245a2a'} />
        ))}

        {/* ── TERRAIN : lignes adaptées au zoom ── */}
        <rect x={PAD} y={PAD} width={FW} height={FH} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={1.8 * scale} />
        <line x1={PAD + FW/2} y1={PAD} x2={PAD + FW/2} y2={PAD + FH} stroke="rgba(255,255,255,0.65)" strokeWidth={1.2 * scale} />
        <circle cx={PAD + FW/2} cy={PAD + FH/2} r={Math.min(FW, FH) * 0.115} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2 * scale} />
        <circle cx={PAD + FW/2} cy={PAD + FH/2} r={3 * scale} fill="rgba(255,255,255,0.75)" />
        {/* Surface gauche */}
        <rect x={PAD}              y={PAD + FH*0.28} width={FW*0.145} height={FH*0.44} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1 * scale} />
        <rect x={PAD}              y={PAD + FH*0.38} width={FW*0.065} height={FH*0.24} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8 * scale} />
        {/* Surface droite */}
        <rect x={PAD + FW*0.855}   y={PAD + FH*0.28} width={FW*0.145} height={FH*0.44} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1 * scale} />
        <rect x={PAD + FW*0.935}   y={PAD + FH*0.38} width={FW*0.065} height={FH*0.24} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8 * scale} />
        {/* Buts */}
        <rect x={PAD - 6}          y={PAD + FH*0.41} width="6" height={FH*0.18} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2 * scale} />
        <rect x={PAD + FW}         y={PAD + FH*0.41} width="6" height={FH*0.18} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2 * scale} />

        {/* ── ZONE D'EXERCICE ── */}
        {hasZone && (
          <g>
            <rect x={zoneOriginX} y={zoneOriginY} width={zonePxW} height={zonePxH} fill="rgba(255,230,50,0.07)" />
            <rect x={zoneOriginX} y={zoneOriginY} width={zonePxW} height={zonePxH}
              fill="none" stroke="#FFE234" strokeWidth={1.8 * scale} strokeDasharray={`${6*scale},${3*scale}`}
              filter="url(#zone-glow)" opacity={0.9} />
            {([[zoneOriginX, zoneOriginY],[zoneOriginX+zonePxW, zoneOriginY],[zoneOriginX, zoneOriginY+zonePxH],[zoneOriginX+zonePxW, zoneOriginY+zonePxH]] as [number,number][]).map(([cx,cy], i) => (
              <circle key={`zc${i}`} cx={cx} cy={cy} r={2.5 * scale} fill="#FFE234" opacity={0.85} />
            ))}
            {/* Badge dimensions avec scale */}
            <rect
              x={zoneOriginX + zonePxW/2 - (labelW * scale)/2}
              y={zoneOriginY - 12 * scale}
              width={labelW * scale} height={11 * scale} rx={3 * scale}
              fill="rgba(0,0,0,0.78)"
            />
            <text
              x={zoneOriginX + zonePxW/2} y={zoneOriginY - 4 * scale}
              textAnchor="middle" fontSize={7 * scale} fontWeight="bold"
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
          const { x1, y1, x2, y2 } = shorten(x1r, y1r, x2r, y2r, R + 2 * scale);
          const { color, dash, width: lw } = movementStyle(mov.style);
          return (
            <g key={`mv${idx}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color} strokeWidth={lw}
                strokeDasharray={dash === 'none' ? undefined : dash} opacity={0.9} />
              {arrowHead(x1, y1, x2, y2, color, METER)}
            </g>
          );
        })}

        {/* ── JOUEURS ── */}
        {players.map((player, idx) => {
          const x   = px(player.x);
          const y   = py(player.y);
          const col = teamColors[player.team] ?? teamColors.attaque;
          return (
            <g key={`pl${idx}`} filter="url(#td-shadow)">
              <circle cx={x} cy={y} r={R} fill={col.body} stroke={col.border} strokeWidth={1.5 * scale} />
              <circle cx={x - R*0.28} cy={y - R*0.28} r={R*0.38} fill="rgba(255,255,255,0.18)" />
              <circle cx={x} cy={y - R - 2*scale} r={R*0.4} fill="#F5CBA7" stroke={col.border} strokeWidth={1 * scale} />
              {(player.number !== undefined || player.role) && (
                <text x={x + R + 3*scale} y={y - R - 1*scale} textAnchor="start" dominantBaseline="middle"
                    fontSize={11 * scale} fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif"
                    stroke="rgba(0,0,0,0.8)" strokeWidth={2.5 * scale} strokeLinejoin="round" paintOrder="stroke"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {player.number !== undefined ? player.number : ''}{player.role ? ` ${player.role}` : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── LÉGENDE (HTML Overlay) ── */}
      {(() => {
        const items: { color: string; dash?: boolean; label: string; isCircle?: boolean }[] = [];
        if (hasAtt)   items.push({ color: '#F5A623', label: 'Attaque', isCircle: true });
        if (hasDef)   items.push({ color: '#E8501A', label: 'Défense', isCircle: true });
        if (hasPasse) items.push({ color: '#F5A623', dash: false, label: 'Passe' });
        if (hasDrib)  items.push({ color: '#39FF14', dash: true,  label: 'Dribble' });
        if (hasDep)   items.push({ color: 'rgba(255,255,255,0.6)', dash: true, label: 'Déplacement' });
        
        return (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-3 p-1.5 px-2.5 rounded bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                 {item.isCircle ? (
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, border: '1px solid rgba(0,0,0,0.4)' }} />
                 ) : (
                   <div className="flex items-center w-4 h-full">
                      <div className="w-full h-0.5" style={{ backgroundColor: item.color, borderTop: item.dash ? '1px dashed #000' : 'none' }}></div>
                   </div>
                 )}
                 <span className="text-[9px] text-white/90 font-sans">{item.label}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
