/**
 * Scraper — futbolsesion.com (ES)
 * Pages : /ejercicios-de-futbol/*
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.futbolsesion.com';
const PLATFORM = 'futbolsesion';
const COUNTRY = 'ES';
const LANGUAGE = 'es';

const CATEGORY_PAGES = [
  '/ejercicios-de-futbol/',
  '/ejercicios-de-futbol/pases/',
  '/ejercicios-de-futbol/tiro/',
  '/ejercicios-de-futbol/regate/',
  '/ejercicios-de-futbol/defensa/',
  '/ejercicios-de-futbol/porteros/',
  '/ejercicios-de-futbol/tactica/',
  '/ejercicios-de-futbol/fisico/',
  '/ejercicios-de-futbol/calentamiento/',
  '/ejercicios-de-futbol/juegos-reducidos/',
];

async function collectLinks(categoryUrl, maxPages = 8) {
  const links = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${BASE_URL}${categoryUrl}` : `${BASE_URL}${categoryUrl}page/${page}/`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        if (
          href.includes('/ejercicio') &&
          !href.includes('/ejercicios-de-futbol/') ||
          (href.includes('/ejercicio-') || href.match(/\/ejercicio\/\d+/))
        ) {
          const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (full.startsWith(BASE_URL)) {
            links.add(full);
            found++;
          }
        }
      });
      // Alternative: look for article/card links within listings
      if (found === 0) {
        $('.ejercicio-card a, .exercise-item a, article a[href]').each((_, el) => {
          const href = $(el).attr('href') ?? '';
          const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (full.startsWith(BASE_URL) && full !== `${BASE_URL}${categoryUrl}`) {
            links.add(full);
            found++;
          }
        });
      }
      if (found === 0) break;
      await sleep(DELAYS.betweenPages);
    } catch {
      break;
    }
  }
  return [...links];
}

async function scrapeEjercicio(url) {
  try {
    const $ = await loadPage(url);

    const title = $('h1').first().text().trim();
    if (!title || title.length < 3) return null;

    const description = $('.descripcion, .description, .resumen, .intro, article p').first().text().trim();

    const objectives = [];
    $('.objetivos li, .objetivos p, .aims li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) objectives.push(t);
    });

    const instructions = [];
    $('.desarrollo li, .instrucciones li, .pasos li, ol li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) instructions.push(t);
    });

    const coaching_points = [];
    $('.puntos-clave li, .consejos li, .errores li, .coaching li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const variations = [];
    $('.variaciones li, .variantes li, .progresiones li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    const tags = [];
    $('.tags a, .categorias a, .etiquetas a').each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t.toLowerCase());
    });

    const fullText = $('article, main').text();
    const durationText = $('[class*="duracion"], [class*="tiempo"], [class*="duration"]').first().text().trim() || fullText;
    const playersText = $('[class*="jugador"], [class*="efectivo"], [class*="player"]').first().text().trim() || fullText;
    const ageText = $('[class*="edad"], [class*="categoria"]').first().text().trim();
    const spaceText = $('[class*="espacio"], [class*="terreno"]').first().text().trim();

    return buildExercise(
      {
        title,
        description,
        objectives,
        instructions,
        coaching_points,
        variations,
        tags,
        duration_text: durationText,
        players_text: playersText,
        age_text: ageText,
        space: spaceText,
        url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );
  } catch (err) {
    console.warn(`  [futbolsesion] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapFutbolsesion(options = {}) {
  const { maxExercises = 300, dryRun = false } = options;
  const allLinks = new Set();

  for (const catPage of CATEGORY_PAGES) {
    console.log(`  [futbolsesion] Catégorie : ${catPage}`);
    const links = await collectLinks(catPage);
    links.forEach((l) => allLinks.add(l));
    console.log(`    → ${links.length} liens (total: ${allLinks.size})`);
    await sleep(DELAYS.betweenSites);
  }

  const linkArray = [...allLinks].slice(0, maxExercises * 2);
  const exercises = [];

  for (const url of linkArray) {
    if (exercises.length >= maxExercises) break;
    const ex = await scrapeEjercicio(url);
    if (ex && ex.title) {
      exercises.push(ex);
      if (!dryRun) await sleep(DELAYS.betweenPages);
    }
  }

  console.log(`  [futbolsesion] Total brut : ${exercises.length}`);
  return deduplicateExercises(exercises);
}
