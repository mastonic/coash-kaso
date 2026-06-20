/**
 * Fonctions Firebase pour le système anti-répétition ProSeance.
 *
 * saveGeneratedSession → updateExerciseUsageStats (batch)
 * getSessionHistoryForGemini → historique pour le prompt
 * getAvailableExercises → catalogue filtré + exclusions
 * rateSession → feedback coach
 */

import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';
import type {
  Exercise,
  ExerciseCategory,
  ExerciseUsageStat,
  Session,
  SessionIntensity,
  SessionPhase,
} from './firestore-types';

// ── Types publics ──────────────────────────────────────────────────────────────

export interface SessionHistoryForGemini {
  exercisesToAvoid: string[];
  recentThemes: string[];
  recentObjectives: string[];
  recentCategories: ExerciseCategory[];
  lastSessionDate: string | null;
  totalSessionsGenerated: number;
  rawHistory: Array<{
    title: string;
    theme: string;
    date: string;
    exercise_ids: string[];
    categories: ExerciseCategory[];
  }>;
}

export interface SaveSessionData {
  title: string;
  date?: string;
  duration_total: number;
  main_objective: string;
  secondary_objectives?: string[];
  theme: string;
  intensity_planned?: SessionIntensity;
  phases: SessionPhase[];
  tags?: string[];
  gemini_prompt_hash?: string;
}

export interface ExerciseFilters {
  category?: ExerciseCategory;
  ageGroup?: string;
  difficulty?: string;
  phase?: string;
  minQualityScore?: number;
  excludeIds?: Set<string>;
  limit?: number;
}

// ── saveGeneratedSession ───────────────────────────────────────────────────────

export async function saveGeneratedSession(
  coachId: string,
  teamId: string,
  data: SaveSessionData
): Promise<string> {
  if (!adminDb) throw new Error('Firestore non configuré');

  // Extraire tous les exercise_ids utilisés (on ignore les null = exercices Gemini libres)
  const exercise_ids = data.phases
    .flatMap((p) => p.exercises.map((e) => e.exercise_id))
    .filter((id): id is string => !!id);

  const exercise_categories_used = [
    ...new Set(data.phases.flatMap((p) => p.exercises.map((e) => e.category))),
  ] as ExerciseCategory[];

  const sessionRef = adminDb.collection('sessions').doc();
  const sessionId = sessionRef.id;
  const now = new Date().toISOString();

  const session: Omit<Session, 'id'> = {
    coach_id: coachId,
    team_id: teamId,
    title: data.title,
    date: data.date ?? now,
    duration_total: data.duration_total,
    main_objective: data.main_objective,
    secondary_objectives: data.secondary_objectives ?? [],
    theme: data.theme,
    intensity_planned: data.intensity_planned ?? 'medium',
    phases: data.phases,
    exercise_ids,
    exercise_categories_used,
    tags: data.tags ?? [],
    gemini_prompt_hash: data.gemini_prompt_hash,
    generated_at: now,
  };

  await sessionRef.set(session);

  if (exercise_ids.length > 0) {
    await updateExerciseUsageStats(coachId, teamId, exercise_ids, sessionId);
  }

  return sessionId;
}

// ── updateExerciseUsageStats ───────────────────────────────────────────────────

