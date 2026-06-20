/**
 * Scraper — mycoachfootball.com (FR)
 * Pages : /exercices-football/*
 */

import { loadPage, fetchPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.mycoachfootball.com';
const PLATFORM = 'mycoachfootball';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

const CATEGORY_PATHS = [
  '/exercices-football/passe',
  '/exercices-football/tir',
  '/exercices-football/dribble',
  '/exercices-football/defense',
  '/exercices-football/physique',
  '/exercices-football/gardien',
  '/exercices-football/tactique',
  '/exercices-football/echauffement',
];

async function scrapeExercisePage(url) {
  try {
    const $ = await loadPage(url);

    const title = $('h1').first().text().trim() || $('.exercise-title').first().text().trim();
    if (!title) return null;

    const description = $('.exercise-description, .description, .intro').first().text().trim();
    const objectivesText = $('.objectives, .objectifs, .buts').text().trim();
    const instructionsEls = $('.instructions li, .deroulement li, .consignes li');
    const instructions = [];
    instructionsEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) instructions.push(t);
    });

    const variationsEls = $('.variations li, .variantes li');
    const variations = [];
    variationsEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    const coachingEls = $('.coaching-points li, .conseils li, .criteres li');
    const coaching_points = [];
    coachingEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const tagsEls = $('.tags a, .categories a, .tag');
    const tags = [];
    tagsEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t.toLowerCase());
    });

    const durationText = $('.duration, .duree, .temps').first().text().trim();
    const playersText = $('.players, .joueurs, .effectif').first().text().trim();
    const equipmentText = $('.equipment, .materiel, .equipement').first().text().trim();
    const ageText = $('.age, .categorie-age').first().text().trim();

    return buildExercise(
      {
        title,
        description,
        objective: objectivesText || undefined,
        instructions,
        variations,
        coaching_points,
        tags,
        duration_text: durationText,
        players_text: playersText,
        equipment_text: equipmentText,
        age_text: ageText,
        url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );
  } catch (err) {
    console.warn(`  [mycoachfootball] Erreur page ${url}: ${err.message}`);
    return null;
  }
}

async function collectExerciseLinks(categoryUrl, maxPages = 5) {
  const links = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? categoryUrl : `${categoryUrl}?page=${page}`;
    try {
      const $ = await loadPage(url);
      const found = [];
      $('a[href*="/exercices-football/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.endsWith('/') && href.split('/').length > 3) {
          found.push(href.startsWith('http') ? href : `${BASE_URL}${href}`);
        }
      });
      if (found.length === 0) break;
      found.forEach((l) => links.add(l));
      await sleep(DELAYS.betweenPages);
    } catch {
      break;
    }
  }
  return [...links];
}

export async function scrapMycoachfootball(options = {}) {
  const { maxExercises = 200, dryRun = false } = options;
  const exercises = [];

  for (const path of CATEGORY_PATHS) {
    if (exercises.length >= maxExercises) break;
    const categoryUrl = `${BASE_URL}${path}`;
    console.log(`  [mycoachfootball] Catégorie : ${path}`);

    const links = await collectExerciseLinks(categoryUrl);
    console.log(`    → ${links.length} liens trouvés`);

    for (const link of links) {
      if (exercises.length >= maxExercises) break;
      const ex = await scrapeExercisePage(link);
      if (ex && ex.title) {
        exercises.push(ex);
        if (!dryRun) await sleep(DELAYS.betweenPages);
      }
    }
    await sleep(DELAYS.betweenSites);
  }

  return deduplicateExercises(exercises);
}
