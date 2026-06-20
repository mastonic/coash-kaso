/**
 * Firebase Admin — Importation des exercices dans Firestore.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import 'dotenv/config';

let _db = null;

export function initFirebase() {
  if (_db) return _db;

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    throw new Error('Variables d\'environnement Firebase manquantes. Copiez .env.example → .env');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }

  _db = getFirestore();
  return _db;
}

/**
 * Importe les exercices en Firestore par batch de 400.
 *
 * @param {object[]} exercises  Exercices normalisés (output de buildExercise())
 * @param {boolean}  dryRun     Si true, affiche sans écrire
 * @returns {{ added: number, updated: number, skipped: number }}
 */
export async function importExercisesBatch(exercises, dryRun = false) {
  const db = initFirebase();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  // Vérifier quels IDs existent déjà (requête par source_platform pour éviter les doublons)
  const platforms = [...new Set(exercises.map((e) => e.source_platform).filter(Boolean))];
  const existingTitles = new Set();

  for (const platform of platforms) {
    try {
      const snap = await db
        .collection('exercises')
        .where('source_platform', '==', platform)
        .select('title')
        .get();
      snap.forEach((doc) => {
        existingTitles.add(`${platform}::${doc.data().title?.toLowerCase().trim()}`);
      });
    } catch {
      // Continuer même si la vérification échoue
    }
  }

  // Découper en chunks de 400
  const chunks = [];
  for (let i = 0; i < exercises.length; i += 400) {
    chunks.push(exercises.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    if (dryRun) {
      console.log(`  [DRY-RUN] Seraient importés: ${chunk.length} exercices`);
      chunk.slice(0, 3).forEach((e) => console.log(`    → ${e.title} (${e.source_platform})`));
      added += chunk.length;
      continue;
    }

    const batch = db.batch();
    for (const exercise of chunk) {
      const key = `${exercise.source_platform}::${(exercise.title ?? '').toLowerCase().trim()}`;
      const isNew = !existingTitles.has(key);

      // Utiliser le hash titre+plateforme comme ID déterministe
      const docId = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_').slice(0, 50);
      const ref = db.collection('exercises').doc(docId);

      if (isNew) {
        batch.set(ref, exercise);
        existingTitles.add(key);
        added++;
      } else {
        // Mise à jour partielle : qualité + métadonnées, pas le contenu existant
        batch.update(ref, {
          quality_score: exercise.quality_score,
          scraped_at: exercise.scraped_at,
          is_active: true,
        });
        updated++;
      }
    }

    await batch.commit();
    console.log(`  Batch importé: +${added} ajoutés, ~${updated} mis à jour`);
  }

  return { added, updated, skipped };
}

/**
 * Enregistre un job de scraping dans /scraping_jobs.
 */
export async function logScrapingJob(jobData) {
  if (!_db) return null;
  const ref = _db.collection('scraping_jobs').doc();
  await ref.set({
    ...jobData,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateScrapingJob(jobId, updates) {
  if (!_db || !jobId) return;
  await _db.collection('scraping_jobs').doc(jobId).update({
    ...updates,
    updated_at: new Date().toISOString(),
  });
}
