/**
 * Types TypeScript pour toutes les collections Firestore ProSeance.
 * Ces types décrivent le schéma de données côté BDD.
 */

// ── Exercices ─────────────────────────────────────────────────────────────────

export type ExerciseCategory =
  | 'passing'
  | 'shooting'
  | 'dribbling'
  | 'defending'
  | 'fitness'
  | 'tactical'
  | 'set_piece'
  | 'goalkeeping'
  | 'possession'
  | 'pressing'
  | 'transition'
  | 'warm_up';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type ExercisePhase = 'warm_up' | 'main' | 'cool_down' | 'any';
export type ExerciseIntensity = 'low' | 'medium' | 'high' | 'very_high';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  subcategory?: string;
  ageGroups: string[];          // e.g. ["U10-U11", "U12-U13"]
  difficulty: ExerciseDifficulty;
  duration_min: number;         // minutes
  duration_max: number;
  players_min: number;
  players_max: number;
  equipment: string[];
  space_required: string;
  objectives: string[];
  instructions: string[];
  variations: string[];
  coaching_points: string[];
  diagram_description?: string;
  source_url?: string;
  source_platform?: string;     // e.g. "mycoachfootball", "englandfootball"
  source_country?: string;      // "FR", "EN", "ES", "DE", "NL"
  language: string;             // "fr", "en", "es"
  tags: string[];
  intensity: ExerciseIntensity;
  phase: ExercisePhase;
  is_active: boolean;
  quality_score: number;        // 0–100
  scraped_at?: string;
  created_at: string;
}

// ── Coaches ───────────────────────────────────────────────────────────────────

export interface Coach {
  id: string;                   // = Firebase Auth UID
  email: string;
  display_name?: string;
  photo_url?: string;
  licenses?: string[];          // e.g. ["BMF", "BEF", "UEFA-B"]
  country?: string;
  created_at: string;
  last_login_at: string;
}

// ── Equipes ───────────────────────────────────────────────────────────────────

export type TeamLevel = 'recreational' | 'competitive' | 'semi_pro' | 'pro';

export interface Team {
  id: string;
  coach_id: string;
  name: string;
  age_group: string;            // e.g. "U14-U15", "Seniors"
  level: TeamLevel;
  player_count: number;
  focus_areas: string[];        // axes de travail prioritaires
  weaknesses: string[];
  strengths: string[];
  formation?: string;           // e.g. "4-3-3"
  season?: string;              // e.g. "2025-2026"
  created_at: string;
  updated_at: string;
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type SessionIntensity = 'low' | 'medium' | 'high';

export interface ExerciseRef {
  exercise_id: string | null;   // null si exercice créé par Gemini hors catalogue
  title: string;
  category: ExerciseCategory;
  duration: number;
  custom_notes?: string;
}

export interface SessionPhase {
  phase_type: 'warm_up' | 'main_1' | 'main_2' | 'cool_down';
  label: string;
  duration: number;
  objective: string;
  exercises: ExerciseRef[];
}

export interface Session {
  id: string;
  coach_id: string;
  team_id: string;
  title: string;
  date: string;                       // ISO
  duration_total: number;
  main_objective: string;
  secondary_objectives: string[];
  theme: string;
  intensity_planned: SessionIntensity;
  phases: SessionPhase[];
  exercise_ids: string[];             // dénormalisé pour queries rapides
  exercise_categories_used: ExerciseCategory[];
  tags: string[];
  gemini_prompt_hash?: string;        // MD5 partiel du prompt (anti-doublon)
  coach_rating?: number;              // 1–5
  coach_feedback?: string;
  was_executed?: boolean;
  rated_at?: string;
  generated_at: string;
}

// ── Statistiques d'utilisation ────────────────────────────────────────────────

export interface ExerciseUsageStat {
  id: string;                         // "{exercise_id}_{team_id}"
  exercise_id: string;
  team_id: string;
  coach_id: string;
  usage_count: number;
  last_used_at: string;
  last_used_session_id: string;
  usage_dates: string[];              // ISO dates
  avg_coach_rating?: number;
}

// ── Jobs de scraping ──────────────────────────────────────────────────────────

export type ScrapingJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScrapingJob {
  id: string;
  platform: string;
  country: string;
  url: string;
  status: ScrapingJobStatus;
  exercises_found: number;
  exercises_added: number;
  exercises_updated: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}
