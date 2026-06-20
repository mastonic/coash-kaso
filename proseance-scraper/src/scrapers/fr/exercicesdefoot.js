/**
 * Scraper — exercicesdefoot.com (FR)
 * Stratégie : collectLinks sur pages de liste → scrape individuel
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.exercicesdefoot.com';
const PLATFORM = 'exercicesdefoot';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

const LIST_PAGES = [
  '/exercices/',
  '/exercices/technique/',
  '/exercices/tactique/',
  '/exercices/physique/',
  '/exercices/gardien/',
  '/exercices/echauffement/',
  '/exercices/tir/',
  '/exercices/passe/',
  '/exercices/jeu-reduit/',
];

async function collectLinks(listUrl, maxPages = 8) {
  const links = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}page/${page}/`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? '';
        // Match individual exercise URLs (deeper than list pages)
        if (
          (href.startsWith(BASE_URL) || href.startsWith('/')) &&
          href.includes('/exercice') &&
          !href.endsWith('/exercices/') &&
          href.split('/').filter(Boolean).length >= 3
        ) {
          const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          links.add(full);
          found++;
        }
      });
      if (found === 0) break;
      await sleep(DELAYS.betweenPages);
    } catch {
      break;
    }
  }
  return [...links];
}

async function scrapeExercise(url) {
  try {
    const $ = await loadPage(url);

    const title = $('h1').first().text().trim();
    if (!title || title.length < 3) return null;

    const description = $('.description, .intro, .resume, article p').first().text().trim();

    const instructions = [];
    $('.deroulement li, .consignes li, .instructions li, .etapes li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) instructions.push(t);
    });
    // Fallback: numbered paragraphs
    if (instructions.length === 0) {
      $('ol li').each((_, el) => {
        const t = $(el).text().trim();
        if (t) instructions.push(t);
      });
    }

    const objectives = [];
    $('.objectifs li, .buts li, .objectif li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) objectives.push(t);
    });

    const variations = [];
    $('.variantes li, .variations li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    const coaching_points = [];
    $('.conseils li, .coaching li, .criteres li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const tags = [];
    $('.tags a, .mots-cles a, .keywords a').each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t.toLowerCase());
    });

    const fullText = $('article, main, .content').text();
    const durationText = $('[class*="duree"], [class*="temps"]').first().text().trim() || fullText;
    const playersText = $('[class*="joueur"], [class*="effectif"]').first().text().trim() || fullText;
    const ageText = $('[class*="age"], [class*="categorie"]').first().text().trim();
    const diagramDescription = $('[class*="schema"], [class*="terrain"], [class*="diagram"]').first().text().trim() || null;

    return buildExercise(
      {
        title,
        description,
        objectives,
        instructions,
        variations,
        coaching_points,
        tags,
        duration_text: durationText,
        players_text: playersText,
        age_text: ageText,
        diagram_description: diagramDescription,
        url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );
  } catch (err) {
    console.warn(`  [exercicesdefoot] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapExercicesdefoot(options = {}) {
  const { maxExercises = 400, dryRun = false } = options;
  const allLinks = new Set();

  for (const listPage of LIST_PAGES) {
    console.log(`  [exercicesdefoot] Collecte liens : ${listPage}`);
    const links = await collectLinks(listPage);
    links.forEach((l) => allLinks.add(l));
    console.log(`    → ${links.length} liens (total: ${allLinks.size})`);
    await sleep(DELAYS.betweenSites);
  }

  const linkArray = [...allLinks].slice(0, maxExercises * 2);
  const exercises = [];

  for (const url of linkArray) {
    if (exercises.length >= maxExercises) break;
    const ex = await scrapeExercise(url);
    if (ex && ex.title) {
      exercises.push(ex);
      if (!dryRun) await sleep(DELAYS.betweenPages);
    }
  }

  console.log(`  [exercicesdefoot] Total brut : ${exercises.length}`);
  return deduplicateExercises(exercises);
}
