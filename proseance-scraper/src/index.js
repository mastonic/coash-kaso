/**
 * ProSeance Scraper — CLI runner
 *
 * Usage:
 *   node src/index.js [--country=FR|EN|ES|DE|NL|ALL] [--site=mycoachfootball] [--dry-run] [--max=100]
 *
 * Exemples:
 *   node src/index.js --dry-run --max=10
 *   node src/index.js --country=FR
 *   node src/index.js --country=ALL --max=200
 *   node src/index.js --site=englandfootball --max=50
 */

import 'dotenv/config';
import pLimit from 'p-limit';

import { importExercisesBatch, logScrapingJob, updateScrapingJob } from './utils/firestore.js';
import { filterByQuality, deduplicateExercises } from './utils/helpers.js';
import { DELAYS } from './config.js';

// ── Scrapers FR ───────────────────────────────────────────────────────────────
import { scrapEntrainementfoot } from './scrapers/fr/entrainementfoot.js';
import { scrapEntrainementdefoot } from './scrapers/fr/entrainementdefoot.js';
import { scrapExercicesdefoot } from './scrapers/fr/exercicesdefoot.js';
import { scrapFootballtraining4all } from './scrapers/fr/footballtraining4all.js';
import { scrapEasy2coach } from './scrapers/fr/easy2coach.js';

// ── Scrapers EN ───────────────────────────────────────────────────────────────
import { scrapEnglandfootball } from './scrapers/en/englandfootball.js';
import { scrapThecoachingmanual } from './scrapers/en/thecoachingmanual.js';
import { scrapSoccerprofile } from './scrapers/en/soccerprofile.js';

// ── Scrapers ES ───────────────────────────────────────────────────────────────
import { scrapFutbolsesion } from './scrapers/es/futbolsesion.js';
import { scrapToplidercoach } from './scrapers/es/toplidercoach.js';

// ── Scrapers DE ───────────────────────────────────────────────────────────────
import { scrap99coaches } from './scrapers/de/99coaches.js';
import { scrapFussballtraining24 } from './scrapers/de/fussballtraining24.js';

// ── Scrapers NL ───────────────────────────────────────────────────────────────
import { scrapOefenstofdatabase } from './scrapers/nl/oefenstofdatabase.js';
import { scrapTrainerssite } from './scrapers/nl/trainerssite.js';

// ── Registry ──────────────────────────────────────────────────────────────────

const SCRAPERS = [
  { id: 'entrainementfoot',      country: 'FR', fn: scrapEntrainementfoot },
  { id: 'entrainementdefoot',    country: 'FR', fn: scrapEntrainementdefoot },
  { id: 'exercicesdefoot',       country: 'FR', fn: scrapExercicesdefoot },
  { id: 'footballtraining4all',  country: 'FR', fn: scrapFootballtraining4all },
  { id: 'easy2coach',            country: 'FR', fn: scrapEasy2coach },

  { id: 'englandfootball',       country: 'EN', fn: scrapEnglandfootball },
  { id: 'thecoachingmanual',     country: 'EN', fn: scrapThecoachingmanual },
  { id: 'soccerprofile',         country: 'EN', fn: scrapSoccerprofile },

  { id: 'futbolsesion',          country: 'ES', fn: scrapFutbolsesion },
  { id: 'toplidercoach',         country: 'ES', fn: scrapToplidercoach },

  { id: '99coaches',             country: 'DE', fn: scrap99coaches },
  { id: 'fussballtraining24',    country: 'DE', fn: scrapFussballtraining24 },

  { id: 'oefenstofdatabase',     country: 'NL', fn: scrapOefenstofdatabase },
  { id: 'trainerssite',          country: 'NL', fn: scrapTrainerssite },
];

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const entry = args.find((a) => a.startsWith(`--${flag}=`));
    return entry ? entry.split('=')[1] : null;
  };
  return {
    country: (get('country') ?? 'ALL').toUpperCase(),
    site: get('site') ?? null,
    dryRun: args.includes('--dry-run'),
    maxPerSite: parseInt(get('max') ?? '500'),
    minQuality: parseInt(get('min-quality') ?? process.env.SCRAPER_MIN_QUALITY_SCORE ?? '30'),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { country, site, dryRun, maxPerSite, minQuality } = parseArgs();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         ProSeance Scraper v1.0                       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Mode    : ${dryRun ? 'DRY-RUN (aucune écriture)' : 'PRODUCTION'}`);
  console.log(`  Pays    : ${country}`);
  console.log(`  Site    : ${site ?? 'tous'}`);
  console.log(`  Max/site: ${maxPerSite}`);
  console.log(`  Qualité : ≥ ${minQuality}`);
  console.log('');

  // Filtrer les scrapers selon --country et --site
  let selected = SCRAPERS;
  if (country !== 'ALL') {
    selected = selected.filter((s) => s.country === country);
  }
  if (site) {
    selected = selected.filter((s) => s.id === site);
  }

  if (selected.length === 0) {
    console.error('Aucun scraper correspondant. Vérifiez --country et --site.');
    process.exit(1);
  }

  console.log(`  Scrapers sélectionnés : ${selected.map((s) => s.id).join(', ')}\n`);

  const jobId = dryRun ? null : await logScrapingJob({
    country,
    site: site ?? 'ALL',
    max_per_site: maxPerSite,
    min_quality: minQuality,
    status: 'running',
    scrapers: selected.map((s) => s.id),
  }).catch(() => null);

  const globalStats = { added: 0, updated: 0, skipped: 0, errors: 0 };
  const limit = pLimit(1); // Séquentiel pour respecter les délais

  const tasks = selected.map((scraper) =>
    limit(async () => {
      console.log(`\n▶ Scraping [${scraper.country}] ${scraper.id} …`);
      const siteStart = Date.now();
      try {
        const raw = await scraper.fn({ maxExercises: maxPerSite, dryRun });
        const filtered = filterByQuality(raw, minQuality);
        const deduped = deduplicateExercises(filtered);

        console.log(`  Résultats bruts   : ${raw.length}`);
        console.log(`  Après qualité ≥${minQuality}: ${filtered.length}`);
        console.log(`  Après dédup locale: ${deduped.length}`);

        if (deduped.length > 0) {
          const stats = await importExercisesBatch(deduped, dryRun);
          globalStats.added += stats.added;
          globalStats.updated += stats.updated;
          globalStats.skipped += stats.skipped;
        }

        const elapsed = ((Date.now() - siteStart) / 1000).toFixed(1);
        console.log(`  ✓ ${scraper.id} terminé en ${elapsed}s`);
      } catch (err) {
        globalStats.errors++;
        console.error(`  ✗ ${scraper.id} ERREUR: ${err.message}`);
      }
    }),
  );

  await Promise.all(tasks);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  RÉSUMÉ FINAL                                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Ajoutés  : ${globalStats.added}`);
  console.log(`  Mis à jour: ${globalStats.updated}`);
  console.log(`  Ignorés  : ${globalStats.skipped}`);
  console.log(`  Erreurs  : ${globalStats.errors}`);

  if (jobId) {
    await updateScrapingJob(jobId, {
      status: globalStats.errors > 0 ? 'partial' : 'done',
      ...globalStats,
      finished_at: new Date().toISOString(),
    }).catch(() => {});
  }

  process.exit(globalStats.errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
