/**
 * Scraper — fussballtraining24.de (DE)
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.fussballtraining24.de';
const PLATFORM = 'fussballtraining24';
const COUNTRY = 'DE';
const LANGUAGE = 'de';

const LIST_PAGES = [
  '/uebungen/',
  '/uebungen/passen/',
  '/uebungen/schuss/',
  '/uebungen/dribbling/',
  '/uebungen/verteidigung/',
  '/uebungen/torwart/',
  '/uebungen/taktik/',
  '/uebungen/fitness/',
  '/uebungen/aufwaermen/',
];

async function collectLinks(listUrl) {
  const links = new Set();
  for (let page = 1; page <= 8; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}seite/${page}/`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/uebung/"], a[href*="/training/"]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        if (full.startsWith(BASE_URL)) { links.add(full); found++; }
      });
      if (found === 0) {
        $('article a, .uebung-card a, h2 a, h3 a').each((_, el) => {
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

async function scrapeUebung(url) {
  try {
    const $ = await loadPage(url);
    const title = $('h1').first().text().trim();
    if (!title) return null;
    const description = $('.beschreibung, .description, .inhalt, article p').first().text().trim();
    const objectives = [];
    $('.lernziele li, .ziele li').each((_, el) => { const t = $(el).text().trim(); if (t) objectives.push(t); });
    const instructions = [];
    $('ol li, .ablauf li, .anleitung li').each((_, el) => { const t = $(el).text().trim(); if (t) instructions.push(t); });
    const coaching_points = [];
    $('.coaching-punkte li, .hinweise li, .tipps li').each((_, el) => { const t = $(el).text().trim(); if (t) coaching_points.push(t); });
    const variations = [];
    $('.variationen li, .variante li').each((_, el) => { const t = $(el).text().trim(); if (t) variations.push(t); });
    const tags = [];
    $('.tags a, .kategorien a').each((_, el) => { const t = $(el).text().trim(); if (t) tags.push(t.toLowerCase()); });
    const bodyText = $('body').text();
    const durationText = $('[class*="dauer"], [class*="zeit"]').first().text().trim() || bodyText;
    const playersText = $('[class*="spieler"], [class*="anzahl"]').first().text().trim() || bodyText;
    const ageText = $('[class*="alter"], [class*="altersgruppe"]').first().text().trim();
    return buildExercise({ title, description, objectives, instructions, coaching_points, variations, tags, duration_text: durationText, players_text: playersText, age_text: ageText, url }, PLATFORM, COUNTRY, LANGUAGE);
  } catch (err) {
    console.warn(`  [fussballtraining24] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapFussballtraining24(options = {}) {
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
    const ex = await scrapeUebung(url);
    if (ex?.title) { exercises.push(ex); await sleep(DELAYS.betweenPages); }
  }
  return deduplicateExercises(exercises);
}
