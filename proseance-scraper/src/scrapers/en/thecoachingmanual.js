/**
 * Scraper — thecoachingmanual.com (EN)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.thecoachingmanual.com';
const PLATFORM = 'thecoachingmanual';
const COUNTRY = 'EN';
const LANGUAGE = 'en';

const LIST_PAGES = [
  '/football/practices',
  '/football/practices?type=passing',
  '/football/practices?type=shooting',
  '/football/practices?type=dribbling',
  '/football/practices?type=defending',
  '/football/practices?type=possession',
  '/football/practices?type=fitness',
  '/football/practices?type=goalkeeping',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 10; page++) {
    const sep = listUrl.includes('?') ? '&' : '?';
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}${sep}page=${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/football/practice/"], a[href*="/practices/"]').each((_, el) => {
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

async function scrapePractice(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.practice-overview, .description, .summary, .intro').first().text().trim();
    const objectives = [];
    $('.objectives li, .learning-outcomes li, .aims li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('.instructions li, .practice-steps li, .how-to-set-up li, ol li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.coaching-points li, .key-coaching-points li, .look-for li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.progressions li, .variations li, .extensions li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .practice-tags span').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duration"], [class*="time"]').first().text().trim() || bodyText;
    const playersText = $('[class*="player"], [class*="number"]').first().text().trim() || bodyText;
    const ageText = $('[class*="age"], [class*="group"]').first().text().trim();
    const spaceText = $('[class*="area"], [class*="space"]').first().text().trim();
    const equipmentText = $('[class*="equipment"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, space: spaceText, equipment: equipmentText ? [equipmentText] : undefined, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [thecoachingmanual] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapThecoachingmanual(options = {}) {
  const { maxExercises = 300 } = options;
  const allLinks = new Set();
  for (const listPage of LIST_PAGES) {
    const links = await collectLinks(listPage);
    links.forEach((l) => allLinks.add(l));
    await sleep(DELAYS.betweenSites);
  }
  const exercises = [];
  for (const url of [...allLinks]) {
    if (exercises.length >= maxExercises) break;
    const ex = await scrapePractice(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
