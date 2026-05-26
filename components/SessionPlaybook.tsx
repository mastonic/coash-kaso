'use client';

import { useState, useEffect } from 'react';
import { TacticsCard } from './TacticsCard';
import { SessionExportPDF } from './SessionExportPDF';

interface SessionData {
  games: Array<{
    title: string;
    objective: string;
    content: string;
    illustration?: string;
    setup?: string;
    duration: number;
  }>;
  exercises: Array<{
    title: string;
    objective: string;
    content: string;
    illustration?: string;
    technique?: string;
    duration: number;
  }>;
  situations: Array<{
    title: string;
    objective: string;
    content: string;
    illustration?: string;
    fieldSetup?: string;
    duration: number;
  }>;
}

interface SelectedItem {
  type: 'game' | 'exercise' | 'situation';
  index: number;
  title: string;
  duration: number;
}

interface BonusExercise {
  id: string;
  title: string;
  objective: string;
  content: string;
  duration: number;
  type: 'défensif' | 'transition' | 'pressing' | 'possession' | 'technique';
  source: 'mastro-live';
}

interface SessionPlaybookProps {
  data: SessionData;
  bonusExercises?: BonusExercise[];
  onSelectionChange?: (selected: SelectedItem[]) => void;
  theme?: string;
  load?: string;
  school?: string;
  playerCount?: number;
}

