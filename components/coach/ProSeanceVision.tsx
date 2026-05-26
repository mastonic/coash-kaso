'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { initOfflineDetection, isOnline } from '@/lib/offline';
import { sanitizeErrorMessage } from '@/lib/error-messages';

type ProSeanceVisionState = 'idle' | 'preview' | 'analyzing' | 'complete' | 'error';

interface VisionAnalysisResult {
  formation: string;
  composition: Array<{
    poste: string;
    nom: string;
  }>;
  consignes: string[];
  observations: string;
  detectedPlayers?: string[];
}

export function ProSeanceVision() {
  const [state, setState] = useState<ProSeanceVisionState>('idle');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initOfflineDetection();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImagePreview(imageUrl);
      setState('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;

    if (!isOnline()) {
      setError('Mode hors ligne - connexion requise');
      setState('error');
      return;
    }

    setState('analyzing');
    setAnalysisProgress(0);
    setError('');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 25;
      });
    }, 200);
    analysisIntervalRef.current = progressInterval;

    try {
      const base64Image = imagePreview.split(',')[1];

      const response = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Échec de l\'analyse (vérifiez le serveur)');
      }

      const data = await response.json();

      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      setAnalysisProgress(100);

      if (data.formation) {
        setAnalysisResult(data);
        setState('complete');
      } else if (data.error) {
        setError(`Erreur: ${data.error}`);
        setState('error');
      } else {
        setError('Format de réponse invalide');
        setState('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error('Vision analysis error:', err);

      if (!isOnline()) {
        setError('Mode hors ligne - impossible de poursuivre');
      } else if (err instanceof Error && err.name === 'AbortError') {
        setError('L\'analyse a pris trop de temps. Veuillez réessayer.');
      } else {
        setError(sanitizeErrorMessage(err));
      }
      setState('error');
    }
  };

  const reset = () => {
    setState('idle');
    setImagePreview('');
    setAnalysisProgress(0);
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPosteEmoji = (poste: string) => {
    const emojis: Record<string, string> = {
      GK: '🧤',
      CB: '🛡️',
      LB: '⬅️',
      RB: '➡️',
      LM: '🔄',
      RM: '🔄',
      CM: '🔀',
      LW: '⬅️🎯',
      RW: '➡️🎯',
      ST: '⚽',
      CF: '⚽',
      CAM: '🎯',
      CDM: '🛡️🔀',
    };
    return emojis[poste] || '👤';
  };

  const handleValidateComposition = () => {
    if (!analysisResult) return;

    const playerNames = analysisResult.composition
      .map(player => player.nom)
      .filter(nom => nom && nom !== 'Inconnu');

    if (playerNames.length === 0) {
      toast.warning('Aucun joueur avec un nom détecté dans l\'image');
      return;
    }

    try {
      localStorage.setItem('mastro_attendance', JSON.stringify({
        formation: analysisResult.formation,
        players: playerNames,
        timestamp: new Date().toISOString(),
      }));

      toast.success(`✨ Compo validée: ${analysisResult.formation} (${playerNames.length} joueurs)`);
      reset();
    } catch (err) {
      console.error('Error saving composition:', err);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Idle State - Capture Button */}
      {state === 'idle' && (
        <div className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] p-8 space-y-6 hover:border-[rgba(57,255,20,0.4)] transition-all duration-300 animate-pop">
          <div className="text-center space-y-4">
            <div className="text-6xl">📸</div>
            <h3 className="text-[#F3F4F6] font-black text-2xl">ProSéance Vision</h3>
            <p className="text-[#9CA3AF] text-sm">Scanner Tactique du Vestiaire</p>
            <p className="text-[#9CA3AF] text-xs">Photographiez votre tableau blanc • Analysez la formation et consignes</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Capturer une photo du tableau tactique"
            className="w-full py-4 bg-gradient-to-r from-[#39FF14] to-[#10B981] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all duration-300 uppercase group relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-white transition-opacity" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              📷 Capturer l'Écran Tactique
            </span>
          </button>
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && imagePreview && (
        <div className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] p-8 space-y-6 overflow-hidden">
          <div className="space-y-4">
            <h4 className="text-[#F3F4F6] font-bold text-lg">Aperçu de l'Image</h4>
            <img
              src={imagePreview}
              alt="Tableau tactique"
              className="w-full h-64 object-cover rounded-lg border border-[rgba(57,255,20,0.2)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={reset}
              aria-label="Annuler et revenir"
              className="py-3 border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[#39FF14]/10 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleAnalyze}
              aria-label="Analyser l'image"
              className="py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all"
            >
              🔍 Analyser
            </button>
          </div>
        </div>
      )}

      {/* Analyzing State - Scanner Animation */}
      {state === 'analyzing' && (
        <div className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] p-8 space-y-6 overflow-hidden">
          {imagePreview && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-[#0A0F0D]">
              <img
                src={imagePreview}
                alt="Analyse en cours"
                className="w-full h-full object-cover opacity-50"
              />
              {/* Scanner Line Animation */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent animate-pulse"
                  style={{
                    top: `${analysisProgress}%`,
                    boxShadow: '0 0 20px rgba(57,255,20,0.8)',
                    animation: `scan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                  }}
                />
              </div>
              <style>{`
                @keyframes scan {
                  0% { top: 0%; opacity: 1; }
                  50% { opacity: 0.8; }
                  100% { top: 100%; opacity: 0; }
                }
              `}</style>
            </div>
          )}

          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#39FF14] to-[#10B981] animate-pulse">
              <span className="text-2xl animate-spin">⚙️</span>
            </div>
            <div className="space-y-2">
              <p className="text-[#F3F4F6] font-bold">Analyse Tactique</p>
              <p className="text-[#9CA3AF] text-sm">Gemini Vision scanne le tableau...</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-4">
              <div
                className="w-full h-2 bg-[#0A0F0D] rounded-full overflow-hidden border border-[rgba(57,255,20,0.2)]"
                role="progressbar"
                aria-valuenow={Math.round(analysisProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progression de l'analyse"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#39FF14] to-[#10B981] transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                />
              </div>
              <p className="text-[#9CA3AF] text-xs">{Math.round(Math.min(analysisProgress, 100))}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete State - Results */}
      {state === 'complete' && analysisResult && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Formation Badge */}
          <div className="bg-gradient-to-r from-[#39FF14] to-[#10B981] rounded-2xl p-8 text-center animate-pop">
            <p className="text-[#0A0F0D] text-xs font-bold uppercase mb-2">Formation Détectée</p>
            <p className="text-[#0A0F0D] font-black text-4xl">{analysisResult.formation}</p>
          </div>

          {/* Composition */}
          <div className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] p-6 space-y-4">
            <h4 className="text-[#F3F4F6] font-bold text-lg flex items-center gap-2">
              👥 Composition Extraite
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {analysisResult.composition.map((player, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0F0D] rounded-lg p-3 text-center border border-[rgba(57,255,20,0.1)] hover:border-[rgba(57,255,20,0.3)] transition-all"
                >
                  <div className="text-2xl mb-1">{getPosteEmoji(player.poste)}</div>
                  <p className="text-[#9CA3AF] text-xs font-bold">{player.poste}</p>
                  <p className="text-[#F3F4F6] text-xs font-bold mt-1 truncate">{player.nom}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consignes */}
          <div className="bg-[#141E1A] rounded-2xl border border-[rgba(57,255,20,0.2)] p-6 space-y-4">
            <h4 className="text-[#F3F4F6] font-bold text-lg flex items-center gap-2">
              📋 Consignes Détectées
            </h4>
            <div className="space-y-2">
              {analysisResult.consignes.map((consigne, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0F0D] rounded-lg p-4 border-l-2 border-[#39FF14] text-[#F3F4F6] text-sm flex items-start gap-3"
                >
                  <span className="text-[#39FF14] font-bold mt-0.5">✓</span>
                  <span>{consigne}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations */}
          {analysisResult.observations && (
            <div className="bg-[#0A0F0D] rounded-lg p-4 border border-[rgba(57,255,20,0.2)] text-[#9CA3AF] text-sm italic">
              💡 {analysisResult.observations}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={reset}
              aria-label="Prendre une nouvelle photo"
              className="py-3 border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[#39FF14]/10 transition-all"
            >
              Nouvelle Photo
            </button>
            <button
              onClick={handleValidateComposition}
              aria-label="Valider la composition détectée"
              className="py-3 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all"
            >
              Valider la Compo
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="bg-[#141E1A] rounded-2xl border border-red-500/30 p-8 space-y-4 animate-fade-in-up">
          <div className="text-center space-y-3">
            <div className="text-4xl">⚠️</div>
            <p className="text-[#F3F4F6] font-bold">Erreur d'analyse</p>
            <p className="text-[#9CA3AF] text-sm">{error}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAnalyze}
              aria-label="Réessayer l'analyse"
              className="py-3 border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[#39FF14]/10 transition-all"
            >
              Réessayer
            </button>
            <button
              onClick={reset}
              aria-label="Annuler et réinitialiser"
              className="py-3 bg-red-500/20 text-red-300 font-bold rounded-lg hover:bg-red-500/30 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
