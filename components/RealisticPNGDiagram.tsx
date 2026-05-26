'use client';

interface Player {
  x: number;
  y: number;
  number?: number;
  team: 'attaque' | 'défense';
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type?: 'pass' | 'dribble' | 'run';
}

interface RealisticDiagramProps {
  players: Player[];
  movements?: Movement[];
  theme: string;
}

export function RealisticPNGDiagram({
  players,
  movements = [],
  theme,
}: RealisticDiagramProps) {
  const WIDTH = 800;
  const HEIGHT = 1200;
  const PADDING = 40;
  const FW = WIDTH - 2 * PADDING;
  const FH = HEIGHT - 2 * PADDING;

  const coord = (p: number, w: boolean) =>
    w ? PADDING + (p / 100) * FW : PADDING + (p / 100) * FH;

  return (
    <div className="flex justify-center my-8">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-2xl rounded-lg"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
        }}
      >
        <defs>
          <radialGradient id="fieldGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" style={{ stopColor: '#4ade80', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
          </radialGradient>

          <pattern id="grass" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#16a34a" opacity="0.2" />
            <circle cx="15" cy="18" r="0.6" fill="#15803d" opacity="0.3" />
            <circle cx="18" cy="8" r="0.7" fill="#16a34a" opacity="0.2" />
          </pattern>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="playerShadow">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4" />
          </filter>

          <marker id="arrowPass" markerWidth="12" markerHeight="12" refX="9" refY="3" orient="auto">
            <polygon points="0,0 12,3 0,6" fill="#fff" opacity="0.9" />
          </marker>
        </defs>

        {/* Arrière-plan */}
        <rect width={WIDTH} height={HEIGHT} fill="#e8f5e9" />

        {/* Terrain avec dégradé */}
        <rect
          x={PADDING} y={PADDING} width={FW} height={FH}
          fill="url(#fieldGrad)"
        />

        {/* Texture herbe */}
        <rect
          x={PADDING} y={PADDING} width={FW} height={FH}
          fill="url(#grass)" opacity="0.6"
        />

        {/* Bordure terrain - épaisse et professionnelle */}
        <rect
          x={PADDING} y={PADDING} width={FW} height={FH}
          fill="none" stroke="#fff" strokeWidth="4"
          filter="url(#glow)"
        />

        {/* Lignes */}
        <line
          x1={PADDING + FW/2} y1={PADDING}
          x2={PADDING + FW/2} y2={PADDING + FH}
          stroke="#fff" strokeWidth="3" opacity="0.95"
        />

        {/* Cercle central */}
        <circle
          cx={PADDING + FW/2} cy={PADDING + FH/2} r="60"
          fill="none" stroke="#fff" strokeWidth="3" opacity="0.9"
        />
        <circle
          cx={PADDING + FW/2} cy={PADDING + FH/2} r="5"
          fill="#fff" opacity="0.95"
        />

        {/* Zones penaltys */}
        <rect
          x={PADDING} y={PADDING + (FH-200)/2}
          width="100" height="200"
          fill="none" stroke="#fff" strokeWidth="2" opacity="0.7"
        />
        <rect
          x={PADDING + FW - 100} y={PADDING + (FH-200)/2}
          width="100" height="200"
          fill="none" stroke="#fff" strokeWidth="2" opacity="0.7"
        />

        {/* Mouvements */}
        {movements.map((m, i) => {
          const x1 = coord(m.from.x, true);
          const y1 = coord(m.from.y, false);
          const x2 = coord(m.to.x, true);
          const y2 = coord(m.to.y, false);

          let dash = '';
          if (m.type === 'dribble') dash = '10,5';
          if (m.type === 'run') dash = '3,4';

          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#fff" strokeWidth="3.5"
              strokeDasharray={dash}
              opacity="0.85"
              markerEnd="url(#arrowPass)"
              filter="url(#glow)"
            />
          );
        })}

        {/* Joueurs */}
        {players.map((p, i) => {
          const x = coord(p.x, true);
          const y = coord(p.y, false);
          const isAtt = p.team === 'attaque';

          return (
            <g key={i} filter="url(#playerShadow)">
              {/* Cercle externe blanc */}
              <circle cx={x} cy={y} r="28" fill="#fff" opacity="0.95" />

              {/* Cercle couleur */}
              <circle
                cx={x} cy={y} r="25"
                fill={isAtt ? '#10b981' : '#ef4444'}
              />

              {/* Cercle interne */}
              <circle
                cx={x} cy={y} r="22"
                fill={isAtt ? '#34d399' : '#f87171'}
                opacity="0.9"
              />

              {/* Numéro */}
              {p.number && (
                <text
                  x={x} y={y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="20" fontWeight="bold" fill="#fff"
                  fontFamily="Arial, sans-serif"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {p.number}
                </text>
              )}
            </g>
          );
        })}

        {/* Légende professionnelle */}
        <g>
          <rect
            x="20" y={HEIGHT - 80} width="350" height="60"
            fill="#fff" rx="8"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />

          <circle cx="45" cy={HEIGHT - 55} r="8" fill="#34d399" stroke="#fff" strokeWidth="2" />
          <text x="65" y={HEIGHT - 50} fontSize="13" fill="#000" fontWeight="600">Attaque</text>

          <circle cx="165" cy={HEIGHT - 55} r="8" fill="#f87171" stroke="#fff" strokeWidth="2" />
          <text x="185" y={HEIGHT - 50} fontSize="13" fill="#000" fontWeight="600">Défense</text>

          <line x1="280" y1={HEIGHT - 55} x2="310" y2={HEIGHT - 55} stroke="#fff" strokeWidth="3" />
          <text x="320" y={HEIGHT - 50} fontSize="13" fill="#000" fontWeight="600">Passe</text>
        </g>

        {/* Watermark */}
        <text
          x={WIDTH - 30} y={HEIGHT - 15}
          fontSize="10" fill="#999" textAnchor="end"
          opacity="0.5"
        >
          ProSéance
        </text>
      </svg>
    </div>
  );
}
