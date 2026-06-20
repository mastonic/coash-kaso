/**
 * Constructeur de prompt Gemini enrichi avec historique anti-répétition.
 *
 * buildGeminiPrompt() injecte :
 *   1. Profil de l'équipe
 *   2. Paramètres de la séance
 *   3. Historique (exercisesToAvoid, thèmes/catégories récents)
 *   4. Catalogue d'exercices disponibles (80 max)
 *   5. Format JSON attendu avec novelty_justification
 */

import type { Exercise, ExerciseCategory } from './firestore-types';
import type { Team } from './firestore-types';
import type { SessionHistoryForGemini } from './proseance-firebase';

// ── Types publics ──────────────────────────────────────────────────────────────

export interface SessionConfig {
  duration: number;
  objective: string;
  theme: string;
  subtheme?: string;
  intensity: 'low' | 'medium' | 'high';
  playerCount: number;
  ageGroup?: string;
  school?: string;
}

// ── Labels FR ─────────────────────────────────────────────────────────────────

const CAT_FR: Record<ExerciseCategory, string> = {
  passing: 'Passe / Contrôle',
  shooting: 'Frappe / Tir',
  dribbling: 'Dribble / Conduite',
  defending: 'Défense',
  fitness: 'Physique / Condition',
  tactical: 'Tactique',
  set_piece: 'Phase arrêtée',
  goalkeeping: 'Gardien de but',
  possession: 'Possession / Conservation',
  pressing: 'Pressing / Récupération',
  transition: 'Transition',
  warm_up: 'Échauffement',
};

const INTENSITY_FR: Record<string, string> = {
  low: 'Faible — récupération',
  medium: 'Modérée',
  high: 'Élevée',
};

// ── Formatage du catalogue ─────────────────────────────────────────────────────

function formatCatalogue(exercises: Exercise[], limit = 80): string {
  if (exercises.length === 0) return '(aucun exercice en catalogue pour ces filtres)';
  return exercises
    .slice(0, limit)
    .map(
      (e) =>
        `[${e.id}] ${e.title} | ${CAT_FR[e.category] ?? e.category} | ${e.difficulty} | ${e.duration_min}-${e.duration_max}min | phase:${e.phase}`
    )
    .join('\n');
}

// ── Bloc historique anti-répétition ───────────────────────────────────────────

function buildHistoryBlock(history: SessionHistoryForGemini): string {
  if (history.totalSessionsGenerated === 0) return '';

  const avoidLines =
    history.exercisesToAvoid.length > 0
      ? `\nEXERCICES À NE PAS RÉUTILISER (déjà utilisés récemment avec cette équipe) :\n${history.exercisesToAvoid
          .slice(0, 40)
          .map((id) => `  - ${id}`)
          .join('\n')}`
      : '';

  const themesLine =
    history.recentThemes.length > 0
      ? `\nTHÈMES RÉCENTS (éviter de répéter le même thème) : ${history.recentThemes.join(', ')}`
      : '';

  const catsLine =
    history.recentCategories.length > 0
      ? `\nCATÉGORIES SURREPRÉSENTÉES (varier) : ${history.recentCategories
          .map((c) => CAT_FR[c] ?? c)
          .join(', ')}`
      : '';

  const objLine =
    history.recentObjectives.length > 0
      ? `\nOBJECTIFS DÉJÀ TRAVAILLÉS : ${history.recentObjectives.join(' / ')}`
      : '';

  return `
╔══════════════════════════════════════════════════════════╗
║  ⚠️  HISTORIQUE ANTI-RÉPÉTITION — INSTRUCTIONS MUST    ║
╚══════════════════════════════════════════════════════════╝
Cette équipe a déjà réalisé ${history.totalSessionsGenerated} séance(s).
Dernière séance : ${history.lastSessionDate ? new Date(history.lastSessionDate).toLocaleDateString('fr-FR') : 'inconnue'}
${avoidLines}${themesLine}${catsLine}${objLine}

RÈGLES ABSOLUES (non négociables) :
  1. Tu DOIS éviter TOUS les IDs listés dans "À NE PAS RÉUTILISER"
  2. Tu DOIS proposer un thème / objectif DIFFÉRENT de ceux listés
  3. Tu DOIS inclure "novelty_justification" dans ta réponse JSON
     → expliquer concrètement EN QUOI cette séance est nouvelle
  4. Tu DOIS sélectionner exercise_id UNIQUEMENT depuis le catalogue ci-dessous
╔══════════════════════════════════════════════════════════╝`;
}

