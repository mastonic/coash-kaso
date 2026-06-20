/**
 * Scraper — englandfootball.com / FA (EN)
 * Pages : /coaching/coaching-resources/practices/*
 * Meilleure qualité : structured content with phases and objectives
 */

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.englandfootball.com';
const PLATFORM = 'englandfootball';
const COUNTRY = 'EN';
const LANGUAGE = 'en';

const LIST_URLS = [
  '/coaching/coaching-resources/practices',
  '/coaching/coaching-resources/practices?category=passing',
  '/coaching/coaching-resources/practices?category=shooting',
  '/coaching/coaching-resources/practices?category=dribbling',
  '/coaching/coaching-resources/practices?category=defending',
  '/coaching/coaching-resources/practices?category=possession',
  '/coaching/coaching-resources/practices?category=movement',
  '/coaching/coaching-resources/practices?category=goalkeeping',
];

async function collectPracticeLinks(listUrl) {
  const links = new Set();
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const url = page === 1 ? `${BASE_URL}${listUrl}` : `${BASE_URL}${listUrl}&page=${page}`;
    try {
      const $ = await loadPage(url);
      let found = 0;
      $('a[href*="/coaching/coaching-resources/practices/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          // Exclude list pages themselves
          if (!full.includes('?') || full.split('/').length > 6) {
            links.add(full.split('?')[0]); // remove query string
          }
          found++;
        }
      });
      if (found === 0) break;
      page++;
      await sleep(DELAYS.betweenPages);
    } catch {
      break;
    }
  }
  return [...links];
}

async function scrapePractice(url) {
  try {
    const $ = await loadPage(url);

    const title = $('h1').first().text().trim();
    if (!title) return null;

    const description = $('.practice-description, .description, .intro, .summary, article p').first().text().trim();

    const objectives = [];
    $('.objectives li, .aims li, .learning-outcomes li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) objectives.push(t);
    });

    const instructions = [];
    $('.instructions li, .practice-steps li, .how-to li, .setup li, ol li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) instructions.push(t);
    });

    const coaching_points = [];
    $('.coaching-points li, .key-points li, .look-for li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const variations = [];
    $('.progressions li, .variations li, .extensions li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    const tags = [];
    $('.tags a, .category-tag, .practice-tag').each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t.toLowerCase());
    });

    const durationText = $('[class*="duration"], [class*="time"], .practice-time').first().text().trim();
    const playersText = $('[class*="player"], [class*="number"], .players').first().text().trim();
    const ageText = $('[class*="age"], [class*="group"], .age-group').first().text().trim();
    const spaceText = $('[class*="area"], [class*="space"], [class*="pitch"]').first().text().trim();
    const equipmentText = $('[class*="equipment"], [class*="kit"]').first().text().trim();
    const diagramText = $('.diagram-description, .pitch-diagram figcaption').first().text().trim() || null;

    return buildExercise(
      {
        title,
        description,
        objectives,
        instructions,
        coaching_points,
        variations,
        tags,
        duration_text: durationText,
        players_text: playersText,
        age_text: ageText,
        space: spaceText,
        equipment: equipmentText ? [equipmentText] : undefined,
        diagram_description: diagramText,
        url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );
  } catch (err) {
    console.warn(`  [englandfootball] Erreur ${url}: ${err.message}`);
    return null;
  }
}

export async function scrapEnglandfootball(options = {}) {
  const { maxExercises = 300, dryRun = false } = options;
  const allLinks = new Set();

  for (const listUrl of LIST_URLS) {
    console.log(`  [englandfootball] Collecte : ${listUrl}`);
    const links = await collectPracticeLinks(listUrl);
    links.forEach((l) => allLinks.add(l));
    console.log(`    → ${links.length} liens (total: ${allLinks.size})`);
    await sleep(DELAYS.betweenSites);
  }

  const linkArray = [...allLinks].slice(0, maxExercises * 2);
  const exercises = [];

  for (const url of linkArray) {
    if (exercises.length >= maxExercises) break;
    const ex = await scrapePractice(url);
    if (ex && ex.title) {
      exercises.push(ex);
      if (!dryRun) await sleep(DELAYS.betweenPages);
    }
  }

  console.log(`  [englandfootball] Total brut : ${exercises.length}`);
  return deduplicateExercises(exercises);
}
