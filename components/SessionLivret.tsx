'use client';

import { useState } from 'react';
import { RealisticPNGDiagram } from './RealisticPNGDiagram';

interface SessionData {
  games: Array<{
    title: string;
    objective: string;
    content: string;
    duration: number;
  }>;
  exercises: Array<{
    title: string;
    objective: string;
    content: string;
    duration: number;
  }>;
  situations: Array<{
    title: string;
    objective: string;
    content: string;
    duration: number;
  }>;
}

interface SessionLivretProps {
  data: SessionData;
  theme: string;
  load: string;
  school: string;
  playerCount: number;
  clubName?: string;
  category?: string;
}

const AGE_CATEGORIES = {
  U14: { label: 'U14', color: '#3B82F6', bgColor: 'bg-blue-50' },
  U15: { label: 'U15', color: '#8B5CF6', bgColor: 'bg-purple-50' },
  U16: { label: 'U16', color: '#EC4899', bgColor: 'bg-pink-50' },
  U17: { label: 'U17', color: '#F59E0B', bgColor: 'bg-amber-50' },
  U18: { label: 'U18', color: '#10B981', bgColor: 'bg-emerald-50' },
  U19: { label: 'U19', color: '#06B6D4', bgColor: 'bg-cyan-50' },
  Senior: { label: 'Senior', color: '#EF4444', bgColor: 'bg-red-50' },
};

interface Player {
  x: number;
  y: number;
  number: number;
  team: 'attaque' | 'défense';
}

interface Movement {
  from: { x: number; y: number };
  to: { x: number; y: number };
  style: 'passe' | 'dribble' | 'déplacement';
}

// Générer des diagrammes tactiques basés sur les détails de l'exercice
function generateTacticalDiagram(type: string, title: string, content: string = ''): { players: Player[]; movements: Movement[] } {
  // Analyser le contenu pour extraire les détails
  const contentLower = (title + ' ' + content).toLowerCase();

  // Extraire le nombre de joueurs si spécifié
  const playerCountMatch = contentLower.match(/(\d+)v(\d+)|\b(\d+)\s*(joueurs?|players?)\b/i);
  const playerCount = playerCountMatch
    ? parseInt(playerCountMatch[1] || playerCountMatch[3] || '5')
    : 5;

  // Déterminer le type d'exercice basé sur le contenu
  const isDefensive = contentLower.includes('défense') || contentLower.includes('pressing');
  const isPossession = contentLower.includes('possession') || contentLower.includes('passe');
  const isTransition = contentLower.includes('transition') || contentLower.includes('contre');
  const isRondo = contentLower.includes('rondo') || contentLower.includes('4v2');
  const isMatch = contentLower.includes('match') || contentLower.includes('7v7');

  // Générer les positions des joueurs basées sur les détails
  const players: Player[] = [];
  const movements: Movement[] = [];

  if (isRondo) {
    // Rondo 4v2 - cercle de possession
    players = [
      { x: 30, y: 30, number: 1, team: 'attaque' },
      { x: 70, y: 30, number: 2, team: 'attaque' },
      { x: 70, y: 70, number: 3, team: 'attaque' },
      { x: 30, y: 70, number: 4, team: 'attaque' },
      { x: 50, y: 40, number: 5, team: 'défense' },
      { x: 50, y: 60, number: 6, team: 'défense' },
    ];
    movements = [
      { from: { x: 30, y: 30 }, to: { x: 70, y: 30 }, style: 'passe' },
      { from: { x: 70, y: 30 }, to: { x: 70, y: 70 }, style: 'passe' },
      { from: { x: 70, y: 70 }, to: { x: 30, y: 70 }, style: 'passe' },
    ];
  } else if (isMatch) {
    // Match 7v7 - formation complète
    players = [
      { x: 15, y: 50, number: 1, team: 'défense' }, // GK
      { x: 30, y: 25, number: 2, team: 'défense' },
      { x: 30, y: 50, number: 3, team: 'défense' },
      { x: 30, y: 75, number: 4, team: 'défense' },
      { x: 50, y: 40, number: 5, team: 'attaque' },
      { x: 50, y: 60, number: 6, team: 'attaque' },
      { x: 75, y: 50, number: 7, team: 'attaque' },
      // Équipe défensive
      { x: 85, y: 50, number: 8, team: 'défense' },
      { x: 70, y: 25, number: 9, team: 'défense' },
      { x: 70, y: 50, number: 10, team: 'défense' },
      { x: 70, y: 75, number: 11, team: 'défense' },
    ];
    movements = [
      { from: { x: 50, y: 60 }, to: { x: 75, y: 50 }, style: 'passe' },
      { from: { x: 75, y: 50 }, to: { x: 50, y: 40 }, style: 'dribble' },
    ];
  } else if (isDefensive || isPossession) {
    // Exercice défensif/possession standard - positionner dynamiquement
    const spacing = 25;
    const startX = 20;
    const startY = 25;

    // Attaquants (possession)
    for (let i = 0; i < Math.min(playerCount, 6); i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      players.push({
        x: startX + col * spacing,
        y: startY + row * spacing,
        number: i + 1,
        team: 'attaque',
      });
    }

    // Défenseurs
    if (isDefensive) {
      const defCount = Math.max(2, Math.ceil(playerCount / 2));
      for (let i = 0; i < defCount; i++) {
        players.push({
          x: 50 + (i - Math.floor(defCount / 2)) * 15,
          y: 70,
          number: playerCount + i + 1,
          team: 'défense',
        });
      }

      // Mouvements de pressing
      movements = players
        .filter((p) => p.team === 'attaque')
        .slice(0, 3)
        .map((p, i) => ({
          from: { x: p.x, y: p.y },
          to: { x: 50 + (i - 1) * 15, y: 70 },
          style: 'déplacement',
        }));
    } else {
      // Mouvements de passe
      for (let i = 0; i < players.length - 1; i++) {
        if (i % 2 === 0) {
          movements.push({
            from: { x: players[i].x, y: players[i].y },
            to: { x: players[i + 1].x, y: players[i + 1].y },
            style: 'passe',
          });
        }
      }
    }
  } else {
    // Par défaut: formation flexible basée sur le nombre de joueurs
    players = [
      { x: 25, y: 25, number: 1, team: 'attaque' },
      { x: 50, y: 15, number: 2, team: 'attaque' },
      { x: 75, y: 25, number: 3, team: 'attaque' },
      { x: 25, y: 50, number: 4, team: 'attaque' },
      { x: 50, y: 50, number: 5, team: 'attaque' },
      { x: 75, y: 50, number: 6, team: 'attaque' },
      { x: 50, y: 75, number: 7, team: 'attaque' },
    ];
    movements = [
      { from: { x: 50, y: 50 }, to: { x: 75, y: 25 }, style: 'passe' },
      { from: { x: 75, y: 25 }, to: { x: 50, y: 15 }, style: 'passe' },
    ];
  }

  return {
    players: players.slice(0, 11), // Limiter à 11 joueurs max
    movements,
  };
}


