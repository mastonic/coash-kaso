import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | null = null;

// Initialisation seulement si les identifiants sont fournis : évite les
// erreurs au build et permet le mode démo sans configuration.
if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
) {
  try {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
  }
}

export const adminDb: Firestore | null = app ? getFirestore(app) : null;
export const isAdminConfigured = adminDb !== null;
