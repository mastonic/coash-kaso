/**
 * Script admin : définir le plan d'un ou plusieurs utilisateurs dans Firestore.
 *
 * Usage avec fichier JSON service account (recommandé) :
 *   node scripts/set-plan.mjs --keyfile=/chemin/vers/serviceAccount.json coach_pro email1@example.com email2@example.com
 *
 * Usage avec variables d'environnement (Node ≤ 20) :
 *   node --env-file=.env.local scripts/set-plan.mjs coach_pro email1@example.com
 *
 * Plans disponibles : trial | coach_pro | rt_manager
 */

const VALID_PLANS = ['trial', 'coach_pro', 'rt_manager'];

// Extraire --keyfile= des arguments
const args = process.argv.slice(2);
const keyfileArg = args.find((a) => a.startsWith('--keyfile='));
const restArgs = args.filter((a) => !a.startsWith('--'));
const [plan, ...emails] = restArgs;

if (!plan || !VALID_PLANS.includes(plan) || emails.length === 0) {
  console.error('Usage : node scripts/set-plan.mjs [--keyfile=sa.json] <plan> <email> [email2 ...]');
  console.error(`Plans disponibles : ${VALID_PLANS.join(', ')}`);
  process.exit(1);
}

// Import dynamique firebase-admin
const { initializeApp, cert, applicationDefault, getApps } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

let credential;

if (keyfileArg) {
  // Charger depuis un fichier JSON service account
  const keyfilePath = keyfileArg.replace('--keyfile=', '');
  const { readFileSync } = await import('fs');
  const { resolve } = await import('path');
  const sa = JSON.parse(readFileSync(resolve(process.cwd(), keyfilePath), 'utf-8'));
  credential = cert(sa);
  console.log(`Credentials chargées depuis : ${keyfilePath}`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Variable d'env standard Google
  credential = applicationDefault();
  console.log('Credentials chargées depuis GOOGLE_APPLICATION_CREDENTIALS');
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  // Variables d'env individuelles
  credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  });
  console.log('Credentials chargées depuis les variables d\'environnement');
} else {
  console.error('Aucune credential trouvée. Utilise --keyfile=sa.json ou définis GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ credential });
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