export function SessionLivret({
  data,
  theme,
  load,
  school,
  playerCount,
  clubName = 'ProSéance Club',
  category = 'Senior',
}: SessionLivretProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const selectedCategory = AGE_CATEGORIES[category as keyof typeof AGE_CATEGORIES] || AGE_CATEGORIES.Senior;

  const totalDuration = [
    ...data.games,
    ...data.exercises,
    ...data.situations,
  ].reduce((sum, item) => sum + item.duration, 0);

  const allItems = [
    ...data.games.map(g => ({ ...g, type: 'Jeu' as const })),
    ...data.exercises.map(e => ({ ...e, type: 'Exercice' as const })),
    ...data.situations.map(s => ({ ...s, type: 'Situation' as const })),
  ];

  const pages: Array<
    | { type: 'cover'; data?: undefined; index?: undefined }
    | { type: 'info'; data?: undefined; index?: undefined }
    | { type: 'exercise'; data: typeof allItems[0]; index: number }
  > = [
    // Couverture
    { type: 'cover' },
    // Informations
    { type: 'info' },
    // Exercices
    ...allItems.map((item, idx) => ({ type: 'exercise' as const, data: item, index: idx })),
  ];

  const renderCover = () => (
    <div className="h-screen bg-gradient-to-br from-[#0A0F0D] via-[#141E1A] to-[#0A0F0D] flex flex-col justify-between p-12 text-white border-4 border-[#39FF14]">
      {/* Haut */}
      <div>
        <div className="text-sm uppercase tracking-widest text-[#39FF14] mb-4 font-bold">
          Livret du Stagiaire
        </div>
        <h1 className="text-6xl font-black mb-4 leading-tight">
          SÉANCE<br />
          D'ENTRAÎNEMENT
        </h1>
        <div className="h-1 w-24 bg-[#39FF14] mb-8"></div>
      </div>

      {/* Centre */}
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-2xl font-bold">{clubName}</p>
          <p className="text-sm text-[#A0AEA8] uppercase tracking-widest">Catégorie {category}</p>
        </div>

        {/* Badge catégorie */}
        <div className="inline-block px-6 py-3 border-2 border-[#39FF14] rounded-full">
          <span className="text-xl font-bold text-[#39FF14]">{category}</span>
        </div>

        <div className="text-[#A0AEA8] space-y-1">
          <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-sm">{school} • {playerCount} joueurs</p>
        </div>
      </div>

      {/* Bas */}
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="pb-4 border-b border-[#39FF14]/30">
            <p className="text-[#39FF14] font-bold text-lg">{theme}</p>
            <p className="text-[#A0AEA8]">Thème</p>
          </div>
          <div className="pb-4 border-b border-[#39FF14]/30">
            <p className="text-[#39FF14] font-bold text-lg">{load}</p>
            <p className="text-[#A0AEA8]">Charge</p>
          </div>
          <div className="pb-4 border-b border-[#39FF14]/30">
            <p className="text-[#39FF14] font-bold text-lg">{totalDuration}min</p>
            <p className="text-[#A0AEA8]">Durée</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="h-screen bg-white flex flex-col p-12 justify-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-4xl font-black mb-12 text-[#0A0F0D]">Informations Séance</h2>

        <div className="space-y-8">
          <div className="border-l-4 border-[#39FF14] pl-6">
            <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-2">Catégorie</h3>
            <p className="text-2xl font-bold text-[#0A0F0D]">{category}</p>
          </div>

          <div className="border-l-4 border-[#39FF14] pl-6">
            <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-2">Thème Pédagogique</h3>
            <p className="text-2xl font-bold text-[#0A0F0D] capitalize">{theme}</p>
          </div>

          <div className="border-l-4 border-[#39FF14] pl-6">
            <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-2">École de Jeu</h3>
            <p className="text-2xl font-bold text-[#0A0F0D]">{school}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border-l-4 border-[#39FF14] pl-6">
              <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-2">Nombre de joueurs</h3>
              <p className="text-2xl font-bold text-[#0A0F0D]">{playerCount}</p>
            </div>

            <div className="border-l-4 border-[#39FF14] pl-6">
              <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-2">Durée totale</h3>
              <p className="text-2xl font-bold text-[#0A0F0D]">{totalDuration} minutes</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-bold text-[#A0AEA8] uppercase mb-4">Contenu</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">• {data.games.length} Jeu(x) de possession</p>
              <p className="text-sm text-gray-600">• {data.exercises.length} Exercice(s) technique(s)</p>
              <p className="text-sm text-gray-600">• {data.situations.length} Situation(s) de match</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExercisePage = (item: (typeof allItems)[0], index: number) => {
    const diagram = generateTacticalDiagram(theme, item.title, item.content);

    return (
      <div className="h-screen bg-white flex flex-col p-8 justify-between overflow-hidden">
        {/* En-tête */}
        <div>
          <div className="text-xs font-bold text-[#A0AEA8] uppercase tracking-widest mb-2">
            {item.type} - {index + 1}
          </div>

          <h2 className="text-3xl font-black mb-3 text-[#0A0F0D]">{item.title}</h2>

          {/* Badge de type */}
          <div className="inline-block px-4 py-2 bg-[#39FF14] text-[#0A0F0D] rounded-full font-bold text-sm mb-6">
            {item.duration} min
          </div>

          {/* Objectif */}
          <div className="bg-gray-100 border-l-4 border-[#39FF14] p-4 rounded-r-lg mb-6">
            <h3 className="text-xs font-bold text-[#A0AEA8] uppercase mb-1">Objectif</h3>
            <p className="text-sm text-[#0A0F0D] font-semibold">{item.objective}</p>
          </div>
        </div>

        {/* Diagramme tactique réaliste PNG */}
        <div className="flex justify-center my-4 px-2">
          <RealisticPNGDiagram
            players={diagram.players}
            movements={diagram.movements}
            theme={theme}
          />
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-[#A0AEA8] uppercase mb-2">Déroulement</h3>
          <p className="text-gray-700 leading-relaxed text-xs whitespace-pre-wrap line-clamp-6">
            {item.content.substring(0, 500)}...
          </p>
        </div>

        {/* Pied de page */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
          <p className="text-[#A0AEA8] uppercase">ProSéance • {clubName}</p>
          <p className="text-[#A0AEA8]">Page {index + 2} / {pages.length}</p>
        </div>
      </div>
    );
  };

  const currentPageData = pages[currentPage];

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Rendu de la page actuelle */}
      <div className="w-full h-full">
        {currentPageData?.type === 'cover' && renderCover()}
        {currentPageData?.type === 'info' && renderInfo()}
        {currentPageData?.type === 'exercise' && currentPageData.data && renderExercisePage(currentPageData.data, currentPageData.index || 0)}
      </div>

      {/* Contrôles de navigation */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-60">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-6 py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg disabled:opacity-30 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all"
        >
          ← Précédent
        </button>

        <div className="px-6 py-3 bg-[#39FF14]/20 text-[#39FF14] font-bold rounded-lg border border-[#39FF14]">
          {currentPage + 1} / {pages.length}
        </div>

        <button
          onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
          disabled={currentPage === pages.length - 1}
          className="px-6 py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg disabled:opacity-30 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)] transition-all"
        >
          Suivant →
        </button>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-8 right-8 px-6 py-3 bg-[#39FF14]/20 text-[#39FF14] font-bold rounded-lg border border-[#39FF14] hover:bg-[#39FF14]/30 transition-all z-60"
      >
        ✕ Fermer
      </button>
    </div>
  );
}
