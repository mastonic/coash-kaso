/**
 * Scraper — 99coaches.com (DE) — REST API (priorité)
 * L'API JSON est beaucoup plus fiable que le HTML pour ce site.
 */

import axios from 'axios';
import { buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS, HTTP_HEADERS } from '../../config.js';

const API_BASE = 'https://api.99coaches.com/v1';
const PLATFORM = '99coaches';
const COUNTRY = 'DE';
const LANGUAGE = 'de';

const CATEGORIES = ['passen', 'schuss', 'dribbling', 'verteidigung', 'fitness', 'torwart', 'taktik', 'aufwaermen'];

async function fetchApiPage(category, page = 1, limit = 50) {
  try {
    const res = await axios.get(`${API_BASE}/exercises`, {
      params: { category, page, limit, lang: 'de' },
      headers: { ...HTTP_HEADERS, Accept: 'application/json' },
      timeout: 15000,
    });
    return res.data?.data ?? res.data?.exercises ?? res.data ?? [];
  } catch (err) {
    // Try alternative endpoint structure
    try {
      const res = await axios.get(`${API_BASE}/drills`, {
        params: { category, page, limit },
        headers: { ...HTTP_HEADERS, Accept: 'application/json' },
        timeout: 15000,
      });
      return res.data?.data ?? res.data?.drills ?? res.data ?? [];
    } catch {
      console.warn(`  [99coaches] API unavailable for ${category} page ${page}: ${err.message}`);
      return [];
    }
  }
}

function normalizeApiExercise(raw) {
  return buildExercise(
    {
      title: raw.title ?? raw.name ?? raw.titel ?? '',
      description: raw.description ?? raw.beschreibung ?? raw.summary ?? '',
      objectives: Array.isArray(raw.objectives) ? raw.objectives : (raw.lernziele ? [raw.lernziele] : []),
      instructions: Array.isArray(raw.instructions) ? raw.instructions : (Array.isArray(raw.ablauf) ? raw.ablauf : []),
      coaching_points: Array.isArray(raw.coaching_points) ? raw.coaching_points : (Array.isArray(raw.coachingpunkte) ? raw.coachingpunkte : []),
      variations: Array.isArray(raw.variations) ? raw.variations : (Array.isArray(raw.variationen) ? raw.variationen : []),
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      duration_text: raw.duration ?? raw.dauer ?? '',
      players_text: raw.players ?? raw.spieler ?? raw.anzahl_spieler ?? '',
      age_text: raw.age_group ?? raw.altersgruppe ?? '',
      space: raw.area ?? raw.spielfeld ?? '',
      url: raw.url ?? raw.link ?? null,
    },
    PLATFORM,
    COUNTRY,
    LANGUAGE,
  );
}

export async function scrap99coaches(options = {}) {
  const { maxExercises = 400 } = options;
  const exercises = [];

  for (const category of CATEGORIES) {
    if (exercises.length >= maxExercises) break;
    let page = 1;
    let hasMore = true;

    while (hasMore && exercises.length < maxExercises) {
      const items = await fetchApiPage(category, page, 50);
      if (!Array.isArray(items) || items.length === 0) {
        hasMore = false;
        break;
      }
      for (const item of items) {
        if (exercises.length >= maxExercises) break;
        try {
          const ex = normalizeApiExercise(item);
          if (ex.title) exercises.push(ex);
        } catch { /* skip malformed */ }
      }
      if (items.length < 50) hasMore = false;
      page++;
      await sleep(DELAYS.betweenPages);
    }
    await sleep(DELAYS.betweenSites);
  }

  console.log(`  [99coaches] Total brut : ${exercises.length}`);
  return deduplicateExercises(exercises);
}
