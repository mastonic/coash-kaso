/**
 * Script admin : définir le plan d'un ou plusieurs utilisateurs dans Firestore.
 *
 * Usage :
 *   node scripts/set-plan.mjs coach_pro email1@example.com email2@example.com
 *   node scripts/set-plan.mjs trial email@example.com
 *
 * Requiert les variables d'environnement Firebase dans .env.local :
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charger .env.local manuellement (pas de dotenv requis)
function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  try {
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  } catch {
    // .env.local absent — on suppose que les vars sont déjà dans l'env
  }
}

loadEnv();

const VALID_PLANS = ['trial', 'coach_pro', 'rt_manager'];
const [, , plan, ...emails] = process.argv;

if (!plan || !VALID_PLANS.includes(plan) || emails.length === 0) {
  console.error(`Usage : node scripts/set-plan.mjs <plan> <email> [email2 ...]`);
  console.error(`Plans disponibles : ${VALID_PLANS.join(', ')}`);
  process.exit(1);
}

const { projectId, privateKey, clientEmail } = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!projectId || !privateKey || !clientEmail) {
  console.error('Variables Firebase manquantes : FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
  process.exit(1);
}

// Import dynamique firebase-admin
const { initializeApp, cert, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, privateKey, clientEmail }) });
const db = getFirestore(app);

const currentMonth = new Date().toISOString().slice(0, 7);

for (const rawEmail of emails) {
  const email = rawEmail.toLowerCase().trim();
  const ref = db.collection('users_access').doc(email);

  await ref.set({
    email,
    plan,
    status: plan === 'trial' ? 'trial' : 'active',
    planUpdatedAt: new Date().toISOString(),
    usage: {
      sessionsGeneratedThisMonth: 0,
      currentMonth,
      videoAnalysesUsed: 0,
    },
  }, { merge: true });

  console.log(`✓ ${email} → plan "${plan}"`);
}

console.log('\nTerminé. Les changements sont effectifs immédiatement.');
