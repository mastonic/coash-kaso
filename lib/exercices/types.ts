import type {
  Categorie,
  Charge,
  DomaineId,
  Procede,
  SchemaExercice,
  SousThemeId,
} from '@/lib/seance/schema';

export interface ExerciceCatalogue {
  id: string;
  titre: string;
  procede: Procede;
  /** Sous-thèmes principaux de l'exercice */
  themes: SousThemeId[];
  domaine: DomaineId;
  /** Catégories d'âge pour lesquelles l'exercice est adapté */
  categoriesAge: Categorie[];
  effectifMin: number;
  effectifMax: number;
  /** Durée conseillée en minutes (min) */
  dureeMin: number;
  /** Durée conseillée en minutes (max) */
  dureeMax: number;
  charges: Charge[];
  objectif: string;
  but: string;
  /** Description de l'organisation humaine */
  effectifDesc: string;
  materiel: string;
  consignes: string[];
  variantes: string[];
  criteresReussite: string[];
  conseilCoach?: string;
  schema?: SchemaExercice;
  /** Origine : 'interne', 'unecatef', 'fff', etc. */
  source: string;
  sourceUrl?: string;
  tags: string[];
  verified: boolean;
  createdAt?: string;
}