// ── Constructeur principal ─────────────────────────────────────────────────────

export function buildGeminiPrompt(
  team: Partial<Team>,
  config: SessionConfig,
  history: SessionHistoryForGemini,
  availableExercises: Exercise[]
): string {
  const ageGroup = team.age_group ?? config.ageGroup ?? 'Seniors';
  const catalogueBlock = availableExercises.length > 0
    ? `
── CATALOGUE D'EXERCICES DISPONIBLES (${availableExercises.length} fiches) ──
Format : [id] titre | catégorie | difficulté | durée | phase
${formatCatalogue(availableExercises)}

⚠️ Sélectionne UNIQUEMENT des exercise_id présents dans ce catalogue.
   Si tu génères un exercice original absent du catalogue, mets exercise_id: null.`
    : '';

  return `Tu es un éducateur de football diplômé (BMF/BEF), expert en méthodologie FFF.
Génère une séance COMPLÈTE, CRÉATIVE et EN FRANÇAIS.
${buildHistoryBlock(history)}

── PROFIL DE L'ÉQUIPE ────────────────────────────────────
Nom              : ${team.name ?? 'Non spécifiée'}
Catégorie        : ${ageGroup}
Niveau           : ${team.level ?? 'compétition'}
Effectif         : ${config.playerCount} joueurs
Formation        : ${team.formation ?? 'libre'}
Points faibles   : ${(team.weaknesses ?? []).join(', ') || '—'}
Points forts     : ${(team.strengths ?? []).join(', ') || '—'}
Axes prioritaires: ${(team.focus_areas ?? []).join(', ') || '—'}
${config.school ? `École de jeu     : ${config.school}` : ''}

── PARAMÈTRES DE LA SÉANCE ───────────────────────────────
Durée totale : ${config.duration} min
Objectif     : ${config.objective}
Thème        : ${config.theme}${config.subtheme ? ` › ${config.subtheme}` : ''}
Intensité    : ${INTENSITY_FR[config.intensity] ?? config.intensity}
${catalogueBlock}

── STRUCTURE OBLIGATOIRE (4 phases FFF) ─────────────────
Phase 1 warm_up   : échauffement avec ballon, montée progressive
Phase 2 main_1    : premier procédé — jeu ou exercice structuré sur le thème
Phase 3 main_2    : deuxième procédé — situation ou exercice, plus proche du match
Phase 4 cool_down : jeu final libre à thème, sans consignes restrictives

Pour chaque exercice de chaque phase, fournis une fiche FFF complète :
instructions (4–6 règles progressives), variations (3 niveaux), coaching_points (3–4 critères),
players_organization (organisation détaillée), equipment (liste complète), space (dimensions réelles).

── FORMAT JSON ATTENDU ───────────────────────────────────
Réponds UNIQUEMENT avec ce JSON valide, sans texte avant/après :

{
  "title": string,
  "theme": string,
  "main_objective": string,
  "novelty_justification": string,
  "duration_total": number,
  "intensity": string,
  "tags": string[],
  "phases": [
    {
      "phase_type": "warm_up" | "main_1" | "main_2" | "cool_down",
      "label": string,
      "duration": number,
      "objective": string,
      "exercises": [
        {
          "exercise_id": string | null,
          "title": string,
          "duration": number,
          "category": string,
          "description": string,
          "instructions": string[],
          "variations": string[],
          "coaching_points": string[],
          "players_organization": string,
          "equipment": string[],
          "space": string
        }
      ]
    }
  ],
  "cool_down_notes": string,
  "coach_global_advice": string[]
}`;
}

// ── Parsing de la réponse Gemini ───────────────────────────────────────────────

export interface GeminiV2Response {
  title: string;
  theme: string;
  main_objective: string;
  novelty_justification: string;
  duration_total: number;
  intensity: string;
  tags: string[];
  phases: Array<{
    phase_type: string;
    label: string;
    duration: number;
    objective: string;
    exercises: Array<{
      exercise_id: string | null;
      title: string;
      duration: number;
      category: string;
      description: string;
      instructions: string[];
      variations: string[];
      coaching_points: string[];
      players_organization: string;
      equipment: string[];
      space: string;
    }>;
  }>;
  cool_down_notes: string;
  coach_global_advice: string[];
}

export function parseGeminiV2Response(raw: string): GeminiV2Response | null {
  try {
    let s = raw.trim();
    if (s.includes('```')) {
      const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) s = m[1].trim();
    }
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    return JSON.parse(s.slice(start, end + 1)) as GeminiV2Response;
  } catch {
    return null;
  }
}
