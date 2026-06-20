/**
 * Scraper — trainerssite.nl (NL)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.trainerssite.nl';
const PLATFORM = 'trainerssite';
const COUNTRY = 'NL';
const LANGUAGE = 'nl';

const LIST_PAGES = [
  '/oefeningen/',
  '/oefeningen/passen/',
  '/oefeningen/schieten/',
  '/oefeningen/dribbling/',
  '/oefeningen/verdedigen/',
  '/oefeningen/keeper/',
  '/oefeningen/conditie/',
  '/oefeningen/opwarmen/',
  '/oefeningen/tactiek/',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}?page=${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/oefening/"], a[href*="/drill/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
      });
      if (found === 0) {
        $('article a, .oefening-item a, h2 a, h3 a').each((_, el) => {
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

async function scrapeOefening(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.beschrijving, .omschrijving, article p').first().text().trim();
    const objectives = [];
    $('.doelen li, .leerdoelen li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('ol li, .uitleg li, .uitvoering li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.aandachtspunten li, .tips li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variaties li, .moeilijker li, .makkelijker li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .labels a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duur"], [class*="minuten"]').first().text().trim() || bodyText;
    const playersText = $('[class*="speler"], [class*="personen"]').first().text().trim() || bodyText;
    const ageText = $('[class*="leeftijd"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [trainerssite] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapTrainerssite(options = {}) {
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
    const ex = await scrapeOefening(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
