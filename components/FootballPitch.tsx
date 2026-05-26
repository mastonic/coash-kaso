'use client';

interface Position {
  x: number;
  y: number;
  number: number;
}

interface FootballPitchProps {
  formation?: string;
  players?: Position[];
}

export function FootballPitch({ formation = '4-3-3', players }: FootballPitchProps) {
  // Calculate positions based on formation
  const calculateFormationPositions = (formationCode: string): Position[] => {
    const positions: Position[] = [];
    let playerNumber = 1;

    // GK always at x=50
    positions.push({ x: 8, y: 50, number: playerNumber++ });

    // Parse formation (e.g., "4-3-3" => [4, 3, 3])
    const parts = formationCode.split('-').map(p => parseInt(p, 10));
    if (parts.length !== 3) return positions;

    const [defenseCount, midfieldCount, attackCount] = parts;
    const lineSpacing = 65 / (parts.length + 1);

    // Defense line
    const defenseX = 8 + lineSpacing;
    const defenseYSpacing = 100 / (defenseCount + 1);
    for (let i = 0; i < defenseCount; i++) {
      positions.push({
        x: defenseX,
        y: (i + 1) * defenseYSpacing,
        number: playerNumber++,
      });
    }

    // Midfield line
    const midfieldX = 8 + lineSpacing * 2;
    const midfieldYSpacing = 100 / (midfieldCount + 1);
    for (let i = 0; i < midfieldCount; i++) {
      positions.push({
        x: midfieldX,
        y: (i + 1) * midfieldYSpacing,
        number: playerNumber++,
      });
    }

    // Attack line
    const attackX = 8 + lineSpacing * 3;
    const attackYSpacing = 100 / (attackCount + 1);
    for (let i = 0; i < attackCount; i++) {
      positions.push({
        x: attackX,
        y: (i + 1) * attackYSpacing,
        number: playerNumber++,
      });
    }

    return positions;
  };

  const plotted = players || calculateFormationPositions(formation);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <p className="text-[#9CA3AF] text-sm font-bold">Formation: <span className="text-[#39FF14]">{formation}</span></p>
        <p className="text-[#9CA3AF] text-xs">{plotted.length} joueurs</p>
      </div>
      <svg
        viewBox="0 0 100 100"
        className="w-full aspect-video bg-[#1A6B28] rounded-lg border border-[rgba(57,255,20,0.2)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Field */}
        <rect width="100" height="100" fill="#1A6B28" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.4)" />

        {/* Goals */}
        <rect x="0" y="35" width="2" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
        <rect x="98" y="35" width="2" height="30" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />

        {/* Players */}
        {plotted.map((player) => (
          <g key={player.number}>
            <circle cx={player.x} cy={player.y} r="2.5" fill="#39FF14" />
            <circle cx={player.x} cy={player.y} r="3.5" fill="none" stroke="#39FF14" strokeWidth="0.3" opacity="0.5" />
            <text
              x={player.x}
              y={player.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#0A0F0D"
              fontSize="1.2"
              fontWeight="bold"
            >
              {player.number}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
