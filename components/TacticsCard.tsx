'use client';

import { useState } from 'react';
import { TacticalDiagram } from './TacticalDiagram';

interface TacticsCardProps {
  title: string;
  objective: string;
  content: string;
  duration: number;
  type: 'game' | 'exercise' | 'situation';
  isChecked?: boolean;
  onCheck?: (checked: boolean) => void;
  itemId?: string;
  illustration?: string;
  setup?: string;
  technique?: string;
  fieldSetup?: string;
}

const typeIcons: Record<string, string> = {
  game: '🎮',
  exercise: '⚙️',
  situation: '🏟️',
};

const typeBorders: Record<string, string> = {
  game: 'border-[#39FF14]',
  exercise: 'border-[#10B981]',
  situation: 'border-[rgba(57,255,20,0.2)]',
};

const typeShadows: Record<string, string> = {
  game: 'hover:shadow-[0_0_30px_rgba(57,255,20,0.4)]',
  exercise: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]',
  situation: 'hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]',
};

export function TacticsCard({
  title,
  objective,
  content,
  duration,
  type,
  isChecked = false,
  onCheck,
  illustration,
  setup,
  technique,
  fieldSetup,
}: TacticsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showIllustration, setShowIllustration] = useState(false);

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCheck?.(!isChecked);
  };

  // Fallbacks for missing data
  const safeTitle = title || 'Exercice sans titre';
  const safeObjective = objective || 'Aucun objectif défini';
  const safeContent = content || 'Aucune description disponible';
  const safeDuration = typeof duration === 'number' && duration > 0 ? duration : 15;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[#141E1A] rounded-2xl p-4 md:p-6 border-2 transition-all duration-300 hover:scale-[1.02] group animate-fade-in-up ${
        isChecked ? `${typeBorders[type]} shadow-[0_0_30px_${type === 'game' ? 'rgba(57,255,20,0.5)' : 'rgba(16,185,129,0.5)'}]` : `${typeBorders[type]} ${typeShadows[type]}`
      }`}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-2 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className={`text-2xl md:text-3xl mb-1 md:mb-2 transition-transform duration-300 ${isHovered ? 'scale-110 animate-pop' : ''}`}>
            {typeIcons[type]}
          </div>
          <h3 className="text-[#F3F4F6] font-bold text-sm md:text-lg group-hover:text-[#39FF14] transition-colors duration-200 line-clamp-2">
            {safeTitle}
          </h3>
        </div>
        <div className="flex items-start gap-2 md:gap-4 flex-shrink-0">
          <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs font-bold transition-all duration-300 whitespace-nowrap ${
            isHovered
              ? 'bg-[#39FF14] text-[#0A0F0D] scale-110 shadow-[0_0_20px_rgba(57,255,20,0.6)]'
              : 'bg-[#39FF14] text-[#0A0F0D]'
          }`}>
            {safeDuration}m
          </div>
          <button
            onClick={handleCheckClick}
            className={`w-5 h-5 md:w-6 md:h-6 rounded border-2 transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
              isChecked
                ? 'bg-[#10B981] border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                : 'border-[#10B981] bg-[#0A0F0D] hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isChecked && <span className="text-[#0A0F0D] font-bold text-xs">✓</span>}
          </button>
        </div>
      </div>

      <div className="space-y-2 md:space-y-4">
        <div>
          <p className={`text-xs font-bold uppercase mb-0.5 md:mb-1 transition-colors duration-200 ${
            isHovered ? 'text-[#39FF14]' : 'text-[#39FF14]'
          }`}>
            Objectif
          </p>
          <p className={`text-xs md:text-sm transition-colors duration-200 line-clamp-2 ${
            isHovered ? 'text-[#10B981]' : 'text-[#F3F4F6]'
          }`}>
            {safeObjective}
          </p>
        </div>

        <div>
          <p className={`text-xs font-bold uppercase mb-0.5 md:mb-1 transition-colors duration-200 ${
            isHovered ? 'text-[#10B981]' : 'text-[#39FF14]'
          }`}>
            Contenu
          </p>
          <p className={`text-xs md:text-sm transition-colors duration-200 line-clamp-3 md:line-clamp-none ${
            isHovered ? 'text-[#10B981]' : 'text-[#9CA3AF]'
          }`}>
            {safeContent}
          </p>
        </div>

        {/* Additional Details */}
        {(setup || technique || fieldSetup) && (
          <div>
            <p className={`text-xs font-bold uppercase mb-0.5 md:mb-1 transition-colors duration-200 ${
              isHovered ? 'text-[#39FF14]' : 'text-[#39FF14]'
            }`}>
              ℹ️ Détails
            </p>
            <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm text-[#9CA3AF]">
              {setup && <p><strong>Setup:</strong> {setup}</p>}
              {technique && <p><strong>Points clés:</strong> {technique}</p>}
              {fieldSetup && <p><strong>Terrain:</strong> {fieldSetup}</p>}
            </div>
          </div>
        )}

        {/* Illustration Toggle */}
        {illustration && (
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowIllustration(!showIllustration);
              }}
              className="text-xs font-bold text-[#39FF14] hover:text-[#10B981] transition-colors uppercase"
            >
              {showIllustration ? '▼ Masquer le schéma' : '▶ Afficher le schéma'}
            </button>
            {showIllustration && (() => {
              try {
                const diagram = JSON.parse(illustration);
                if (diagram.players && Array.isArray(diagram.players) && diagram.players.length > 0) {
                  return (
                    <div className="mt-2 md:mt-3 rounded overflow-hidden border border-[rgba(57,255,20,0.2)]">
                      <TacticalDiagram
                        players={diagram.players}
                        movements={diagram.movements || []}
                        title={safeTitle}
                      />
                    </div>
                  );
                }
              } catch {
                // not valid JSON, fall through to text
              }
              return (
                <div className="mt-2 md:mt-3 p-3 md:p-4 bg-[#0A0F0D] rounded border border-[rgba(57,255,20,0.2)] font-mono text-xs text-[#39FF14] overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-words">{illustration}</pre>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
