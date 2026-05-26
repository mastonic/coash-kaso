'use client';

import { useState, useRef, useEffect } from 'react';
import { initOfflineDetection, isOnline } from '@/lib/offline';
import { sanitizeErrorMessage } from '@/lib/error-messages';
import { toast } from '@/lib/toast';

type ProSeanceLiveState = 'idle' | 'recording' | 'analyzing' | 'complete' | 'error';

interface TacticalRecommendation {
  issue: string;
  recommendation: string;
  type: 'défensif' | 'transition' | 'pressing' | 'possession' | 'technique';
  duration: number;
}

interface ProSeanceLiveProps {
  onAddExercise?: (recommendation: TacticalRecommendation) => void;
}

export function ProSeanceLive({ onAddExercise }: ProSeanceLiveProps = {}) {
  const [state, setState] = useState<ProSeanceLiveState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recommendations, setRecommendations] = useState<TacticalRecommendation[]>([]);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount and beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === 'recording' || state === 'analyzing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [state]);

  const startRecording = async () => {
    try {
      initOfflineDetection();

      if (!isOnline()) {
        setError('❌ Mode hors ligne - connexion requise');
        setState('error');
        return;
      }

      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = handleRecordingStop;

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);
      setIsExpanded(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // Max 5 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError('❌ Impossible d\'accéder au microphone (#144)');
      console.error('Microphone error:', err);
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleRecordingStop = async () => {
    setState('analyzing');
    setAnalysisProgress(0);

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    let progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 80) return prev;
        return prev + Math.random() * 20;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Échec de l\'analyse (vérifiez la connexion)');
      }

      const data = await response.json();

      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      setAnalysisProgress(100);

      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);

        // Persist recommendations to localStorage for bonus exercises
        if (onAddExercise && data.recommendations.length > 0) {
          const bonusExercises = data.recommendations.map((rec: TacticalRecommendation) => ({
            issue: rec.issue,
            recommendation: rec.recommendation,
            type: rec.type,
            duration: rec.duration,
          }));
          localStorage.setItem('mastro_bonus_exercises', JSON.stringify(bonusExercises));
        }

        setState('complete');
      } else if (data.error) {
        setError(`Erreur: ${sanitizeErrorMessage(data.error)}`);
        setState('error');
      } else {
        setError('Format de réponse invalide');
        setState('error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      console.error('Analysis error:', err);

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
    setRecordingTime(0);
    setAnalysisProgress(0);
    setRecommendations([]);
    setError('');
    setIsExpanded(false);
  };

  const retryAnalysis = async () => {
    setError('');
    setAnalysisProgress(0);
    setRecommendations([]);
    setState('analyzing');

    // Re-run handleRecordingStop to make actual API call with existing audio
    if (audioChunksRef.current.length > 0) {
      await handleRecordingStop();
    } else {
      setError('❌ Aucun audio à analyser. Veuillez enregistrer d\'abord.');
      setState('error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      défensif: '🛡️',
      transition: '⚡',
      pressing: '🔥',
      possession: '⚽',
      technique: '🎯',
    };
    return icons[type] || '🎯';
  };

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 transition-all duration-300 ${isExpanded ? 'w-80 md:w-96' : 'w-auto'}`}>
      {/* Expanded Card - Recording/Analysis/Results */}
      {isExpanded && (
        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.3)] rounded-3xl p-4 md:p-6 shadow-[0_0_50px_rgba(57,255,20,0.2)] animate-pop mb-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-xl md:text-2xl">🎙️</div>
              <div>
                <h3 className="text-[#F3F4F6] font-black text-base md:text-lg">ProSéance Live</h3>
                <p className="text-[#9CA3AF] text-xs">Dictaphone Tactique IA</p>
              </div>
            </div>
            <button
              onClick={reset}
              aria-label="Fermer ProSéance Live"
              className="text-[#9CA3AF] hover:text-[#39FF14] transition-colors disabled:opacity-50"
              disabled={state === 'recording' || state === 'analyzing'}
            >
              ✕
            </button>
          </div>

          {/* Recording State */}
          {state === 'recording' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in-up">
              {/* Timer */}
              <div className="text-center space-y-2 md:space-y-3">
                <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-[#39FF14] to-[#10B981] animate-pulse">
                  <span className="text-4xl md:text-5xl">🎤</span>
                </div>
                <p className="text-[#F3F4F6] font-bold text-lg md:text-xl">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-[#39FF14] text-sm font-bold">
                  🔴 Enregistrement en cours...
                </p>
                <p className="text-[#9CA3AF] text-xs">
                  ProSéance écoute le terrain
                </p>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-end justify-center gap-1 h-12 md:h-16">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-[#39FF14] to-[#10B981] rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Stop Button */}
              <button
                onClick={stopRecording}
                className="w-full py-2 md:py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all duration-300 uppercase text-sm md:text-base min-h-[44px]"
              >
                ⏹️ Arrêter l'écoute
              </button>
            </div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <div className="space-y-4 md:space-y-6 animate-fade-in-up">
              {/* Analyzing Icon */}
              <div className="text-center space-y-2 md:space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-[#39FF14] to-[#10B981] animate-pulse">
                  <span className="text-2xl md:text-3xl animate-spin">⚙️</span>
                </div>
                <p className="text-[#F3F4F6] font-bold text-sm md:text-base">
                  Analyse sémantique des consignes
                </p>
                <p className="text-[#9CA3AF] text-xs md:text-sm">
                  Traitement par Gemini AI...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
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
                <p className="text-[#9CA3AF] text-xs text-center">
                  {Math.round(Math.min(analysisProgress, 100))}%
                </p>
              </div>

              {/* Shimmer Lines */}
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-3 rounded bg-gradient-to-r from-[#0A0F0D] via-[#1A3A28] to-[#0A0F0D] bg-[length:1000px_100%] animate-shimmer"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Complete State - Recommendations */}
          {state === 'complete' && recommendations.length > 0 && (
            <div className="space-y-3 md:space-y-4 animate-fade-in-up">
              <div className="text-center mb-3 md:mb-4">
                <p className="text-[#39FF14] font-bold text-base md:text-lg">✨ Analyse Complétée</p>
              </div>

              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0F0D] border border-[#10B981] rounded-lg p-3 md:p-4 animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className="text-base md:text-lg flex-shrink-0 mt-0.5">🎯</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F3F4F6] font-bold text-xs md:text-sm">
                        Détection: {rec.issue}
                      </p>
                      <p className="text-[#9CA3AF] text-xs mt-1 line-clamp-2">
                        ➜ {rec.recommendation}
                      </p>
                      <div className="flex items-center gap-1 md:gap-2 mt-2 flex-wrap">
                        <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-[#39FF14]/20 text-[#39FF14] rounded text-xs font-bold flex items-center gap-0.5">
                          {getTypeIcon(rec.type)} {rec.type}
                        </span>
                        <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-[#10B981]/20 text-[#10B981] rounded text-xs font-bold">
                          {rec.duration}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 md:gap-2 pt-2">
                <button
                  onClick={reset}
                  className="py-1.5 md:py-2 border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[#39FF14]/10 transition-all text-xs md:text-sm min-h-[40px] md:min-h-[44px]"
                >
                  Nouvelle Analyse
                </button>
                <button
                  onClick={() => {
                    recommendations.forEach(rec => {
                      onAddExercise?.(rec);
                    });
                    reset();
                  }}
                  className="py-1.5 md:py-2 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all text-xs md:text-sm min-h-[40px] md:min-h-[44px]"
                >
                  Intégrer ({recommendations.length})
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="space-y-3 md:space-y-4 animate-fade-in-up">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="text-3xl md:text-4xl">⚠️</div>
                <p className="text-[#F3F4F6] font-bold text-sm md:text-base">Erreur d'analyse</p>
                <p className="text-[#9CA3AF] text-xs md:text-sm">{error}</p>
              </div>

              {/* Error Actions */}
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                <button
                  onClick={reset}
                  className="py-1.5 md:py-2 border border-[#39FF14] text-[#39FF14] font-bold rounded-lg hover:bg-[#39FF14]/10 transition-all text-xs md:text-sm min-h-[40px] md:min-h-[44px]"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={retryAnalysis}
                  className="py-1.5 md:py-2 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:scale-105 transition-all text-xs md:text-sm min-h-[40px] md:min-h-[44px]"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => {
          if (state === 'idle') {
            startRecording();
          } else if (state === 'recording') {
            stopRecording();
          }
        }}
        disabled={state === 'analyzing' || state === 'error'}
        className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-bold text-2xl md:text-3xl transition-all duration-300 group ${
          state === 'recording'
            ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.6)]'
            : 'bg-gradient-to-r from-[#39FF14] to-[#10B981] hover:scale-110 hover:shadow-[0_0_50px_rgba(57,255,20,0.8)] disabled:opacity-50'
        }`}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-30 rounded-full bg-white transition-opacity duration-300" />
        <span className="relative z-10">🎙️</span>
      </button>

      {/* Mini Indicator - When Collapsed */}
      {!isExpanded && state !== 'idle' && (
        <div className={`absolute -top-2 -right-2 w-5 h-5 ${
          state === 'analyzing' ? 'bg-yellow-500' : state === 'error' ? 'bg-red-500' : 'bg-red-500'
        } rounded-full animate-pulse`} />
      )}
    </div>
  );
}
