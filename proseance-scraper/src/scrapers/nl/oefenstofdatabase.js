/**
 * Scraper — oefenstofdatabase.nl (NL)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.oefenstofdatabase.nl';
const PLATFORM = 'oefenstofdatabase';
const COUNTRY = 'NL';
const LANGUAGE = 'nl';

const LIST_PAGES = [
  '/oefeningen/',
  '/oefeningen/passen/',
  '/oefeningen/schieten/',
  '/oefeningen/dribbling/',
  '/oefeningen/verdedigen/',
  '/oefeningen/keeper/',
  '/oefeningen/tactiek/',
  '/oefeningen/conditie/',
  '/oefeningen/opwarming/',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}pagina/${page}/`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/oefening/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
      });
      if (found === 0) {
        $('article a, h2 a, h3 a, .oefening-card a').each((_, el) => {
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
    const description = $('.beschrijving, .omschrijving, .intro, article p').first().text().trim();
    const objectives = [];
    $('.doelen li, .leerdoelen li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('ol li, .uitvoering li, .instructies li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.aandachtspunten li, .coaching-punten li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variaties li, .varianten li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .categorieën a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="duur"], [class*="tijd"]').first().text().trim() || bodyText;
    const playersText = $('[class*="speler"], [class*="aantal"]').first().text().trim() || bodyText;
    const ageText = $('[class*="leeftijd"], [class*="categorie"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [oefenstofdatabase] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapOefenstofdatabase(options = {}) {
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
