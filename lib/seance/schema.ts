/**
 * Schéma de données "Séance FFF" — version 2
 *
 * Une séance suit la méthodologie FFF : 4 phases construites avec les
 * procédés d'entraînement officiels (jeu / situation / exercice), encadrées
 * par une mise en train et un match final, chacune décrite comme une
 * fiche d'exercice FFF (objectif, but, consignes, variantes, critères de
 * réussite, effectif, espace, matériel) et illustrée par un schéma tactique.
 *
 * Coordonnées des schémas : x = 0..100 (% de la longueur du terrain,
 * gauche → droite), y = 0..100 (% de la largeur, haut → bas).
 */

// ── Schéma tactique ──────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

/** A = équipe bleue, B = équipe rouge, J = joker (jaune), G = gardien */
export type Equipe = 'A' | 'B' | 'J' | 'G';

export interface SchemaJoueur extends Point {
  equipe: Equipe;
  label?: string;
}

export interface SchemaPlot extends Point {
  couleur?: 'jaune' | 'orange' | 'rouge' | 'bleu' | 'blanc';
}

export type SchemaBallon = Point;

export interface SchemaBut extends Point {
  taille: 'grand' | 'mini';
  /** Côté du terrain vers lequel le but est ouvert */
  orientation: 'haut' | 'bas' | 'gauche' | 'droite';
}

export interface SchemaZone {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
  label?: string;
}

export type TypeFleche = 'passe' | 'deplacement' | 'conduite' | 'tir';

export interface SchemaFleche {
  de: Point;
  vers: Point;
  type: TypeFleche;
}

export interface SchemaExercice {
  /** Dimensions réelles de l'espace de travail, en mètres */
  terrain: { longueur: number; largeur: number };
  joueurs: SchemaJoueur[];
  plots?: SchemaPlot[];
  ballons?: SchemaBallon[];
  buts?: SchemaBut[];
  zones?: SchemaZone[];
  fleches?: SchemaFleche[];
}

// ── Fiche d'exercice / phase de séance ──────────────────────────────────────

export type Procede = 'echauffement' | 'jeu' | 'exercice' | 'situation' | 'match';

export const PROCEDE_LABELS: Record<Procede, string> = {
  echauffement: 'Mise en train',
  jeu: 'Jeu',
  exercice: 'Exercice',
  situation: 'Situation',
  match: 'Jeu final / Match',
};

export interface PhaseSeance {
  procede: Procede;
  titre: string;
  /** Durée en minutes */
  duree: number;
  objectif: string;
  /** But de la tâche pour les joueurs (ex : marquer dans un des 2 mini-buts) */
  but: string;
  /** Organisation humaine (ex : "2 équipes de 4 + 2 jokers offensifs") */
  effectif: string;
  materiel: string;
  consignes: string[];
  variantes: string[];
  criteresReussite: string[];
  /** Conseil pratique pour le coach (observation, ajustement, piège à éviter) */
  conseilCoach?: string;
  schema: SchemaExercice;
}

// ── Séance complète ──────────────────────────────────────────────────────────

export const CATEGORIES = [
  'U6-U7',
  'U8-U9',
  'U10-U11',
  'U12-U13',
  'U14-U15',
  'U16-U18',
  'Seniors',
] as const;
export type Categorie = (typeof CATEGORIES)[number];

export const CHARGES = ['Récupération', 'Modérée', 'Élevée'] as const;
export type Charge = (typeof CHARGES)[number];