export async function updateExerciseUsageStats(
  coachId: string,
  teamId: string,
  exerciseIds: string[],
  sessionId: string
): Promise<void> {
  if (!adminDb || exerciseIds.length === 0) return;

  const now = new Date().toISOString();
  // Firestore batch : max 500 ops, on découpe si nécessaire
  const chunks: string[][] = [];
  for (let i = 0; i < exerciseIds.length; i += 400) {
    chunks.push(exerciseIds.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = adminDb.batch();
    for (const exerciseId of chunk) {
      const statId = `${exerciseId}_${teamId}`;
      const ref = adminDb.collection('exercise_usage_stats').doc(statId);
      batch.set(
        ref,
        {
          exercise_id: exerciseId,
          team_id: teamId,
          coach_id: coachId,
          usage_count: FieldValue.increment(1),
          last_used_at: now,
          last_used_session_id: sessionId,
          usage_dates: FieldValue.arrayUnion(now),
        } as Partial<ExerciseUsageStat> & { usage_count: ReturnType<typeof FieldValue.increment>; usage_dates: ReturnType<typeof FieldValue.arrayUnion> },
        { merge: true }
      );
    }
    await batch.commit();
  }
}

// ── getSessionHistoryForGemini ─────────────────────────────────────────────────

export async function getSessionHistoryForGemini(
  teamId: string,
  options?: { limit?: number; lookbackDays?: number }
): Promise<SessionHistoryForGemini> {
  const empty: SessionHistoryForGemini = {
    exercisesToAvoid: [],
    recentThemes: [],
    recentObjectives: [],
    recentCategories: [],
    lastSessionDate: null,
    totalSessionsGenerated: 0,
    rawHistory: [],
  };

  if (!adminDb) return empty;

  const limit = options?.limit ?? 8;
  const lookbackDays = options?.lookbackDays ?? 30;
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  // 1. Dernières N séances de l'équipe
  const sessionsSnap = await adminDb
    .collection('sessions')
    .where('team_id', '==', teamId)
    .orderBy('generated_at', 'desc')
    .limit(limit)
    .get();

  const rawHistory = sessionsSnap.docs.map((doc) => {
    const d = doc.data() as Session;
    return {
      title: d.title,
      theme: d.theme,
      date: d.generated_at,
      exercise_ids: d.exercise_ids ?? [],
      categories: d.exercise_categories_used ?? [],
    };
  });

  // 2. Stats d'utilisation récentes (30 jours)
  const statsSnap = await adminDb
    .collection('exercise_usage_stats')
    .where('team_id', '==', teamId)
    .where('last_used_at', '>=', cutoff)
    .get();

  const recentStatIds = statsSnap.docs.map(
    (doc) => (doc.data() as ExerciseUsageStat).exercise_id
  );

  // Fusion + déduplication des IDs à éviter (max 50 dans le prompt)
  const exercisesToAvoid = [
    ...new Set([
      ...recentStatIds,
      ...rawHistory.flatMap((h) => h.exercise_ids),
    ]),
  ].slice(0, 50);

  const recentThemes = [...new Set(rawHistory.map((h) => h.theme))];

  const recentObjectives = sessionsSnap.docs
    .map((doc) => (doc.data() as Session).main_objective)
    .filter(Boolean)
    .slice(0, 5);

  const recentCategories = [
    ...new Set(rawHistory.flatMap((h) => h.categories)),
  ] as ExerciseCategory[];

  return {
    exercisesToAvoid,
    recentThemes,
    recentObjectives,
    recentCategories,
    lastSessionDate: rawHistory[0]?.date ?? null,
    totalSessionsGenerated: sessionsSnap.size,
    rawHistory,
  };
}

// ── getAvailableExercises ──────────────────────────────────────────────────────

export async function getAvailableExercises(
  filters: ExerciseFilters
): Promise<Exercise[]> {
  if (!adminDb) return [];

  try {
    let query = adminDb
      .collection('exercises')
      .where('is_active', '==', true) as FirebaseFirestore.Query;

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.ageGroup) {
      query = query.where('ageGroups', 'array-contains', filters.ageGroup);
    }
    if (filters.difficulty) {
      query = query.where('difficulty', '==', filters.difficulty);
    }
    if (filters.minQualityScore) {
      query = query.where('quality_score', '>=', filters.minQualityScore);
    }

    const snap = await query.limit(filters.limit ?? 200).get();

    let exercises = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Exercise, 'id'>),
    }));

    // Filtre phase côté client (Firestore "in" limité à 30 valeurs)
    if (filters.phase && filters.phase !== 'any') {
      exercises = exercises.filter(
        (e) => e.phase === filters.phase || e.phase === 'any'
      );
    }

    // Exclusion par Set (O(1) par exercice)
    if (filters.excludeIds && filters.excludeIds.size > 0) {
      exercises = exercises.filter((e) => !filters.excludeIds!.has(e.id));
    }

    return exercises;
  } catch (error) {
    console.error('getAvailableExercises:', error);
    return [];
  }
}

// ── rateSession ────────────────────────────────────────────────────────────────

export async function rateSession(
  sessionId: string,
  rating: number,
  feedback?: string,
  wasExecuted?: boolean
): Promise<void> {
  if (!adminDb) return;
  await adminDb
    .collection('sessions')
    .doc(sessionId)
    .set(
      {
        coach_rating: Math.min(5, Math.max(1, Math.round(rating))),
        coach_feedback: feedback ?? null,
        was_executed: wasExecuted ?? null,
        rated_at: new Date().toISOString(),
      },
      { merge: true }
    );
}

// ── Utilitaires ────────────────────────────────────────────────────────────────

export function hashPrompt(prompt: string): string {
  return createHash('md5').update(prompt).digest('hex').slice(0, 12);
}
