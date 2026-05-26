'use client';

import { useState, useEffect } from 'react';
import { ProSeanceVision } from '@/components/coach/ProSeanceVision';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
  photoUrl?: string;
}

interface PlayerIdentification {
  playerId: string;
  playerName: string;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  timestampApprox?: string;
}

function PlayerVideoIdentification() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [identifications, setIdentifications] = useState<PlayerIdentification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const response = await fetch(`/api/team?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Veuillez sélectionner une vidéo');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setIdentifications([]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const videoBase64 = (e.target?.result as string).split(',')[1];
          const email = localStorage.getItem('mastro_user');
          if (!email) return;

          const playersWithPhotos = players.filter(p => p.photoUrl);
          if (playersWithPhotos.length === 0) {
            setError('Aucun joueur avec photo pour l\'identification');
            setAnalyzing(false);
            return;
          }

          const response = await fetch('/api/identify-in-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              videoBase64,
              players: playersWithPhotos,
            }),
          });

          if (!response.ok) throw new Error('Failed to identify');

          const result = await response.json();
          if (result.success) {
            setIdentifications(result.identifications || []);
            if (result.identifications.length === 0) {
              setError('Aucun joueur identifié dans la vidéo');
            }
          } else {
            setError(result.error || 'Erreur lors de l\'identification');
          }
        } catch (error) {
          console.error('Error identifying players:', error);
          setError('Erreur lors de l\'analyse de la vidéo');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Erreur lors de la lecture du fichier');
      setAnalyzing(false);
    }
  };

  const playersWithPhotos = players.filter(p => p.photoUrl);

  return (
    <div className="space-y-6">
      <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">Identification des Joueurs dans la Vidéo</h2>

        {playersWithPhotos.length === 0 ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-400 text-sm">
            ℹ️ Aucun joueur avec photo. Veuillez d\'abord ajouter des photos dans la section Équipe.
          </div>
        ) : (
          <>
            <p className="text-[#9CA3AF] text-sm mb-4">
              {playersWithPhotos.length} joueur(s) disponible(s) pour la comparaison
            </p>

            {/* Options pour sélectionner une vidéo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Galerie */}
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                  disabled={analyzing}
                  className="hidden"
                />
                <span className="block w-full bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-4 text-center cursor-pointer hover:scale-105 transition-all disabled:opacity-50 active:scale-95">
                  {analyzing ? '⏳ Analyse...' : '🎬 Galerie'}
                </span>
              </label>

              {/* Option 2: Caméra (sur mobile) */}
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                  disabled={analyzing}
                  className="hidden"
                />
                <span className="block w-full bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-4 text-center cursor-pointer hover:scale-105 transition-all disabled:opacity-50 active:scale-95">
                  {analyzing ? '⏳ Analyse...' : '📱 Caméra'}
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}

            {identifications.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-lg font-bold text-[#F3F4F6]">Joueurs identifiés ({identifications.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {identifications.map((id, idx) => {
                    const confidenceColor = {
                      high: 'bg-green-500/10 border-green-500/30 text-green-400',
                      medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                      low: 'bg-red-500/10 border-red-500/30 text-red-400',
                    };
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${confidenceColor[id.confidence]}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-[#F3F4F6] text-lg">{id.playerName}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-black/30">
                            {id.confidence === 'high' ? '✓ Haute' : id.confidence === 'medium' ? '? Moyenne' : '✗ Basse'}
                          </span>
                        </div>
                        <p className="text-sm text-[#9CA3AF] mb-1">{id.description}</p>
                        {id.timestampApprox && (
                          <p className="text-xs text-[#9CA3AF]">⏱️ Environ à {id.timestampApprox}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VideoContent() {
  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="video" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-12">ProSéance Vision</h1>

        {/* Section 1: Analyse Tactique */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-[#F3F4F6]">🎬 Analyse Tactique</h2>
            <span className="text-xs bg-[rgba(57,255,20,0.2)] text-[#39FF14] px-3 py-1 rounded-full">Image</span>
          </div>
          <p className="text-[#9CA3AF] mb-6 text-sm max-w-2xl">
            Analysez vos matchs et entraînements en image. L'IA détecte automatiquement la formation, la composition de l'équipe, et vous propose des consignes tactiques.
          </p>
          <ProSeanceVision />
        </div>

        {/* Divider */}
        <div className="my-16 border-t border-[rgba(57,255,20,0.1)]"></div>

        {/* Section 2: Identification Joueurs */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-[#F3F4F6]">👥 Identification Joueurs</h2>
            <span className="text-xs bg-[rgba(57,255,20,0.2)] text-[#39FF14] px-3 py-1 rounded-full">Vidéo</span>
          </div>
          <p className="text-[#9CA3AF] mb-6 text-sm max-w-2xl">
            Uploadez une vidéo de match ou d'entraînement. L'IA identifie automatiquement vos joueurs en comparant leurs visages avec vos photos d'équipe.
          </p>
          <PlayerVideoIdentification />
        </div>
      </section>
    </main>
  );
}

export default function VideoPage() {
  return (
    <AccessGate>
      <VideoContent />
    </AccessGate>
  );
}
