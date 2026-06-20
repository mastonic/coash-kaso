/**
 * Scraper — easy2coach.net (FR)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.easy2coach.net';
const PLATFORM = 'easy2coach';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

const LIST_PAGES = [
  '/fr/football/entrainements/',
  '/fr/football/entrainements/?category=passe',
  '/fr/football/entrainements/?category=tir',
  '/fr/football/entrainements/?category=tactique',
  '/fr/football/entrainements/?category=physique',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const sep = listUrl.includes('?') ? '&' : '?';
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}${sep}page=${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/entrainement/"], a[href*="/exercise/"], a[href*="/drills/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
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
    const description = $('.description, .intro, .exercise-description').first().text().trim();
    const instructions = [];
    $('.instructions li, .steps li, ol li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const objectives = [];
    $('.objectives li, .goals li, .learning-goals li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const coaching_points = [];
    $('.coaching-points li, .tips li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variations li, .progressions li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .categories a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duration"], [class*="duree"]').first().text().trim() || bodyText;
    const playersText = $('[class*="player"], [class*="joueur"]').first().text().trim() || bodyText;
    const ageText = $('[class*="age"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [easy2coach] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapEasy2coach(options = {}) {
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
