/**
 * Scraper — toplidercoach.com (ES)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.toplidercoach.com';
const PLATFORM = 'toplidercoach';
const COUNTRY = 'ES';
const LANGUAGE = 'es';

const LIST_PAGES = [
  '/ejercicios/',
  '/ejercicios/pases/',
  '/ejercicios/tiro/',
  '/ejercicios/tactica/',
  '/ejercicios/portero/',
  '/ejercicios/fisico/',
  '/ejercicios/regate/',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}page/${page}/`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/ejercicio"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
      });
      if (found === 0) {
        $('article a, .card a, .ejercicio-item a').each((_, el) => {
          const href = $(el).attr('href') ?? '';
          const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (full.startsWith(BASE_URL) && full !== `${BASE_URL}${listUrl}`) { links.add(full); found++; }
        });
      }
      if (found === 0) break;
      await sleep(DELAYS.betweenPages);
    } catch { break; }
  }
  return [...links];
}

async function scrapeEjercicio(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.descripcion, .description, .resumen').first().text().trim() || $('article p').first().text().trim();
    const objectives = [];
    $('.objetivos li, .aims li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('ol li, .instrucciones li, .desarrollo li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.puntos-clave li, .consejos li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variaciones li, .variantes li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .etiquetas a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duracion"], [class*="tiempo"]').first().text().trim() || bodyText;
    const playersText = $('[class*="jugador"], [class*="efectivo"]').first().text().trim() || bodyText;
    const ageText = $('[class*="edad"], [class*="categoria"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [toplidercoach] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapToplidercoach(options = {}) {
  const { maxExercises = 200 } = options;
  const allLinks = new Set();
  for (const listPage of LIST_PAGES) {
    const links = await collectLinks(listPage);
    links.forEach((l) => allLinks.add(l));
    await sleep(DELAYS.betweenSites);
  }
  const exercises = [];
  for (const url of [...allLinks]) {
    if (exercises.length >= maxExercises) break;
    const ex = await scrapeEjercicio(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
