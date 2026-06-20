/**
 * Utilitaires partagés entre tous les scrapers.
 *
 * fetchPage     — GET avec retry × 3
 * buildExercise — Normalise les données brutes vers le schema Exercise Firestore
 * detect*       — Détection automatique catégorie/phase/difficulté
 * extract*      — Extraction durée/joueurs/équipement depuis texte libre
 * deduplicateExercises — Déduplication par {platform}::{title}
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { KEYWORD_TO_CATEGORY, KEYWORD_TO_PHASE, AGE_TEXT_TO_GROUP, DELAYS, HTTP_HEADERS } from '../config.js';

// ── HTTP ──────────────────────────────────────────────────────────────────────

export async function fetchPage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, {
        headers: HTTP_HEADERS,
        timeout: 15000,
        maxRedirects: 5,
      });
      return res.data;
    } catch (err) {
      console.warn(`  [${attempt}/${retries}] Erreur fetchPage ${url}: ${err.message}`);
      if (attempt < retries) {
        await sleep(DELAYS.retryBase * attempt);
      } else {
        throw err;
      }
    }
  }
}

/** Charge une page HTML avec cheerio */
export async function loadPage(url) {
  const html = await fetchPage(url);
  return cheerio.load(html);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Détection automatique ─────────────────────────────────────────────────────

export function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [kw, cat] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (lower.includes(kw)) return cat;
  }
  return 'tactical';
}

export function detectPhase(text) {
  const lower = text.toLowerCase();
  for (const [kw, phase] of Object.entries(KEYWORD_TO_PHASE)) {
    if (lower.includes(kw)) return phase;
  }
  return 'main';
}

export function detectDifficulty(text) {
  const lower = text.toLowerCase();
  if (/débutant|beginner|facile|easy|simple/.test(lower)) return 'beginner';
  if (/intermédiaire|intermediate|moyen|medium/.test(lower)) return 'intermediate';
  if (/avancé|advanced|difficile|hard/.test(lower)) return 'advanced';
  if (/elite|expert|professionnel|pro/.test(lower)) return 'elite';
  return 'intermediate';
}

export function detectIntensity(text) {
  const lower = text.toLowerCase();
  if (/faible|low|récup|recovery|léger|light/.test(lower)) return 'low';
  if (/élevé|high|intense|fort/.test(lower)) return 'high';
  if (/très intense|very high|maximal/.test(lower)) return 'very_high';
  return 'medium';
}

// ── Extraction depuis texte libre ─────────────────────────────────────────────

