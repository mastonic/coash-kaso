/**
 * POST /api/generate-v2 — Génération de séance avec anti-répétition complet.
 *
 * Flux :
 *   1. getSessionHistoryForGemini(teamId) → exercisesToAvoid[]
 *   2. getAvailableExercises({ category, ageGroup, excludeIds }) → catalogue
 *   3. buildGeminiPrompt(team, config, history, catalogue) → prompt enrichi
 *   4. Appel Gemini API
 *   5. saveGeneratedSession(coachId, teamId, parsed) → sauvegarde + stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';
import {
  getSessionHistoryForGemini,
  getAvailableExercises,
  saveGeneratedSession,
  hashPrompt,
  type SaveSessionData,
} from '@/lib/proseance-firebase';
import {
  buildGeminiPrompt,
  parseGeminiV2Response,
  type SessionConfig,
} from '@/lib/gemini-prompt';
import type { Team, ExerciseCategory } from '@/lib/firestore-types';

export const maxDuration = 120;

const CATEGORY_FROM_THEME: Record<string, ExerciseCategory> = {
  possession: 'possession',
  pressing: 'pressing',
  transitions: 'transition',
  transition_offensive: 'transition',
  transition_defensive: 'transition',
  finition: 'shooting',
  finition_tt: 'shooting',
  frappe: 'shooting',
  ailes: 'tactical',
  centre: 'passing',
  technique: 'passing',
  passe: 'passing',
  controle: 'passing',
  conduite: 'dribbling',
  conduite_balle: 'dribbling',
  dribble: 'dribbling',
  duels: 'defending',
  un_contre_un_offensif: 'dribbling',
  un_contre_un_defensif: 'defending',
  vitesse: 'fitness',
  vitesse_reaction: 'fitness',
  defense: 'defending',
  animation_defensive: 'defending',
  animation_offensive: 'possession',
  corner: 'set_piece',
  coup_franc: 'set_piece',
  penalty: 'set_piece',
  endurance: 'fitness',
  coordination_agilite: 'fitness',
  ppg: 'fitness',
  gardien: 'goalkeeping',
  relance_gk: 'goalkeeping',
  blocage_gk: 'goalkeeping',
  plongeon_gk: 'goalkeeping',
  sorties_gk: 'goalkeeping',
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const email = typeof body.email === 'string' ? body.email.toLowerCase() : null;
    const teamId = typeof body.teamId === 'string' ? body.teamId : email ?? 'default';
    const coachId = typeof body.coachId === 'string' ? body.coachId : email ?? 'anon';

    // ── Validation des paramètres ──────────────────────────────────────────
    const config: SessionConfig = {
      duration: Math.min(150, Math.max(30, Number(body.duree ?? body.duration ?? 90))),
      objective: typeof body.objective === 'string' ? body.objective : '',
      theme: typeof body.theme === 'string' ? body.theme : 'possession',
      subtheme: typeof body.subtheme === 'string' ? body.subtheme : undefined,
      intensity: (['low', 'medium', 'high'] as const).includes(body.intensity as 'low')
        ? (body.intensity as 'low' | 'medium' | 'high')
        : 'medium',
      playerCount: Math.min(30, Math.max(4, Number(body.effectif ?? body.playerCount ?? 14))),
      ageGroup: typeof body.categorie === 'string' ? body.categorie : 'Seniors',
      school: typeof body.ecole === 'string' ? body.ecole : undefined,
    };

    // Équipe partielle depuis le body ou Firestore
    let team: Partial<Team> = {
      name: typeof body.teamName === 'string' ? body.teamName : undefined,
      age_group: config.ageGroup,
      level: 'competitive',
      player_count: config.playerCount,
      focus_areas: [],
      weaknesses: [],
      strengths: [],
    };

    // Charger le profil équipe depuis Firestore si disponible
    if (adminDb && teamId !== 'default' && teamId !== 'anon') {
      try {
        const teamDoc = await adminDb.collection('teams').doc(teamId).get();
        if (teamDoc.exists) {
          team = { id: teamDoc.id, ...(teamDoc.data() as Omit<Team, 'id'>) };
        }
      } catch {
        // Continuer sans profil équipe
      }
    }

    // ── Vérification quota ─────────────────────────────────────────────────
    if (email && adminDb) {
      try {
        const userDoc = await adminDb.collection('users_access').doc(email).get();
        if (userDoc.exists) {
          const ud = userDoc.data()!;
          const limit = getLimit(ud.plan || 'trial', 'sessionsPerMonth');
          if (limit !== -1) {
            const month = new Date().toISOString().slice(0, 7);
            const used = ud.usage?.currentMonth === month
              ? (ud.usage?.sessionsGeneratedThisMonth ?? 0)
              : 0;
            if (used >= limit) {
              return NextResponse.json(
                { success: false, error: 'Limite mensuelle atteinte', hint: 'Passez au plan Coach Pro.' },
                { status: 403 }
              );
            }
          }
        }
      } catch { /* non bloquant */ }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Clé Gemini non configurée' }, { status: 503 });
    }

    // ── Étape 1 : Historique anti-répétition ──────────────────────────────
    const history = await getSessionHistoryForGemini(teamId, { limit: 8, lookbackDays: 30 });

    // ── Étape 2 : Catalogue d'exercices filtré ─────────────────────────────
    const category = CATEGORY_FROM_THEME[config.theme] ?? 'tactical';
    const availableExercises = await getAvailableExercises({
      category,
      ageGroup: config.ageGroup,
      excludeIds: new Set(history.exercisesToAvoid),
      minQualityScore: 40,
      limit: 120,
    });

    // ── Étape 3 : Construction du prompt ──────────────────────────────────
    const prompt = buildGeminiPrompt(team, config, history, availableExercises);
    const promptHash = hashPrompt(prompt);

    // ── Étape 4 : Appel Gemini ─────────────────────────────────────────────
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        maxOutputTokens: 16384,
      },
    });

    const result = await model.generateContent(prompt);
    const parsed = parseGeminiV2Response(result.response.text());

    if (!parsed) {
      return NextResponse.json({ success: false, error: 'Réponse Gemini invalide' }, { status: 500 });
    }

    // ── Étape 5 : Sauvegarde Firestore ────────────────────────────────────
    const sessionData: SaveSessionData = {
      title: parsed.title,
      duration_total: parsed.duration_total,
      main_objective: parsed.main_objective,
      theme: parsed.theme ?? config.theme,
      intensity_planned: config.intensity,
      phases: parsed.phases.map((p) => ({
        phase_type: p.phase_type as 'warm_up' | 'main_1' | 'main_2' | 'cool_down',
        label: p.label,
        duration: p.duration,
        objective: p.objective,
        exercises: p.exercises.map((e) => ({
          exercise_id: e.exercise_id,
          title: e.title,
          category: e.category as ExerciseCategory,
          duration: e.duration,
        })),
      })),
      tags: parsed.tags ?? [],
      gemini_prompt_hash: promptHash,
    };

    let savedSessionId: string | null = null;
    try {
      savedSessionId = await saveGeneratedSession(coachId, teamId, sessionData);
    } catch (e) {
      console.error('Sauvegarde session impossible :', e);
    }

    // Incrémenter le quota
    if (email && adminDb) {
      adminDb.collection('users_access').doc(email).update({
        'usage.sessionsGeneratedThisMonth': require('firebase-admin/firestore').FieldValue.increment(1),
        'usage.currentMonth': new Date().toISOString().slice(0, 7),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      sessionId: savedSessionId,
      source: 'ia',
      antiRepetition: {
        exercisesAvoided: history.exercisesToAvoid.length,
        catalogueSize: availableExercises.length,
        historyDepth: history.totalSessionsGenerated,
      },
    });
  } catch (error) {
    console.error('generate-v2:', error);
    return NextResponse.json({ success: false, error: 'Génération échouée' }, { status: 500 });
  }
}
