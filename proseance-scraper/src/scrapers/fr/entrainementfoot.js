// Scraper — entrainement-foot.fr (FR)
// ~600 exercices publics avec titre, durée, effectif, thème, catégorie d'âge
// Les pages de liste sont publiques ; les fiches détail sont en partie payantes.

import { loadPage, buildExercise, deduplicateExercises, sleep } from '../../utils/helpers.js';
import { DELAYS } from '../../config.js';

const BASE_URL = 'https://www.entrainement-foot.fr';
const PLATFORM = 'entrainementfoot';
const COUNTRY = 'FR';
const LANGUAGE = 'fr';

// Pages de liste publiques — filtrées par thème et par catégorie d'âge
const LIST_PAGES = [
  '/exercices-foot-tags/passes',
  '/exercices-foot-tags/tir',
  '/exercices-foot-tags/dribble',
  '/exercices-foot-tags/defense',
  '/exercices-foot-tags/gardien',
  '/exercices-foot-tags/pressing',
  '/exercices-foot-tags/transition',
  '/exercices-foot-theme/tactique',
  '/exercices-foot-theme/physique',
  '/exercices-foot-theme/technique',
  '/exercices-foot-theme/jeux-reduits',
  '/exercices-foot-theme/echauffement',
  '/exercices-foot-theme/possession',
  '/exercices-foot-categorie/seniors',
  '/exercices-foot-categorie/u17',
  '/exercices-foot-categorie/u15',
  '/exercices-foot-categorie/u13',
];

/**
 * Extrait les cartes d'exercices sur une page de liste.
 * Retourne { url, title, durationText, playersText, themeText, ageText }[]
 */
async function scrapeListPage(path) {
  const fullUrl = `${BASE_URL}${path}`;
  try {
    const $ = await loadPage(fullUrl);
    const items = [];

    // Sélecteurs communs pour les cartes d'exercices
    $('a[href*="/exercices-foot/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      if (!href.includes('/exercices-foot/')) return;

      const card = $(el);
      const parent = card.closest('article, .exercise-card, .card, .item, li, div[class*="exercise"]');
      const container = parent.length ? parent : card;

      // Titre : texte du lien ou h2/h3/h4 enfant
      const title =
        container.find('h2, h3, h4').first().text().trim() ||
        card.find('h2, h3, h4').first().text().trim() ||
        card.attr('title') ||
        card.text().trim().split('\n')[0].trim();

      if (!title || title.length < 5) return;

      // Métadonnées de la carte
      const containerText = container.text();

      const durationMatch = containerText.match(/(\d+)\s*min/i);
      const durationText = durationMatch ? durationMatch[0] : '';

      const playersMatch = containerText.match(/(\d+[-–]\d+|\d+)\s*joueurs?/i);
      const playersText = playersMatch ? playersMatch[0] : '';

      const themeText =
        container.find('[class*="theme"], [class*="tag"], [class*="category"]').first().text().trim() ||
        path.replace(/.*\/(theme|tags|categorie)\//, '').replace(/-/g, ' ');

      const ageText =
        container.find('[class*="age"], [class*="categorie"]').first().text().trim() ||
        containerText.match(/U\d+\s*[-–]\s*(?:U\d+|[Ss]éniors?)/i)?.[0] || '';

      const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`;

      items.push({ url: fullHref, title, durationText, playersText, themeText, ageText });
    });

    return items;
  } catch (err) {
    console.warn(`  [entrainementfoot] Erreur liste ${path}: ${err.message}`);
    return [];
  }
}

/**
 * Tente de récupérer le contenu détaillé d'une fiche (parfois partiellement public).
 */
async function scrapeDetail(url) {
  try {
    const $ = await loadPage(url);

    const description =
      $('meta[name="description"]').attr('content') ||
      $('.exercise-description, .description, .intro, article p').first().text().trim();

    const objectives = [];
    $('.objectives li, .objectifs li, .buts li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) objectives.push(t);
    });

    const instructions = [];
    $('ol li, .instructions li, .consignes li, .deroulement li').each((_, el) => {
      const t = $(el).text().trim();
      if (t && !t.includes('Accéder') && !t.includes('inscription')) instructions.push(t);
    });

    const coaching_points = [];
    $('[class*="coaching"] li, [class*="conseil"] li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) coaching_points.push(t);
    });

    const variations = [];
    $('[class*="variante"] li, [class*="variation"] li, [class*="progres"] li').each((_, el) => {
      const t = $(el).text().trim();
      if (t) variations.push(t);
    });

    // Schéma tactique : alt de l'image principale
    const diagramDescription =
      $('img[alt][src*="schema"], img[alt][src*="terrain"], img[alt][src*="tactic"]')
        .first()
        .attr('alt') || null;

    return { description, objectives, instructions, coaching_points, variations, diagramDescription };
  } catch {
    return {};
  }
}

export async function scrapEntrainementfoot(options = {}) {
  const { maxExercises = 500, dryRun = false } = options;
  const allItems = new Map(); // url → metadata (dédup par URL)

  // ── 1. Collecter les métadonnées depuis les pages de liste ────────────────
  for (const listPath of LIST_PAGES) {
    if (allItems.size >= maxExercises * 2) break;
    console.log(`  [entrainementfoot] Liste : ${listPath}`);
    const items = await scrapeListPage(listPath);
    items.forEach((item) => {
      if (!allItems.has(item.url)) allItems.set(item.url, item);
    });
    console.log(`    → ${items.length} cartes (total unique: ${allItems.size})`);
    await sleep(DELAYS.betweenSites);
  }

  // ── 2. Pour chaque exercice, tenter d'enrichir avec les détails ───────────
  const exercises = [];
  const entries = [...allItems.values()].slice(0, maxExercises);

  for (const item of entries) {
    if (exercises.length >= maxExercises) break;

    let detail = {};
    if (!dryRun) {
      detail = await scrapeDetail(item.url);
      await sleep(DELAYS.betweenPages);
    }

    const ex = buildExercise(
      {
        title: item.title,
        description: detail.description ?? '',
        objectives: detail.objectives ?? [],
        instructions: detail.instructions ?? [],
        coaching_points: detail.coaching_points ?? [],
        variations: detail.variations ?? [],
        diagram_description: detail.diagramDescription ?? null,
        duration_text: item.durationText,
        players_text: item.playersText,
        age_text: item.ageText,
        category_text: item.themeText,
        url: item.url,
      },
      PLATFORM,
      COUNTRY,
      LANGUAGE,
    );

    if (ex.title) exercises.push(ex);
  }

  console.log(`  [entrainementfoot] Total brut : ${exercises.length}`);
  return deduplicateExercises(exercises);
}
