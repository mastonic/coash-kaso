/**
 * Scraper — footballtraining4all.co.uk / section FR (FR)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.footballtraining4all.co.uk';
const PLATFORM = 'footballtraining4all';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

const LIST_PAGES = [
  '/fr/exercices/',
  '/fr/exercices/technique/',
  '/fr/exercices/tactique/',
  '/fr/exercices/physique/',
  '/fr/exercices/gardien/',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 6; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}?page=${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/fr/exercice"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        links.add(full);
        found++;
      });
      if (found === 0) break;
      await sleep(DELAYS.betweenPages);
    } catch { break; }
  }
  return [...links];
}

async function scrapeExercise(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.description, .intro, article p').first().text().trim();
    const instructions = [];
    $('ol li, .steps li, .consignes li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const objectives = [];
    $('.objectifs li, .buts li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const coaching_points = [];
    $('.conseils li, .coaching li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variantes li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: bodyText, players_text: bodyText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [footballtraining4all] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapFootballtraining4all(options = {}) {
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
    const ex = await scrapeExercise(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
