'use client';

interface HUDBarProps {
  theme: string;
  load: string;
  school: string;
  playerCount: number;
}

export function HUDBar({ theme, load, school, playerCount }: HUDBarProps) {
  const loadColors: Record<string, string> = {
    'recovery': 'bg-[#10B981]',
    'moderate': 'bg-[#39FF14]',
    'high': 'bg-red-600',
  };

  return (
    <div className="bg-[#0A0F0D] border-b border-[rgba(57,255,20,0.1)] px-4 md:px-6 py-3 md:py-4 flex gap-2 md:gap-4 flex-wrap text-xs md:text-sm">
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-[#39FF14] text-xs font-bold uppercase">Thème</span>
        <span className="text-[#F3F4F6] truncate">{theme}</span>
      </div>
      <div className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-0.5 md:py-1 rounded-lg ${loadColors[load] || 'bg-[#9CA3AF]'}`}>
        <span className="text-[#0A0F0D] text-xs font-bold uppercase whitespace-nowrap">Charge</span>
        <span className="text-[#0A0F0D] capitalize">{load}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-[#39FF14] text-xs font-bold uppercase">École</span>
        <span className="text-[#F3F4F6] truncate">{school}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-2 bg-[#141E1A] px-2 md:px-3 py-0.5 md:py-1 rounded-lg">
        <span className="text-[#F3F4F6] text-xs md:text-sm">👥</span>
        <span className="text-[#F3F4F6] font-bold">{playerCount}</span>
      </div>
    </div>
  );
}
