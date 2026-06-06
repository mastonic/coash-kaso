'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { generateRecipesFromGemini, generateImageNanoBanana } from '@/lib/google';
import { db, collection, query, where, onSnapshot } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useFavorites } from '@/hooks/useFavorites';
import type { Recipe } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { shareRecipe } from '@/lib/share';
import { downloadRecipePDF } from '@/lib/exportPDF';

const LOADING_MESSAGES = [
  "Le Chef IA fouille votre frigo...",
  "Négociation intense avec les légumes...",
  "Calcul du génie culinaire suprême...",
  "Transformation alchimique des restes...",
  "Le frigo confie ses secrets à l'IA...",
  "Hallucination culinaire en cours...",
  "L'algorithme goûte vos ingrédients...",
  "Consultation des étoiles Michelin virtuelles...",
];

const EXPIRY_DAYS_THRESHOLD = 5;

// In-memory cache (cleared on full page reload, no storage quota issues)
// Clé = vibe_diet_ingrédients triés — évite les hits invalides si le contenu change
const recipeMemoryCache = new Map<string, Recipe[]>();
const MAX_CACHE_SIZE = 20;

function makeCacheKey(vibe: string, diet: string, ingredients: string[], servings: number, microOnly: boolean = false): string {
  return `${vibe}_${diet}_${servings}p_${microOnly ? 'micro_' : ''}${[...ingredients].sort().join(',')}`;
}

function normalizeIngredient(s: string) {
  return s.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüç]/g, '').trim();
}

function matchesInventory(recipeIng: string, inventory: string[]) {
  const norm = normalizeIngredient(recipeIng);
  return inventory.some(inv => {
    const n = normalizeIngredient(inv);
    return n.includes(norm) || norm.includes(n);
  });
}

function RecipesContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const { isPremium, features } = useSubscription(user);
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites(user?.uid || null);
  const [activeVibe, setActiveVibe] = useState('Rapide');
  const [activeDiet, setActiveDiet] = useState('Standard');
  const [servings, setServings] = useState(2);
  const [microOnlyMode, setMicroOnlyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [inventoryWithDates, setInventoryWithDates] = useState<{ name: string; scanDate: Date }[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear old recipe sessionStorage entries (legacy, caused quota overflow)
  useEffect(() => {
    try {
      const toDelete: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('fridgechef_recipes_')) toDelete.push(key);
      }
      toDelete.forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }, []);

  // DEEP-LINK FROM DASHBOARD
  useEffect(() => {
    const initial = searchParams.get('initialRecipe');
    if (initial) {
      try { setSelectedRecipe(JSON.parse(decodeURIComponent(initial))); } catch {}
    }
  }, [searchParams]);

  // RESET MICROMODE WHEN LEAVING FLEMME/MICRO
  useEffect(() => {
    if (activeVibe !== 'Flemme' && activeVibe !== 'Micro-ondes') setMicroOnlyMode(false);
  }, [activeVibe]);

  // ROTATING LOADING MESSAGE
  useEffect(() => {
    if (isLoading) {
      setLoadingMsgIdx(0);
      loadingInterval.current = setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 2200);
    } else {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
    }
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current); };
  }, [isLoading]);

  // VIBE OPTIONS
  const vibeOptions = useMemo(() => [
    { id: 'Rapide',      label: 'Rapide',    emoji: '⚡',        icon: null },
    { id: 'En famille',  label: 'Famille',   emoji: '👨‍👩‍👧',      icon: null },
    { id: 'En couple',   label: 'Couple',    emoji: '❤️',        icon: null },
    { id: 'Flemme',      label: 'Flemme',    emoji: '😴',        icon: null },
    { id: 'Micro-ondes', label: 'Micro',     emoji: null,        icon: 'microwave' },
    { id: 'Chef',        label: 'Chef Mode', emoji: '👨‍🍳',       icon: null },
  ], []);

  // DIET OPTIONS — flat list, no headers, with emojis
  const dietOptions = useMemo(() => [
    { id: 'Standard',       label: 'Standard',    emoji: '🍽️' },
    { id: 'Végétarien',     label: 'Végé',        emoji: '🥗' },
    { id: 'Végétalien',     label: 'Vegan',       emoji: '🌱' },
    { id: 'Pescétarien',    label: 'Poisson',     emoji: '🐟' },
    { id: 'Sans gluten',    label: 'Gluten Free', emoji: '🌾' },
    { id: 'Sans lactose',   label: 'Sans Lait',   emoji: '🥛' },
    { id: 'Keto',           label: 'Keto',        emoji: '🥑' },
    { id: 'Hyperprotéiné',  label: 'Muscle+',     emoji: '💪' },
    { id: 'IG Bas',         label: 'IG Bas',      emoji: '📉' },
    { id: 'Paléo',          label: 'Paléo',       emoji: '🦖' },
  ], []);

  // FIRESTORE — load inventory with scan dates
  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, "scans"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const withDates: { name: string; scanDate: Date }[] = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const scanDate: Date = data.timestamp?.toDate?.() || new Date();
        (data.ingredients || []).forEach((item: any) => {
          const name = typeof item === 'object' ? item.name : item;
          withDates.push({ name, scanDate });
        });
      });
      // Deduplicate: keep oldest scan date per ingredient
      const seen = new Map<string, { name: string; scanDate: Date }>();
      withDates.forEach(item => {
        const key = normalizeIngredient(item.name);
        const existing = seen.get(key);
        if (!existing || item.scanDate < existing.scanDate) seen.set(key, item);
      });
      const deduped = Array.from(seen.values());
      setInventoryWithDates(deduped);
      setInventory(deduped.map(d => d.name));
    });
    return () => unsubscribe();
  }, [user]);

  // GENERATE RECIPES — affichage immédiat puis images en arrière-plan
  useEffect(() => {
    async function getRecipes() {
      if (inventory.length === 0) { setIsLoading(false); return; }
      const isMicroVibe = activeVibe === 'Micro-ondes';
      const effectiveMicroOnly = isMicroVibe || microOnlyMode;
      const effectiveVibe = isMicroVibe ? 'Flemme' : activeVibe;
      const cacheKey = makeCacheKey(activeVibe, activeDiet, inventory, servings, effectiveMicroOnly);
      const cached = recipeMemoryCache.get(cacheKey);
      if (cached && cached.length > 0) {
        setRecipes(cached);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const generated = await generateRecipesFromGemini(inventory, effectiveVibe, activeDiet, servings, effectiveMicroOnly);
        // Afficher les cartes immédiatement, sans attendre les images
        const withIds: Recipe[] = generated.map((r: any, idx: number) => ({
          ...r,
          id: idx + Date.now(),
          imageUrl: undefined,
        }));
        setIsLoading(false);
        setRecipes(withIds);
        // Note: vibeHistory est incrémenté server-side par /api/gemini/recipes

        // Charger les images en parallèle et mettre à jour chaque carte individuellement
        withIds.forEach(async (recipe) => {
          try {
            const url = await generateImageNanoBanana(recipe.title, recipe.imageKeywords);
            setRecipes(prev => {
              const updated = prev.map(r => r.id === recipe.id ? { ...r, imageUrl: url } : r);
              if (prev.every(r => r.imageUrl)) {
                // Toutes les images chargées : mettre en cache
                if (recipeMemoryCache.size >= MAX_CACHE_SIZE) {
                  recipeMemoryCache.delete(recipeMemoryCache.keys().next().value!);
                }
                recipeMemoryCache.set(cacheKey, updated);
              }
              return updated;
            });
          } catch {}
        });
      } catch (err: any) {
        setError(err.message || "Erreur lors de la génération des recettes.");
        setIsLoading(false);
      }
    }
    if (!authLoading && user && inventory.length > 0) getRecipes();
  }, [activeVibe, activeDiet, servings, microOnlyMode, inventory, authLoading, user]);

  const speak = async (text: string) => {
    if (!features.voiceAssistant) { toast("L'Assistant Vocal est réservé au plan CHEF (9.99€/mois).", 'warning'); return; }
    const snippet = text.substring(0, 600);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text: snippet }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const { audio, mimeType } = await res.json();
      const bytes = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const el = new Audio(url);
      el.onended = () => URL.revokeObjectURL(url);
      await el.play();
    } catch {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(snippet);
        u.lang = 'fr-FR'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
    }
  };

  // CASTING ANALYSIS for selected recipe
  const castingAnalysis = useMemo(() => {
    if (!selectedRecipe) return { available: [], missing: [], expiring: [] };
    const now = Date.now();
    const recipeIngs: string[] = selectedRecipe.ingredients || [];

    const missing = recipeIngs.filter(ing => !matchesInventory(ing, inventory));

    // Only show expiring items that are actually ingredients of this recipe
    const expiring = inventoryWithDates
      .filter(item => {
        const days = (now - item.scanDate.getTime()) / (1000 * 60 * 60 * 24);
        return days >= EXPIRY_DAYS_THRESHOLD && matchesInventory(item.name, recipeIngs);
      })
      .map(item => item.name);

    // Available = in inventory AND in recipe AND not already listed as expiring
    const available = recipeIngs.filter(
      ing => matchesInventory(ing, inventory) && !expiring.some(e => matchesInventory(e, [ing]))
    );

    return { available, missing, expiring };
  }, [selectedRecipe, inventory, inventoryWithDates]);

  return (
    <div className="bg-background text-white font-body min-h-screen pb-40 italic selection:bg-primary/30">
      <header className="bg-[#0e0e0e]/95 backdrop-blur-3xl sticky top-0 z-40 px-5 pt-5 pb-3 border-b border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">Cuisine & Santé</p>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">VOS MENUS IA</h1>
          </div>
          <div className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 ${isLoading ? 'animate-spin' : ''}`}>
            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
          </div>
        </div>

        {/* VIBE SELECTOR */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-2 border-b border-white/5">
          {vibeOptions.map(vibe => (
            <button
              key={vibe.id}
              onClick={() => setActiveVibe(vibe.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all border text-[10px] font-black uppercase tracking-wider
                ${activeVibe === vibe.id
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-white/5 border-transparent text-white/40'}`}
            >
              {vibe.icon
                ? <span className="material-symbols-outlined text-sm leading-none">{vibe.icon}</span>
                : <span className="text-base leading-none">{vibe.emoji}</span>
              }
              {vibe.label}
            </button>
          ))}
        </div>

        {/* MICROONDE TOGGLE (visible when Flemme or Micro-ondes is active) */}
        {(activeVibe === 'Flemme' || activeVibe === 'Micro-ondes') && (
          <div className="flex gap-2 pb-2 mb-2 border-b border-white/5">
            <button
              onClick={() => setMicroOnlyMode(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                microOnlyMode
                  ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <span className="material-symbols-outlined text-sm">microwave</span>
              Microonde uniquement
            </button>
          </div>
        )}

        {/* DIET FILTERS — compact chips */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2 border-b border-white/5">
          {dietOptions.map(diet => (
            <button
              key={diet.id}
              onClick={() => setActiveDiet(diet.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0 transition-all border text-[9px] font-black uppercase tracking-wider
                ${activeDiet === diet.id
                  ? 'bg-primary text-black border-primary'
                  : 'bg-white/5 text-white/40 border-transparent'}`}
            >
              <span className="text-sm leading-none">{diet.emoji}</span>
              {diet.label}
            </button>
          ))}
        </div>

        {/* CONVIVES */}
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/30 shrink-0">👥 Personnes</span>
          <div className="flex gap-1.5">
            {[1, 2, 4, 6].map(n => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`w-8 h-8 rounded-lg shrink-0 transition-all border text-[10px] font-black
                  ${servings === n
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-white/5 border-transparent text-white/30'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-5">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center gap-5">
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin absolute inset-0"></div>
              <span className="absolute inset-0 flex items-center justify-center text-2xl">🍳</span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-primary/60 italic text-center px-8 transition-all duration-500">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center px-4">
            <span className="text-5xl">😵</span>
            <p className="text-xs font-black uppercase tracking-widest text-red-400">{error}</p>
            <button onClick={() => { setError(null); setInventory(inv => [...inv]); }} className="mt-2 bg-white/10 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10">
              Réessayer
            </button>
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center px-8">
            <span className="text-5xl">🧊</span>
            <p className="text-sm font-black uppercase tracking-widest opacity-50">Frigo vide !</p>
            <p className="text-[11px] text-white/30 leading-relaxed">Scannez votre frigo ou un ticket de caisse pour que l'IA génère vos recettes.</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-4 text-center px-8">
            <span className="text-5xl">🤔</span>
            <p className="text-sm font-black uppercase tracking-widest opacity-50">Rien encore...</p>
            <p className="text-[11px] text-white/30">Sélectionnez une humeur ci-dessus pour lancer la génération.</p>
            <button onClick={() => setInventory(inv => [...inv])} className="mt-2 bg-primary/20 text-primary px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-primary/30">
              Générer maintenant
            </button>
          </div>
        ) : (
          <>
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="group bg-surface-container-low rounded-[2rem] overflow-hidden border border-white/5 active:scale-[0.97] transition-all shadow-xl"
              >
                <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => setSelectedRecipe(recipe)}>
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                      alt={recipe.title}
                      onError={(e) => { e.currentTarget.src = `https://loremflickr.com/800/600/food,dish?seed=${recipe.id}`; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-white/5 animate-pulse flex items-center justify-center">
                      <span className="text-4xl opacity-30">🍳</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(recipe); }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all ${
                        isFavorite(recipe.id.toString())
                          ? 'bg-red-500/20 border-red-500/50 text-red-400'
                          : 'bg-black/40 border-white/20 text-white/60 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{isFavorite(recipe.id.toString()) ? 'favorite' : 'favorite_border'}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); shareRecipe(recipe).then(success => { if (success) toast('Recette partagée!', 'success'); }).catch(() => toast('Erreur lors du partage', 'error')); }}
                      className="w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center hover:text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">share</span>
                    </button>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-widest">IA</span>
                      <span className="text-[10px] font-black uppercase opacity-50 text-white">⏱ {recipe.time || '15 min'}</span>
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white leading-snug">{recipe.title}</h3>
                  </div>
                </div>
              </div>
            ))}

            {!isPremium && [1, 2].map((i) => (
              <div key={`locked-${i}`} className="relative bg-surface-container-low rounded-[2rem] overflow-hidden border border-white/5 shadow-xl">
                <div className="h-52 flex flex-col items-center justify-center bg-black/60 gap-3">
                  <span className="text-3xl">🔒</span>
                  <span className="text-xs font-black uppercase tracking-widest text-white/50">Réservé Premium</span>
                </div>
              </div>
            ))}
          </>
        )}
      </main>

      {/* RECIPE MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-end justify-center animate-in slide-in-from-bottom duration-400">
          <div className="bg-[#0a0a0a] w-full max-w-lg rounded-t-[3rem] overflow-y-auto max-h-[95vh] border-t border-white/10 relative pb-32 shadow-2xl">

            {/* HERO IMAGE */}
            <div className="relative h-64 overflow-hidden rounded-t-[3rem]">
              <img
                src={selectedRecipe.imageUrl}
                className="w-full h-full object-cover"
                alt={selectedRecipe.title}
                onError={(e) => { e.currentTarget.src = `https://loremflickr.com/800/600/food,dish?seed=${selectedRecipe.id}`; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
              <button
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-5 right-5 w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 active:scale-90"
              >
                <span className="material-symbols-outlined text-white text-lg">close</span>
              </button>
            </div>

            <div className="px-7 pt-2 pb-4">
              {/* TITLE + ACTION BUTTONS */}
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-primary leading-tight flex-1 pr-4">{selectedRecipe.title}</h2>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); shareRecipe(selectedRecipe).then(success => { if (success) toast('Recette partagée!', 'success'); }).catch(() => toast('Erreur lors du partage', 'error')); }}
                    className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-primary transition-all"
                    title="Partager"
                  >
                    <span className="material-symbols-outlined text-lg">share</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(selectedRecipe); }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                      isFavorite(selectedRecipe.id.toString())
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : 'bg-white/5 border-white/10 text-white/30 hover:text-white'
                    }`}
                    title="Ajouter aux favoris"
                  >
                    <span className="material-symbols-outlined text-lg">{isFavorite(selectedRecipe.id.toString()) ? 'favorite' : 'favorite_border'}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadRecipePDF(selectedRecipe); }}
                    className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:text-primary transition-all"
                    title="Télécharger PDF"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(selectedRecipe.title + ". " + (selectedRecipe.steps || []).join(". ")); }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border shrink-0 transition-all ${features.voiceAssistant ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white/30 border-white/10'}`}
                    title={features.voiceAssistant ? "Écouter la recette" : "Assistant Vocal (Premium)"}
                  >
                    <span className="material-symbols-outlined text-lg">{features.voiceAssistant ? 'volume_up' : 'lock'}</span>
                  </button>
                </div>
              </div>
              <span className="inline-block text-[10px] bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary font-black uppercase tracking-widest mb-6">⏱ {selectedRecipe.time}</span>

              {/* LE CASTING — available / missing / expiring */}
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">🎬 Le Casting</h3>

                {castingAnalysis.available.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-green-400/70 mb-2">✅ Dans votre frigo</p>
                    <div className="flex flex-wrap gap-1.5">
                      {castingAnalysis.available.map((ing, i) => (
                        <span key={i} className="text-[10px] bg-green-500/10 border border-green-500/25 text-green-300 px-2.5 py-1 rounded-lg font-bold tracking-wide">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {castingAnalysis.expiring.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-400/70 mb-2">⚠️ Bientôt périmés</p>
                    <div className="flex flex-wrap gap-1.5">
                      {castingAnalysis.expiring.map((ing, i) => (
                        <span key={i} className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2.5 py-1 rounded-lg font-bold tracking-wide">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {castingAnalysis.missing.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">🛒 À acheter</p>
                    <div className="flex flex-wrap gap-1.5">
                      {castingAnalysis.missing.map((ing, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-lg font-bold tracking-wide">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEPS */}
              <div className="space-y-6 mb-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-3">📽️ Le Scénario</h3>
                {(selectedRecipe.steps || []).map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="w-9 h-9 rounded-xl bg-primary text-black flex items-center justify-center font-black flex-shrink-0 text-sm shadow-glow">{i + 1}</span>
                    <p className="text-sm italic text-white/85 leading-relaxed font-medium pt-1">{step}</p>
                  </div>
                ))}
              </div>

              {/* NUTRITION */}
              <div className="mb-10">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 text-center mb-6">Analyse Nutritionnelle IA</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Protéines', val: selectedRecipe.nutrition?.protein || 30, color: '#6bfe9c' },
                    { label: 'Lipides',   val: selectedRecipe.nutrition?.fat || 20,     color: '#f8a018' },
                    { label: 'Glucides',  val: selectedRecipe.nutrition?.carbs || 50,   color: '#ffe792' },
                  ].map((nut, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="relative w-18 h-18 flex items-center justify-center" style={{ width: 72, height: 72 }}>
                        <svg width="72" height="72" className="-rotate-90">
                          <circle cx="36" cy="36" r="30" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                          <circle cx="36" cy="36" r="30" fill="transparent" stroke={nut.color} strokeWidth="5"
                            strokeDasharray="188.5" strokeDashoffset={188.5 * (1 - nut.val / 100)}
                            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                        <span className="absolute text-xs font-black text-white">{nut.val}%</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-50">{nut.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-full bg-primary text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs italic shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
              >
                🍽️ J'AI CUISINÉ CE CHEF-D'ŒUVRE
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .shadow-glow { box-shadow: 0 0 24px rgba(107,254,156,0.25); }
      `}</style>
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}
