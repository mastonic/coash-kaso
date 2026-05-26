'use client';

import { useState, useEffect } from 'react';
import { LoadingShimmer } from './LoadingShimmer';

const LOADING_MESSAGES = [
  "🤖 ProSéance bosse dur...",
  "⚽ En train de générer des exercices de champion...",
  "🧠 Réfléchissant à la meilleure stratégie tactique...",
  "💪 Sculptant l'entraînement idéal...",
  "🔥 Allumant le feu sous le terrain...",
  "🎯 Ciblant l'excellence...",
  "⚡ Chargement de la sauce tactique...",
  "🏆 Préparant une séance de qualité...",
  "🚀 Lancez-vous vers la victoire...",
  "🎪 Le cirque du foot se met en place...",
  "🏃 Pas d'impatience, ça arrive!",
  "⏳ Juste quelques secondes encore...",
  "🧪 Expérimentant des drills de folie...",
  "🎬 Tournage de votre séance en cours...",
  "🎸 Composant votre hymne tactique...",
];

export function GenerationLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Animated Message */}
      <div className="text-center space-y-4">
        <div className="h-12 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-[#39FF14] animate-pulse">
            {LOADING_MESSAGES[messageIndex]}
          </h2>
        </div>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 bg-[#39FF14] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
        </div>
      </div>

      {/* Loading Shimmer */}
      <LoadingShimmer />
    </div>
  );
}
