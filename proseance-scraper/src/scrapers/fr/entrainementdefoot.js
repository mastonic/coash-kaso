// Scraper — entrainementdefoot.com (FR)
// Pagination par catégorie : /category/{cat}/page/N/

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.entrainementdefoot.com';
const PLATFORM = 'entrainementdefoot';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

const CATEGORIES = [
  'technique',
  'tactique',
  'physique',
  'gardien',
  'echauffement',
  'jeux-reduits',
  'tir',
  'passe',
];

async function scrapeArticlePage(url) {
  try {
    const $ = await loadPage(url);

    const title = $('h1.entry-title, h1').first().text().trim();
    if (!title) return null;

    const description = $('.entry-summary, .excerpt, .intro-text').first().text().trim()
      || $('article p').first().text().trim();

    const instructionEls = $('.entry-content ol li, .consignes li, .deroulement li');
    const instructions = [];
    instructionEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) instructions.push(t);
    });

    const objectivesEls = $('.objectifs li, .objectives li');
    const objectives = [];
    objectivesEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) objectives.push(t);
    });

    const variationEls = $('.variantes li, .variations li');
    const variations = [];
    variationEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    const coachingEls = $('.conseils li, .coaching-points li');
    const coaching_points = [];
    coachingEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const tagsEls = $('.tags-links a, .post-tags a, .cat-links a');
    const tags = [];
    tagsEls.each((_, el) => {
      const t = $(el).text().trim();
      if (t && !['tag', 'category'].includes(t.toLowerCase())) tags.push(t.toLowerCase());
    });

    const bodyText = $('.entry-content').text();
    const ageText = $('[class*="age"], [class*="categorie"]').first().text().trim() || '';
    const durationText = $('[class*="duree"], [class*="temps"], [class*="duration"]').first().text().trim() || bodyText;
    const playersText = $('[class*="joueur"], [class*="effectif"], [class*="player"]').first().text().trim() || bodyText;

    return buildExercise(
      {
        title,
        description,
        objectives: objectives.length > 0 ? objectives : undefined,
        instructions,
        variations,
        coaching_points,
        tags,
        duration_text: durationText,
        players_text: playersText,
        age_text: ageText,
        url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );
  } catch (err) {
    console.warn(`  [entrainementdefoot] Erreur ${url}: ${err.message}`);
    return null;
  }
}

async function collectCategoryLinks(category, maxPages = 10) {
  const links = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1
      ? `${BASE_URL}/category/${category}/`
      : `${BASE_URL}/category/${category}/page/${page}/`;
    try {
      const $ = await loadPage(url);
      const found = [];
      $('h2.entry-title a, h3.entry-title a, article a.more-link').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes(BASE_URL.replace('https://', ''))) found.push(href);
      });
      // Fallback: any article link
      if (found.length === 0) {
        $('article a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith(BASE_URL) && !href.includes('/category/') && !href.includes('/page/')) {
            found.push(href);
          }
        });
      }
      if (found.length === 0) break;
      found.forEach((l) => links.add(l));
      await sleep(DELAYS.betweenPages);
    } catch {
      break;
    }
  }
  return [...links];
}

export async function scrapEntrainementdefoot(options = {}) {
  const { maxExercises = 300, dryRun = false } = options;
  const exercises = [];

  for (const category of CATEGORIES) {
    if (exercises.length >= maxExercises) break;
    console.log(`  [entrainementdefoot] Catégorie : ${category}`);

    const links = await collectCategoryLinks(category);
    console.log(`    → ${links.length} articles trouvés`);

    for (const link of links) {
      if (exercises.length >= maxExercises) break;
      const ex = await scrapeArticlePage(link);
      if (ex && ex.title) {
        exercises.push(ex);
        if (!dryRun) await sleep(DELAYS.betweenPages);
      }
    }
    await sleep(DELAYS.betweenSites);
  }

  return deduplicateExercises(exercises);
}
