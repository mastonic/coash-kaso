'use client';

import { useState, useEffect } from 'react';
import { HUDBar } from '@/components/HUDBar';
import { SessionPlaybook } from '@/components/SessionPlaybook';
import { SessionLivret } from '@/components/SessionLivret';
import { GenerationLoader } from '@/components/GenerationLoader';
import { ProSeanceLive } from '@/components/coach/ProSeanceLive';
import { AccessGate } from '@/components/AccessGate';
import { ToolsNav } from '@/components/ToolsNav';
import { mockSessionData } from '@/lib/mock-data';
import type { SessionData } from '@/lib/gemini';

const THEMES = ['possession', 'pressing', 'transitions', 'centre', 'ailes', 'controle', 'vitesse', 'phases', '1v1'];
const LOADS = ['Récupération', 'Modérée', 'Élevée'];
const SCHOOLS = ['Française', 'Espagnole', 'Allemande', 'Hollandaise', 'Brésilienne', 'Argentine', 'Italienne'];
const CATEGORIES = ['U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'Senior'];

function SessionContent() {
  const [theme, setTheme] = useState('possession');
  const [load, setLoad] = useState('Modérée');
  const [school, setSchool] = useState('Française');
  const [playerCount, setPlayerCount] = useState('11');
  const [category, setCategory] = useState('Senior');
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showLivret, setShowLivret] = useState(false);
  const [bonusExercises, setBonusExercises] = useState<Array<{
    id: string;
    title: string;
    objective: string;
    content: string;
    duration: number;
    type: 'défensif' | 'transition' | 'pressing' | 'possession' | 'technique';
    source: 'mastro-live';
  }>>([]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('session_prefs');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setTheme(prefs.theme || 'possession');
      setLoad(prefs.load || 'Modérée');
      setSchool(prefs.school || 'Française');
      setPlayerCount(prefs.playerCount || '11');
      setCategory(prefs.category || 'Senior');
    }
    setMounted(true);
  }, []);

  const generateSession = async () => {
    setLoading(true);
    setError('');
    try {
      // Save preferences to localStorage
      localStorage.setItem('session_prefs', JSON.stringify({
        theme,
        load,
        school,
        playerCount,
        category,
      }));

      // Call API to generate session via Gemini
      const response = await fetch('/api/generate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          load,
          school,
          playerCount: parseInt(playerCount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const { data: generatedData } = await response.json();

      // Save session to history with full content
      const newSession = {
        id: `session-${Date.now()}`,
        theme,
        load,
        school,
        playerCount: parseInt(playerCount),
        date: new Date().toISOString(),
        content: generatedData, // Save full session content
      };

      const existingSessions = localStorage.getItem('mastro_sessions');
      const sessionsArray = existingSessions ? JSON.parse(existingSessions) : [];
      sessionsArray.push(newSession);
      localStorage.setItem('mastro_sessions', JSON.stringify(sessionsArray));

      setSession(generatedData);
    } catch (err) {
      console.error('Generation error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erreur génération';
      setError(errorMsg.includes('timeout') ? 'Génération trop lente - réessaye!' : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToConfig = () => {
    // Save current preferences before returning
    localStorage.setItem('session_prefs', JSON.stringify({
      theme,
      load,
      school,
      playerCount,
      category,
    }));
    setSession(null);
    setShowLivret(false);
  };

  const handleAddBonusExercise = (recommendation: {
    issue: string;
    recommendation: string;
    type: 'défensif' | 'transition' | 'pressing' | 'possession' | 'technique';
    duration: number;
  }) => {
    const newExercise = {
      id: `bonus-${Date.now()}`,
      title: recommendation.recommendation.split(':')[0] || recommendation.recommendation.substring(0, 30),
      objective: recommendation.issue,
      content: recommendation.recommendation,
      duration: recommendation.duration,
      type: recommendation.type,
      source: 'mastro-live' as const,
    };
    setBonusExercises([...bonusExercises, newExercise]);
  };

  if (!mounted) return null;

  if (showLivret && session) {
    return (
      <SessionLivret
        data={session}
        theme={theme}
        load={load}
        school={school}
        playerCount={parseInt(playerCount)}
        category={category}
        clubName="ProSéance"
      />
    );
  }

  if (session) {
    return (
      <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
        <HUDBar theme={theme} load={load} school={school} playerCount={parseInt(playerCount)} />

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleReturnToConfig}
              className="text-[#39FF14] hover:text-[#10B981] font-bold transition-all duration-200 hover:scale-110 hover:drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]"
            >
              ← Retour à la configuration
            </button>
            <button
              onClick={() => setShowLivret(true)}
              className="ml-auto px-6 py-2 bg-[#39FF14] text-[#0A0F0D] font-bold rounded-lg hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-all"
            >
              📖 Afficher en Livret
            </button>
          </div>
          <SessionPlaybook
            data={session}
            bonusExercises={bonusExercises}
            theme={theme}
            load={load}
            school={school}
            playerCount={parseInt(playerCount)}
          />
        </div>

        {/* ProSéance Live - Dictaphone Tactique */}
        <ProSeanceLive onAddExercise={handleAddBonusExercise} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0F0D] animate-fade-in">
      <ToolsNav currentPage="session" />

      <section className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black text-[#F3F4F6] mb-8 md:mb-12 animate-fade-in-up">Générateur de Séance</h1>

        <div className="bg-[#141E1A] border border-[rgba(57,255,20,0.2)] rounded-2xl p-6 md:p-8 space-y-6 animate-fade-in-up transition-all duration-300 hover:border-[rgba(57,255,20,0.4)]">
          {/* Theme */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">Thème</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Load */}
          <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">Charge du jour</label>
            <select
              value={load}
              onChange={(e) => setLoad(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200"
            >
              {LOADS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* School */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">École de Jeu</label>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200"
            >
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Player Count */}
          <div className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">Nombre de joueurs</label>
            <input
              type="number"
              min="1"
              max="30"
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200"
            />
          </div>

          {/* Category */}
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <label className="block text-[#F3F4F6] font-bold mb-2 uppercase text-xs">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0A0F0D] border border-[rgba(57,255,20,0.2)] rounded-lg px-4 py-3 text-[#F3F4F6] focus:outline-none focus:border-[#39FF14] focus:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg px-4 py-3 text-red-200 animate-fade-in-up">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateSession}
            disabled={loading}
            className="w-full bg-[#39FF14] text-[#0A0F0D] font-bold py-4 md:py-3 rounded-lg transition-all duration-300 uppercase group disabled:opacity-50 animate-pop hover:scale-105 hover:shadow-[0_0_50px_rgba(57,255,20,0.7)] min-h-[48px] md:min-h-[44px] text-sm md:text-base"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-[#0A0F0D] border-t-transparent rounded-full animate-spin" />
                Génération...
              </span>
            ) : (
              'Générer Séance'
            )}
          </button>
        </div>

        {/* Loading Shimmer */}
        {loading && (
          <div className="mt-12 animate-fade-in-up">
            <GenerationLoader />
          </div>
        )}
      </section>
    </main>
  );
}

export default function SessionPage() {
  return (
    <AccessGate>
      <SessionContent />
    </AccessGate>
  );
}
