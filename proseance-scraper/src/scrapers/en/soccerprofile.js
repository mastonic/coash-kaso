/**
 * Scraper — soccerprofile.com (EN)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.soccerprofile.com';
const PLATFORM = 'soccerprofile';
const COUNTRY = 'EN';
const LANGUAGE = 'en';

const LIST_PAGES = [
  '/soccer-drills',
  '/soccer-drills/passing-drills',
  '/soccer-drills/shooting-drills',
  '/soccer-drills/dribbling-drills',
  '/soccer-drills/defending-drills',
  '/soccer-drills/fitness-drills',
  '/soccer-drills/goalkeeping-drills',
  '/soccer-drills/small-sided-games',
  '/soccer-drills/warm-up-drills',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}/page-${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/soccer-drill/"], a[href*="/drill/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
      });
      // Fallback: card/article links
      if (found === 0) {
        $('.drill-card a, .exercise-card a, .training-card a, article a').each((_, el) => {
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

async function scrapeDrill(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.drill-description, .description, .intro, .overview').first().text().trim() || $('article p').first().text().trim();
    const objectives = [];
    $('.objectives li, .aims li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('.instructions li, .steps li, ol li, .setup li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.coaching-points li, .tips li, .key-points li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variations li, .progressions li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .categories a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duration"], [class*="time"]').first().text().trim() || bodyText;
    const playersText = $('[class*="player"], [class*="number"]').first().text().trim() || bodyText;
    const ageText = $('[class*="age"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [soccerprofile] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapSoccerprofile(options = {}) {
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
    const ex = await scrapeDrill(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
