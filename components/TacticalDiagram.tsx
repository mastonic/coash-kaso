'use client';

interface Player {
  x: number; // 0-100 (percent of field width)
  y: number; // 0-100 (percent of field height)
  number?: number;
  team: 'attaque' | 'défense';
  role?: string;
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  style?: 'dribble' | 'passe' | 'déplacement';
  label?: string;
}

interface TacticalDiagramProps {
  title?: string;
  players: Player[];
  movements?: Movement[];
  showGrid?: boolean;
  width?: number;
  height?: number;
}

export function TacticalDiagram({
  title,
  players,
  movements = [],
  showGrid = false,
  width = 500,
  height = 700,
}: TacticalDiagramProps) {
  const fieldWidth = width;
  const fieldHeight = height;
  const padding = 20;

  const getColor = (team: 'attaque' | 'défense') => {
    return team === 'attaque' ? '#2ECC71' : '#E74C3C';
  };

  const getMovementStroke = (style?: string) => {
    switch (style) {
      case 'dribble':
        return { stroke: '#2ECC71', strokeDasharray: '8,4', strokeWidth: 2.5 };
      case 'passe':
        return { stroke: '#2ECC71', strokeDasharray: 'none', strokeWidth: 3 };
      case 'déplacement':
        return { stroke: '#95A5A6', strokeDasharray: '4,3', strokeWidth: 1.5 };
      default:
        return { stroke: '#2ECC71', strokeDasharray: 'none', strokeWidth: 2.5 };
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 my-6">
      {title && <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</h4>}

      <svg
        viewBox={`0 0 ${fieldWidth} ${fieldHeight}`}
        className="border border-gray-300 bg-gradient-to-br from-green-100 to-green-50 w-full"
        style={{ maxWidth: fieldWidth }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrowGreen"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#2ECC71" />
          </marker>
          <marker
            id="arrowRed"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#E74C3C" />
          </marker>
          <marker
            id="arrowGray"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#95A5A6" />
          </marker>
        </defs>

        {/* Terrain */}
        <rect width={fieldWidth} height={fieldHeight} fill="#90EE90" opacity="0.3" />

        {/* Périmètres */}
        <line x1={padding} y1={padding} x2={fieldWidth - padding} y2={padding} stroke="#000" strokeWidth="3" />
        <line x1={padding} y1={fieldHeight - padding} x2={fieldWidth - padding} y2={fieldHeight - padding} stroke="#000" strokeWidth="3" />
        <line x1={padding} y1={padding} x2={padding} y2={fieldHeight - padding} stroke="#000" strokeWidth="3" />
        <line x1={fieldWidth - padding} y1={padding} x2={fieldWidth - padding} y2={fieldHeight - padding} stroke="#000" strokeWidth="3" />

        {/* Ligne médiane */}
        <line x1={fieldWidth / 2} y1={padding} x2={fieldWidth / 2} y2={fieldHeight - padding} stroke="#000" strokeWidth="1.5" />

        {/* Cercle central */}
        <circle cx={fieldWidth / 2} cy={fieldHeight / 2} r="40" fill="none" stroke="#000" strokeWidth="1" />
        <circle cx={fieldWidth / 2} cy={fieldHeight / 2} r="4" fill="#000" />

        {/* Zones */}
        <rect x={(fieldWidth - 150) / 2} y={padding} width="150" height="80" fill="none" stroke="#000" strokeWidth="1" opacity="0.5" />
        <rect x={(fieldWidth - 150) / 2} y={fieldHeight - padding - 80} width="150" height="80" fill="none" stroke="#000" strokeWidth="1" opacity="0.5" />

        {/* Mouvements */}
        {movements.map((movement, idx) => {
          const fromX = padding + (movement.from.x / 100) * (fieldWidth - 2 * padding);
          const fromY = padding + (movement.from.y / 100) * (fieldHeight - 2 * padding);
          const toX = padding + (movement.to.x / 100) * (fieldWidth - 2 * padding);
          const toY = padding + (movement.to.y / 100) * (fieldHeight - 2 * padding);

          const strokeProps = getMovementStroke(movement.style);
          const markerId = movement.style === 'dribble' ? 'arrowGreen' : movement.style === 'déplacement' ? 'arrowGray' : 'arrowGreen';

          return (
            <g key={idx}>
              <line x1={fromX} y1={fromY} x2={toX} y2={toY} {...strokeProps} markerEnd={`url(#${markerId})`} />
            </g>
          );
        })}

        {/* Joueurs */}
        {players.map((player, idx) => {
          const x = padding + (player.x / 100) * (fieldWidth - 2 * padding);
          const y = padding + (player.y / 100) * (fieldHeight - 2 * padding);
          const color = getColor(player.team);
          const borderColor = player.team === 'attaque' ? '#27AE60' : '#C0392B';

          return (
            <g key={idx}>
              {/* Cercle du joueur */}
              <circle cx={x} cy={y} r="16" fill={color} stroke={borderColor} strokeWidth="2.5" />

              {/* Numéro */}
              {player.number && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dy="0.35em"
                  className="font-bold"
                  fontSize="14"
                  fill="#FFF"
                  fontWeight="600"
                >
                  {player.number}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="flex gap-6 text-xs text-gray-600 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-700"></div>
          <span className="font-medium">Attaque</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-red-700"></div>
          <span className="font-medium">Défense</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-green-500"></div>
          <span className="font-medium">Passe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-green-500" style={{ backgroundImage: 'linear-gradient(90deg, #2ECC71 50%, transparent 50%)', backgroundSize: '8px 2px' }}></div>
          <span className="font-medium">Dribble</span>
        </div>
      </div>
    </div>
  );
}