export function SessionPlaybook({
  data,
  bonusExercises = [],
  onSelectionChange,
  theme = 'possession',
  load = 'moderate',
  school = 'Française',
  playerCount = 11,
}: SessionPlaybookProps) {
  const [openSection, setOpenSection] = useState<string | null>('games');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const exercisesWithBonus = [...data.exercises, ...bonusExercises.map(ex => ({
    title: ex.title,
    objective: ex.objective,
    content: ex.content,
    duration: ex.duration,
  }))];

  const sections = [
    { id: 'games', label: '🎮 JEU', items: data.games, icon: '🎮', type: 'game' as const },
    { id: 'exercises', label: '⚙️ EXERCICE', items: exercisesWithBonus, icon: '⚙️', type: 'exercise' as const },
    { id: 'situations', label: '🏟️ SITUATION', items: data.situations, icon: '🏟️', type: 'situation' as const },
  ];

  const handleSectionClick = (sectionId: string) => {
    // Debounce: prevent rapid clicking during animation
    if (isAnimating) return;

    setIsAnimating(true);
    setOpenSection(openSection === sectionId ? null : sectionId);

    // Reset animation flag after 300ms (matches CSS transition)
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleItemCheck = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];

      // Notify parent component
      if (onSelectionChange) {
        const selectedData: SelectedItem[] = newSelected.map(id => {
          const [type, index] = id.split('-');
          const section = sections.find(s => s.type === type);
          if (section) {
            const item = section.items[parseInt(index)];
            return {
              type: type as 'game' | 'exercise' | 'situation',
              index: parseInt(index),
              title: item.title,
              duration: item.duration,
            };
          }
          return null;
        }).filter(Boolean) as SelectedItem[];
        onSelectionChange(selectedData);
      }

      return newSelected;
    });
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4 pb-32 md:pb-40">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] overflow-hidden transition-all duration-300 hover:border-[rgba(57,255,20,0.4)]"
          >
            <button
              onClick={() => handleSectionClick(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between bg-[#0A0F0D] hover:bg-[rgba(57,255,20,0.08)] transition-all duration-200 group animate-pop"
            >
              <span className="text-[#F3F4F6] font-bold text-lg group-hover:text-[#39FF14] transition-colors">{section.label}</span>
              <span className="text-[#39FF14] transition-transform duration-300 transform group-hover:scale-125">{openSection === section.id ? '▼' : '▶'}</span>
            </button>

            {openSection === section.id && (
              <div className="p-6 space-y-4 animate-fade-in-up">
                {section.items.map((item, idx) => {
                  const itemId = `${section.type}-${idx}`;
                  const isChecked = selectedItems.includes(itemId);
                  const isBonusExercise = section.type === 'exercise' && idx >= data.exercises.length;
                  return (
                    <div key={idx} className="animate-fade-in-up relative" style={{ animationDelay: `${idx * 50}ms` }}>
                      {isBonusExercise && (
                        <div className="absolute -top-3 right-4 z-10">
                          <span className="bg-gradient-to-r from-[#39FF14] to-[#10B981] text-[#0A0F0D] text-xs font-bold px-3 py-1 rounded-full">
                            🎙️ ProSéance Live
                          </span>
                        </div>
                      )}
                      <TacticsCard
                        title={item.title}
                        objective={item.objective}
                        content={item.content}
                        duration={item.duration}
                        type={section.type}
                        isChecked={isChecked}
                        onCheck={() => handleItemCheck(itemId)}
                        itemId={itemId}
                        illustration={(item as any).illustration}
                        setup={section.type === 'game' ? (item as any).setup : undefined}
                        technique={section.type === 'exercise' ? (item as any).technique : undefined}
                        fieldSetup={section.type === 'situation' ? (item as any).fieldSetup : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar */}
      {(selectedItems.length > 0 || true) && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0F0D] via-[#0A0F0D] to-[#0A0F0D]/80 border-t border-[rgba(57,255,20,0.2)] p-4 md:p-6 animate-fade-in-up z-40">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-6">
            <div className="flex-1 order-2 md:order-1">
              <p className="text-[#F3F4F6] font-bold text-sm md:text-base">
                <span className="text-[#39FF14] text-lg">{selectedItems.length}</span> bloc{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
              </p>
              <p className="text-[#9CA3AF] text-xs md:text-sm mt-1">
                ⏱️ {selectedItems.reduce((sum, id) => {
                  const [type, index] = id.split('-');
                  const section = sections.find(s => s.type === type);
                  return sum + (section?.items[parseInt(index)]?.duration || 0);
                }, 0)}m
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 items-center flex-wrap order-1 md:order-2 w-full md:w-auto">
              {selectedItems.length === 0 && (
                <>
                  <button
                    onClick={() => {
                      try {
                        const allItems: SelectedItem[] = [];
                        data.games.forEach((_, idx) => allItems.push({ type: 'game', index: idx, title: data.games[idx].title, duration: data.games[idx].duration }));
                        data.exercises.forEach((_, idx) => allItems.push({ type: 'exercise', index: idx, title: data.exercises[idx].title, duration: data.exercises[idx].duration }));
                        data.situations.forEach((_, idx) => allItems.push({ type: 'situation', index: idx, title: data.situations[idx].title, duration: data.situations[idx].duration }));

                        const activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
                        const newSession = {
                          id: `session-${Date.now()}`,
                          items: allItems,
                          timestamp: new Date().toISOString(),
                          status: 'Enregistrée' as const,
                          sources: [] as string[],
                        };
                        activeSessions.push(newSession);
                        localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
                        alert(`✅ Séance enregistrée!\n${allItems.length} blocs\n⏱️ Durée: ${allItems.reduce((s, i) => s + i.duration, 0)}m`);
                      } catch (err) {
                        alert('❌ Erreur enregistrement');
                      }
                    }}
                    className="px-6 py-3 bg-[#10B981]/80 hover:bg-[#10B981] text-[#0A0F0D] font-bold rounded-lg transition-all uppercase text-sm"
                  >
                    💾 Enregistrer Séance
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/share-session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            sessionData: data,
                            theme,
                            load,
                            school,
                            playerCount,
                          }),
                        });
                        const result = await response.json();
                        if (result.success) {
                          await navigator.clipboard.writeText(result.shareUrl);
                          alert(`✅ Lien copié!\n${result.shareUrl}`);
                        } else {
                          alert('❌ Erreur partage');
                        }
                      } catch (err) {
                        alert('❌ Erreur partage');
                      }
                    }}
                    className="px-6 py-3 bg-[#3B82F6]/80 hover:bg-[#3B82F6] text-white font-bold rounded-lg transition-all uppercase text-sm"
                  >
                    🔗 Partager
                  </button>
                </>
              )}
              <SessionExportPDF
                theme={theme}
                load={load}
                school={school}
                playerCount={playerCount}
                games={data.games}
                exercises={data.exercises}
                situations={data.situations}
              />
            </div>
            <button
              onClick={() => {
                const selectedData: SelectedItem[] = selectedItems.map(id => {
                  const [type, index] = id.split('-');
                  const section = sections.find(s => s.type === type);
                  if (section) {
                    const item = section.items[parseInt(index)];
                    return {
                      type: type as 'game' | 'exercise' | 'situation',
                      index: parseInt(index),
                      title: item?.title || 'Exercice sans titre',
                      duration: typeof item?.duration === 'number' ? item.duration : 15,
                    };
                  }
                  return null;
                }).filter(Boolean) as SelectedItem[];

                // Validation check
                if (selectedData.length === 0) {
                  alert('⚠️ Veuillez sélectionner au moins un bloc');
                  return;
                }

                // Persist to localStorage with validation
                try {
                  const activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');

                  // Detect sources: check if any exercises come from bonus exercises (ProSéance Live)
                  const sources: Array<'vision' | 'live'> = [];
                  selectedItems.forEach(itemId => {
                    const [type, indexStr] = itemId.split('-');
                    const index = parseInt(indexStr);
                    // If exercise index is beyond base exercises, it's from ProSéance Live
                    if (type === 'exercise' && index >= data.exercises.length) {
                      sources.push('live');
                    }
                  });

                  // Check if mastro_attendance exists (Vision was used)
                  if (localStorage.getItem('mastro_attendance')) {
                    if (!sources.includes('vision')) {
                      sources.push('vision');
                    }
                  }

                  const newSession = {
                    id: `session-${Date.now()}`,
                    items: selectedData,
                    timestamp: new Date().toISOString(),
                    status: 'Validée' as const,
                    sources: [...new Set(sources)], // Remove duplicates
                  };

                  // Validate structure before saving
                  if (!newSession.id || !Array.isArray(newSession.items) || newSession.items.length === 0) {
                    console.error('Invalid session structure:', newSession);
                    alert('❌ Erreur de validation de la séance');
                    return;
                  }

                  activeSessions.push(newSession);
                  localStorage.setItem('active_sessions', JSON.stringify(activeSessions));

                  // Trigger success message
                  const successMsg = `✨ Séance validée!\n📋 ${selectedData.length} bloc${selectedData.length > 1 ? 's' : ''} sélectionné${selectedData.length > 1 ? 's' : ''}\n⏱️ Durée totale: ${selectedData.reduce((sum, item) => sum + item.duration, 0)}m`;
                  alert(successMsg);

                  // Clear selection and return to config
                  setSelectedItems([]);
                  window.location.href = '/session';
                } catch (err) {
                  console.error('Error saving session:', err);
                  alert('❌ Erreur lors de la sauvegarde');
                }
              }}
              className="group relative px-8 py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] uppercase flex-shrink-0"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-lg bg-white transition-opacity duration-300" />
              <span className="relative z-10">Valider & Envoyer au RT</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