/** Extrait la durée en minutes depuis un texte (ex: "20 min", "10-20'", "30 minutes") */
export function extractDuration(text) {
  if (!text) return { min: 10, max: 20 };
  const m = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:min|'|minutes?)/i);
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) };
  const s = text.match(/(\d+)\s*(?:min|'|minutes?)/i);
  if (s) {
    const v = parseInt(s[1]);
    return { min: Math.max(5, v - 5), max: v + 5 };
  }
  return { min: 10, max: 20 };
}

/** Extrait le nombre de joueurs (ex: "4v4", "6 joueurs", "groupes de 4", "8-12") */
export function extractPlayers(text) {
  if (!text) return { min: 6, max: 16 };
  // Format XvX
  const vvv = text.match(/(\d+)\s*[vx]\s*(\d+)/i);
  if (vvv) {
    const total = parseInt(vvv[1]) + parseInt(vvv[2]);
    return { min: total - 2, max: total + 4 };
  }
  // Range "8-12"
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  // Simple "6 joueurs"
  const simple = text.match(/(\d+)\s*(?:joueurs?|players?|personnes?)/i);
  if (simple) {
    const n = parseInt(simple[1]);
    return { min: Math.max(2, n - 2), max: n + 4 };
  }
  // Groupes de N
  const grp = text.match(/groupes?\s*de\s*(\d+)/i);
  if (grp) {
    const n = parseInt(grp[1]);
    return { min: n * 2, max: n * 4 };
  }
  return { min: 6, max: 16 };
}

/** Extrait la liste d'équipements depuis un texte */
export function extractEquipment(text) {
  if (!text) return [];
  const equipment = [];
  const matchers = [
    [/ballon/i, 'ballons'],
    [/cône|cone|piquet/i, 'cônes / piquets'],
    [/but\b/i, 'buts'],
    [/mini.but|small goal/i, 'mini-buts'],
    [/chasuble|dossard|vest/i, 'chasubles'],
    [/mannequin/i, 'mannequins'],
    [/échelle|ladder/i, 'échelle de coordination'],
    [/cerceaux?|hoop/i, 'cerceaux'],
    [/chrono|timer/i, 'chronomètre'],
  ];
  for (const [rx, label] of matchers) {
    if (rx.test(text)) equipment.push(label);
  }
  if (equipment.length === 0) equipment.push('ballons', 'cônes');
  return equipment;
}

/** Extrait les groupes d'âge depuis un texte */
export function extractAgeGroups(text) {
  if (!text) return ['U12-U13', 'U14-U15', 'U16-U18', 'Seniors'];
  const lower = text.toLowerCase();
  const groups = new Set();

  for (const [kw, group] of Object.entries(AGE_TEXT_TO_GROUP)) {
    if (lower.includes(kw)) {
      if (Array.isArray(group)) group.forEach((g) => groups.add(g));
      else groups.add(group);
    }
  }
  // Détecter U+N format
  const uMatch = lower.match(/u(\d+)/g) ?? [];
  for (const u of uMatch) {
    const n = parseInt(u.slice(1));
    if (n <= 7) groups.add('U6-U7');
    else if (n <= 9) groups.add('U8-U9');
    else if (n <= 11) groups.add('U10-U11');
    else if (n <= 13) groups.add('U12-U13');
    else if (n <= 15) groups.add('U14-U15');
    else if (n <= 18) groups.add('U16-U18');
  }

  return groups.size > 0
    ? [...groups]
    : ['U12-U13', 'U14-U15', 'U16-U18', 'Seniors'];
}

// ── Quality score ─────────────────────────────────────────────────────────────

export function computeQualityScore(exercise) {
  let score = 0;
  if (exercise.title?.length > 5) score += 15;
  if (exercise.description?.length > 50) score += 15;
  if (exercise.instructions?.length >= 3) score += 20;
  if (exercise.objectives?.length >= 1) score += 15;
  if (exercise.coaching_points?.length >= 2) score += 15;
  if (exercise.variations?.length >= 1) score += 10;
  if (exercise.diagram_description) score += 10;
  return Math.min(100, score);
}

// ── buildExercise ─────────────────────────────────────────────────────────────

/**
 * Normalise les données brutes d'un scraper vers le schema Exercise Firestore.
 *
 * @param {object} raw         Données brutes du scraper
 * @param {string} platform    Identifiant de la plateforme (ex: "mycoachfootball")
 * @param {string} country     Code pays ("FR", "EN", "ES", "DE", "NL")
 * @param {string} language    Langue ("fr", "en", "es", "de", "nl")
 */
export function buildExercise(raw, platform, country, language) {
  const combinedText = [raw.title, raw.description, raw.category_text, raw.tags_text].join(' ');

  const durationData = extractDuration(raw.duration_text ?? raw.description ?? '');
  const playersData = extractPlayers(raw.players_text ?? raw.description ?? '');
  const equipment = raw.equipment ?? extractEquipment(raw.description ?? '');
  const ageGroups = raw.ageGroups ?? extractAgeGroups(raw.age_text ?? '');

  const exercise = {
    // Identité
    title: (raw.title ?? '').trim(),
    description: (raw.description ?? '').trim(),

    // Classification
    category: raw.category ?? detectCategory(combinedText),
    subcategory: raw.subcategory ?? null,
    ageGroups,
    difficulty: raw.difficulty ?? detectDifficulty(combinedText),
    intensity: raw.intensity ?? detectIntensity(combinedText),
    phase: raw.phase ?? detectPhase(combinedText),

    // Paramètres
    duration_min: raw.duration_min ?? durationData.min,
    duration_max: raw.duration_max ?? durationData.max,
    players_min: raw.players_min ?? playersData.min,
    players_max: raw.players_max ?? playersData.max,
    equipment,
    space_required: raw.space ?? raw.space_required ?? '',

    // Contenu pédagogique
    objectives: raw.objectives ?? (raw.objective ? [raw.objective] : []),
    instructions: raw.instructions ?? [],
    variations: raw.variations ?? [],
    coaching_points: raw.coaching_points ?? [],
    diagram_description: raw.diagram_description ?? null,

    // Métadonnées
    tags: raw.tags ?? [],
    source_url: raw.url ?? raw.source_url ?? null,
    source_platform: platform,
    source_country: country,
    language,
    is_active: true,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  exercise.quality_score = computeQualityScore(exercise);

  return exercise;
}

// ── Déduplication ─────────────────────────────────────────────────────────────

/**
 * Déduplique les exercices par la clé {platform}::{title} (insensible à la casse).
 */
export function deduplicateExercises(exercises) {
  const seen = new Set();
  return exercises.filter((e) => {
    const key = `${e.source_platform ?? ''}::${(e.title ?? '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Filtre les exercices sous le seuil de qualité */
export function filterByQuality(exercises, minScore = 30) {
  return exercises.filter((e) => (e.quality_score ?? 0) >= minScore);
}
