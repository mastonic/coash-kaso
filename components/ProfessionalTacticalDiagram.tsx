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

interface ProfessionalTacticalDiagramProps {
  players: Player[];
  movements?: Movement[];
  theme: string;
}

export function ProfessionalTacticalDiagram({
  players,
  movements = [],
  theme,
}: ProfessionalTacticalDiagramProps) {
  const WIDTH = 600;
  const HEIGHT = 900;
  const PADDING = 30;
  const FIELD_WIDTH = WIDTH - 2 * PADDING;
  const FIELD_HEIGHT = HEIGHT - 2 * PADDING;

  const getCoord = (percent: number, isWidth: boolean) => {
    return isWidth
      ? PADDING + (percent / 100) * FIELD_WIDTH
      : PADDING + (percent / 100) * FIELD_HEIGHT;
  };

  return (
    <div className="flex justify-center my-6">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full max-w-xl border-4 border-gray-800 bg-gradient-to-br from-green-200 via-green-100 to-green-200"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}
      >
        {/* Defs */}
        <defs>
          {/* Grass texture */}
          <pattern id="grass" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.5" fill="#22c55e" opacity="0.3" />
            <circle cx="15" cy="20" r="0.5" fill="#16a34a" opacity="0.3" />
            <circle cx="30" cy="10" r="0.5" fill="#22c55e" opacity="0.3" />
            <circle cx="35" cy="35" r="0.5" fill="#16a34a" opacity="0.3" />
          </pattern>

          {/* Arrow markers */}
          <marker id="arrowPass" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fff" />
          </marker>
          <marker id="arrowDribble" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fff" />
          </marker>
          <marker id="arrowRun" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L10,3 L0,6 Z" fill="#fff" />
          </marker>

          {/* Shadows */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Field background */}
        <rect
          x={PADDING}
          y={PADDING}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
          fill="url(#grass)"
          opacity="0.8"
        />

        {/* Field border */}
        <rect
          x={PADDING}
          y={PADDING}
          width={FIELD_WIDTH}
          height={FIELD_HEIGHT}
          fill="none"
          stroke="#fff"
          strokeWidth="3"
        />

        {/* Goal lines */}
        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING + FIELD_WIDTH}
          y2={PADDING}
          stroke="#fff"
          strokeWidth="2.5"
        />
        <line
          x1={PADDING}
          y1={PADDING + FIELD_HEIGHT}
          x2={PADDING + FIELD_WIDTH}
          y2={PADDING + FIELD_HEIGHT}
          stroke="#fff"
          strokeWidth="2.5"
        />

        {/* Side lines */}
        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={PADDING + FIELD_HEIGHT}
          stroke="#fff"
          strokeWidth="2.5"
        />
        <line
          x1={PADDING + FIELD_WIDTH}
          y1={PADDING}
          x2={PADDING + FIELD_WIDTH}
          y2={PADDING + FIELD_HEIGHT}
          stroke="#fff"
          strokeWidth="2.5"
        />

        {/* Halfway line */}
        <line
          x1={PADDING + FIELD_WIDTH / 2}
          y1={PADDING}
          x2={PADDING + FIELD_WIDTH / 2}
          y2={PADDING + FIELD_HEIGHT}
          stroke="#fff"
          strokeWidth="2"
        />

        {/* Center circle */}
        <circle
          cx={PADDING + FIELD_WIDTH / 2}
          cy={PADDING + FIELD_HEIGHT / 2}
          r="50"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
        />

        {/* Center dot */}
        <circle
          cx={PADDING + FIELD_WIDTH / 2}
          cy={PADDING + FIELD_HEIGHT / 2}
          r="4"
          fill="#fff"
        />

        {/* Penalty areas */}
        <rect
          x={PADDING}
          y={PADDING + (FIELD_HEIGHT - 150) / 2}
          width="80"
          height="150"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <rect
          x={PADDING + FIELD_WIDTH - 80}
          y={PADDING + (FIELD_HEIGHT - 150) / 2}
          width="80"
          height="150"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          opacity="0.7"
        />

        {/* Goal areas */}
        <rect
          x={PADDING}
          y={PADDING + (FIELD_HEIGHT - 80) / 2}
          width="40"
          height="80"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <rect
          x={PADDING + FIELD_WIDTH - 40}
          y={PADDING + (FIELD_HEIGHT - 80) / 2}
          width="40"
          height="80"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* Mouvements */}
        {movements.map((mov, idx) => {
          const x1 = getCoord(mov.from.x, true);
          const y1 = getCoord(mov.from.y, false);
          const x2 = getCoord(mov.to.x, true);
          const y2 = getCoord(mov.to.y, false);

          let strokeDash = '';
          let strokeColor = '#fff';
          let markerEnd = 'url(#arrowPass)';

          if (mov.type === 'dribble') {
            strokeDash = '8,4';
            markerEnd = 'url(#arrowDribble)';
          } else if (mov.type === 'run') {
            strokeDash = '2,3';
            strokeColor = 'rgba(255,255,255,0.6)';
            markerEnd = 'url(#arrowRun)';
          }

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeDasharray={strokeDash}
                markerEnd={markerEnd}
              />
            </g>
          );
        })}

        {/* Joueurs */}
        {players.map((player, idx) => {
          const x = getCoord(player.x, true);
          const y = getCoord(player.y, false);
          const isAttacking = player.team === 'attaque';

          return (
            <g key={idx} filter="url(#shadow)">
              {/* Cercle principal */}
              <circle
                cx={x}
                cy={y}
                r="22"
                fill={isAttacking ? '#10b981' : '#ef4444'}
                stroke="#fff"
                strokeWidth="3"
              />

              {/* Cercle intérieur */}
              <circle
                cx={x}
                cy={y}
                r="20"
                fill={isAttacking ? '#34d399' : '#f87171'}
                stroke="none"
              />

              {/* Numéro */}
              {player.number && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="18"
                  fontWeight="bold"
                  fill="#fff"
                  fontFamily="Arial, sans-serif"
                >
                  {player.number}
                </text>
              )}
            </g>
          );
        })}

        {/* Légende */}
        <g>
          {/* Background */}
          <rect x="10" y={HEIGHT - 50} width="280" height="40" fill="#fff" opacity="0.95" rx="4" />

          {/* Attaque */}
          <circle cx="25" cy={HEIGHT - 35} r="6" fill="#34d399" stroke="#fff" strokeWidth="1.5" />
          <text x="40" y={HEIGHT - 30} fontSize="11" fill="#000" fontWeight="600" fontFamily="Arial">
            Attaque
          </text>

          {/* Défense */}
          <circle cx="125" cy={HEIGHT - 35} r="6" fill="#f87171" stroke="#fff" strokeWidth="1.5" />
          <text x="140" y={HEIGHT - 30} fontSize="11" fill="#000" fontWeight="600" fontFamily="Arial">
            Défense
          </text>

          {/* Passe */}
          <line x1="215" y1={HEIGHT - 35} x2="240" y2={HEIGHT - 35} stroke="#fff" strokeWidth="2.5" />
          <text x="250" y={HEIGHT - 30} fontSize="11" fill="#000" fontWeight="600" fontFamily="Arial">
            Passe
          </text>
        </g>
      </svg>
    </div>
  );
}