export const THEMES = [
  { id: 'possession', label: 'Conservation / Possession' },
  { id: 'pressing', label: 'Pressing / Récupération' },
  { id: 'transitions', label: 'Transitions off. / déf.' },
  { id: 'finition', label: 'Finition / Tir au but' },
  { id: 'ailes', label: 'Jeu sur les ailes / Centres' },
  { id: 'technique', label: 'Technique : passes & contrôles' },
  { id: 'conduite', label: 'Conduite de balle / Dribble' },
  { id: 'duels', label: 'Duels 1c1' },
  { id: 'vitesse', label: 'Vitesse / Vivacité' },
  { id: 'defense', label: 'Organisation défensive' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export function themeLabel(id: string): string {
  return THEMES.find((t) => t.id === id)?.label ?? id;
}

export interface Seance {
  version: 2;
  titre: string;
  categorie: Categorie;
  theme: ThemeId;
  objectif: string;
  /** Durée totale en minutes (phases + retour au calme) */
  dureeTotale: number;
  effectif: number;
  charge: Charge;
  /** Matériel global de la séance */
  materiel: string;
  phases: PhaseSeance[];
  retourAuCalme: string;
  conseilsCoach: string[];
}

export interface SeanceParams {
  theme: ThemeId;
  categorie: Categorie;
  effectif: number;
  duree: number;
  charge: Charge;
}

// ── Validation / normalisation ───────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((s) => str(s)).filter(Boolean);
}

function normalisePoint(v: unknown): Point | null {
  if (!v || typeof v !== 'object') return null;
  const p = v as Record<string, unknown>;
  if (p.x === undefined || p.y === undefined) return null;
  return { x: num(p.x, 50, 0, 100), y: num(p.y, 50, 0, 100) };
}

const EQUIPES: Equipe[] = ['A', 'B', 'J', 'G'];
const FLECHES: TypeFleche[] = ['passe', 'deplacement', 'conduite', 'tir'];

/**
 * Normalise un schéma tactique brut (potentiellement généré par l'IA).
 * Retourne null si le schéma est inexploitable (→ utiliser un schéma
 * de la bibliothèque à la place).
 */
export function normaliseSchema(raw: unknown): SchemaExercice | null {
  if (!raw) return null;
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  const joueursRaw = Array.isArray(d.joueurs) ? d.joueurs : [];
  const joueurs: SchemaJoueur[] = [];
  for (const j of joueursRaw) {
    const p = normalisePoint(j);
    if (!p) continue;
    const eq = (j as Record<string, unknown>).equipe;
    joueurs.push({
      ...p,
      equipe: EQUIPES.includes(eq as Equipe) ? (eq as Equipe) : 'A',
      label: str((j as Record<string, unknown>).label) || undefined,
    });
  }
  if (joueurs.length === 0) return null;

  const terrainRaw = (d.terrain ?? {}) as Record<string, unknown>;
  const terrain = {
    longueur: num(terrainRaw.longueur, 30, 5, 105),
    largeur: num(terrainRaw.largeur, 20, 5, 68),
  };

  const plots: SchemaPlot[] = (Array.isArray(d.plots) ? d.plots : [])
    .map((c) => {
      const p = normalisePoint(c);
      if (!p) return null;
      const couleur = (c as Record<string, unknown>).couleur;
      return {
        ...p,
        couleur: ['jaune', 'orange', 'rouge', 'bleu', 'blanc'].includes(
          couleur as string
        )
          ? (couleur as SchemaPlot['couleur'])
          : 'jaune',
      };
    })
    .filter(Boolean) as SchemaPlot[];

  const ballons: SchemaBallon[] = (Array.isArray(d.ballons) ? d.ballons : [])
    .map(normalisePoint)
    .filter(Boolean) as SchemaBallon[];

  const buts: SchemaBut[] = (Array.isArray(d.buts) ? d.buts : [])
    .map((b) => {
      const p = normalisePoint(b);
      if (!p) return null;
      const bb = b as Record<string, unknown>;
      return {
        ...p,
        taille: bb.taille === 'grand' ? ('grand' as const) : ('mini' as const),
        orientation: ['haut', 'bas', 'gauche', 'droite'].includes(
          bb.orientation as string
        )
          ? (bb.orientation as SchemaBut['orientation'])
          : 'gauche',
      };
    })
    .filter(Boolean) as SchemaBut[];

  const zones: SchemaZone[] = (Array.isArray(d.zones) ? d.zones : [])
    .map((z) => {
      if (!z || typeof z !== 'object') return null;
      const zz = z as Record<string, unknown>;
      return {
        x: num(zz.x, 0, 0, 100),
        y: num(zz.y, 0, 0, 100),
        largeur: num(zz.largeur, 20, 1, 100),
        hauteur: num(zz.hauteur, 20, 1, 100),
        label: str(zz.label) || undefined,
      };
    })
    .filter(Boolean) as SchemaZone[];

  const fleches: SchemaFleche[] = (Array.isArray(d.fleches) ? d.fleches : [])
    .map((f) => {
      if (!f || typeof f !== 'object') return null;
      const ff = f as Record<string, unknown>;
      const de = normalisePoint(ff.de);
      const vers = normalisePoint(ff.vers);
      if (!de || !vers) return null;
      return {
        de,
        vers,
        type: FLECHES.includes(ff.type as TypeFleche)
          ? (ff.type as TypeFleche)
          : 'passe',
      };
    })
    .filter(Boolean) as SchemaFleche[];

  return { terrain, joueurs, plots, ballons, buts, zones, fleches };
}

/**
 * Normalise une phase brute. `fallbackSchema` est utilisé quand le schéma
 * de l'IA est inexploitable.
 */
export function normalisePhase(
  raw: unknown,
  fallback: PhaseSeance
): PhaseSeance {
  if (!raw || typeof raw !== 'object') return fallback;
  const d = raw as Record<string, unknown>;
  const procede = (
    ['echauffement', 'jeu', 'exercice', 'situation', 'match'] as Procede[]
  ).includes(d.procede as Procede)
    ? (d.procede as Procede)
    : fallback.procede;

  return {
    procede,
    titre: str(d.titre, fallback.titre),
    duree: num(d.duree, fallback.duree, 5, 45),
    objectif: str(d.objectif, fallback.objectif),
    but: str(d.but, fallback.but),
    effectif: str(d.effectif, fallback.effectif),
    materiel: str(d.materiel, fallback.materiel),
    consignes: strArray(d.consignes).length
      ? strArray(d.consignes)
      : fallback.consignes,
    variantes: strArray(d.variantes).length
      ? strArray(d.variantes)
      : fallback.variantes,
    criteresReussite: strArray(d.criteresReussite).length
      ? strArray(d.criteresReussite)
      : fallback.criteresReussite,
    conseilCoach: str(d.conseilCoach, fallback.conseilCoach ?? ''),
    schema: normaliseSchema(d.schema) ?? fallback.schema,
  };
}
