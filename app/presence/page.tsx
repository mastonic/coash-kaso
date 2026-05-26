'use client';

import { useState, useEffect, useRef } from 'react';
import { ToolsNav } from '@/components/ToolsNav';
import { AccessGate } from '@/components/AccessGate';

interface Player {
  id: string;
  name: string;
  position: string;
  number: string;
  photoUrl?: string;
}

interface IdentificationResult {
  matchedPlayerId: string | null;
  matchedPlayerName: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface Attendance {
  date: string;
  presentPlayerIds: string[];
  updatedAt: string;
}

function PresenceContent() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [attendance, setAttendance] = useState<Attendance>({
    date: new Date().toISOString().split('T')[0],
    presentPlayerIds: [],
    updatedAt: '',
  });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [identification, setIdentification] = useState<IdentificationResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [manualSelection, setManualSelection] = useState<string | null>(null);
  const [noPhotosWarning, setNoPhotosWarning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setMounted(true);
    loadTeamAndAttendance();
  }, []);

  const loadTeamAndAttendance = async () => {
    try {
      setLoading(true);
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      // Load players
      const playersRes = await fetch(`/api/team?email=${encodeURIComponent(email)}`);
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        setPlayers(playersData.players || []);
      }

      // Load attendance
      const attendanceRes = await fetch(
        `/api/attendance?email=${encodeURIComponent(email)}&date=${attendance.date}`
      );
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        setAttendance(attendanceData.attendance);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (streamActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [streamActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      setStreamActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Impossible d\'accéder à la caméra');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setStreamActive(false);
      setIdentification(null);
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setAnalyzing(true);

      // Capture frame
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];

      // Identify player
      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const playersWithPhotos = players.filter(p => p.photoUrl);
      if (playersWithPhotos.length === 0) {
        setNoPhotosWarning(true);
        return;
      }

      const response = await fetch('/api/identify-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          targetImageBase64: imageData,
          players: playersWithPhotos,
        }),
      });

      if (!response.ok) throw new Error('Failed to identify');

      const result = await response.json();
      setIdentification(result);

      if (result.matchedPlayerId && result.confidence !== 'low') {
        setShowConfirmation(true);
      } else {
        setManualSelection(null);
      }
    } catch (error) {
      console.error('Error identifying player:', error);
      alert('Erreur lors de l\'identification');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmPresence = async () => {
    try {
      const playerId = identification?.matchedPlayerId || manualSelection;
      if (!playerId) {
        alert('Sélectionnez un joueur');
        return;
      }

      const email = localStorage.getItem('mastro_user');
      if (!email) return;

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          playerId,
          date: attendance.date,
        }),
      });

      if (!response.ok) throw new Error('Failed to mark attendance');

      const result = await response.json();
      setAttendance(result.attendance);
      setShowConfirmation(false);
      setIdentification(null);
      setManualSelection(null);

      // Feedback
      const playerName = players.find(p => p.id === playerId)?.name || 'Joueur';
      alert(`✓ ${playerName} marqué présent`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Erreur lors du marquage de présence');
    }
  };

  if (!mounted) return null;

  const presentCount = attendance.presentPlayerIds.length;
  const totalPlayers = players.length;
  const confidenceColor = {
    high: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-red-500/20 text-red-400',
  };

  return (
    <main className="min-h-screen bg-[#0A0F0D]">
      <ToolsNav currentPage="presence" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-[#F3F4F6] mb-3">Appel Automatique</h1>
          <div className="flex items-center justify-between">
            <p className="text-[#9CA3AF] text-lg">
              {presentCount}/{totalPlayers} joueurs présents
            </p>
            <p className="text-[#39FF14] font-bold">{attendance.date}</p>
          </div>
        </div>

        {/* No photos warning */}
        {noPhotosWarning && (
          <div className="mb-6 bg-[#1a0a0a] border-2 border-red-400 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl flex-shrink-0">📸</div>
            <div className="flex-1">
              <p className="font-bold text-red-400 mb-1">Aucune photo de joueur enregistrée</p>
              <p className="text-[#9CA3AF] text-sm">
                La reconnaissance faciale nécessite une photo de référence pour chaque joueur.
                Ajoutez les photos depuis la page <strong className="text-[#F3F4F6]">Gestion de l'équipe</strong>.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a
                href="/team"
                className="px-4 py-2 bg-[#39FF14] text-[#0A0F0D] font-black text-sm rounded-lg hover:scale-105 transition-all"
              >
                Gérer l'équipe →
              </a>
              <button
                onClick={() => setNoPhotosWarning(false)}
                className="px-3 py-2 border border-red-400/40 text-red-400 text-sm rounded-lg hover:bg-red-400/10 transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Camera Section */}
          <div className="md:col-span-2">
            <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">📷 Scanner Visage</h2>

              {!streamActive ? (
                <button
                  onClick={startCamera}
                  disabled={loading}
                  className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-4 hover:scale-105 transition-all disabled:opacity-50"
                >
                  ▶️ Démarrer la Caméra
                </button>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                    style={{ aspectRatio: '4/3' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex gap-3">
                    <button
                      onClick={captureAndIdentify}
                      disabled={analyzing}
                      className="flex-1 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-3 hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {analyzing ? '⏳ Analyse...' : '📸 Capturer'}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-500/20 text-red-400 font-bold rounded-lg py-3 hover:bg-red-500/30 transition-all"
                    >
                      ⏹️ Arrêter
                    </button>
                  </div>
                </div>
              )}

              {/* Identification Result */}
              {identification && (
                <div
                  className={`mt-6 p-6 rounded-xl border ${
                    identification.confidence === 'high'
                      ? 'bg-green-500/10 border-green-500/50'
                      : identification.confidence === 'medium'
                        ? 'bg-yellow-500/10 border-yellow-500/50'
                        : 'bg-red-500/10 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[#9CA3AF] text-sm mb-1">Résultat d\'identification</p>
                      <h3 className="text-2xl font-bold text-[#F3F4F6]">
                        {identification.matchedPlayerName}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${confidenceColor[identification.confidence]}`}
                    >
                      {identification.confidence === 'high'
                        ? '✓ Haute confiance'
                        : identification.confidence === 'medium'
                          ? '? Moyenne confiance'
                          : '✗ Basse confiance'}
                    </span>
                  </div>
                  <p className="text-[#9CA3AF] text-sm">{identification.reason}</p>

                  {identification.confidence === 'low' && (
                    <div className="mt-4">
                      <label className="block text-sm text-[#9CA3AF] mb-2">Sélectionner manuellement:</label>
                      <select
                        value={manualSelection || ''}
                        onChange={(e) => setManualSelection(e.target.value)}
                        className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14]"
                      >
                        <option value="">-- Choisir un joueur --</option>
                        {players.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (#{p.number})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">✓ Présences</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {players.map(player => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    attendance.presentPlayerIds.includes(player.id)
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-[rgba(57,255,20,0.05)] border-[rgba(57,255,20,0.1)]'
                  }`}
                >
                  <span className="text-lg">
                    {attendance.presentPlayerIds.includes(player.id) ? '✓' : '○'}
                  </span>
                  <span className="text-sm text-[#F3F4F6] flex-1">{player.name}</span>
                  <span className="text-xs text-[#9CA3AF]">#{player.number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && identification && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-[#141E1A] border border-[#39FF14] rounded-2xl p-8 max-w-sm">
              <h3 className="text-2xl font-bold text-[#F3F4F6] mb-4">Confirmer la présence ?</h3>
              <div className="mb-6 p-4 bg-[rgba(57,255,20,0.1)] rounded-lg">
                <p className="text-lg text-[#39FF14] font-bold">{identification.matchedPlayerName}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmPresence}
                  className="flex-1 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg py-3 hover:scale-105 transition-all"
                >
                  ✓ Confirmer
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 bg-red-500/20 text-red-400 font-bold rounded-lg py-3 hover:bg-red-500/30 transition-all"
                >
                  ✗ Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PresencePage() {
  return (
    <AccessGate>
      <PresenceContent />
    </AccessGate>
  );
}
