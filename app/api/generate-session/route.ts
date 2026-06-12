import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';
import { generateSeance } from '@/lib/seance/generator';
import {
  CATEGORIES,
  CHARGES,
  THEMES,
  type Categorie,
  type Charge,
  type SeanceParams,
  type ThemeId,
} from '@/lib/seance/schema';

export const maxDuration = 120;

/** Mappe l'ancien format (theme/load/school/playerCount) vers les paramètres v2 */
function parseParams(body: Record<string, unknown>): SeanceParams | null {
  const themeIds = THEMES.map((t) => t.id) as string[];
  const legacyThemeMap: Record<string, ThemeId> = {
    possession: 'possession',
    pressing: 'pressing',
    transitions: 'transitions',
    centre: 'ailes',
    ailes: 'ailes',
    controle: 'technique',
    vitesse: 'vitesse',
    phases: 'finition',
    '1v1': 'duels',
  };

  const themeRaw = String(body.theme ?? '');
  const theme = themeIds.includes(themeRaw)
    ? (themeRaw as ThemeId)
    : legacyThemeMap[themeRaw];
  if (!theme) return null;

  const categorie = CATEGORIES.includes(body.categorie as Categorie)
    ? (body.categorie as Categorie)
    : 'Seniors';

  const chargeRaw = (body.charge ?? body.load) as Charge;
  const charge = CHARGES.includes(chargeRaw) ? chargeRaw : 'Modérée';

  const effectifRaw = Number(body.effectif ?? body.playerCount);
  if (!Number.isFinite(effectifRaw)) return null;
  const effectif = Math.min(30, Math.max(4, Math.round(effectifRaw)));

  const dureeRaw = Number(body.duree ?? 90);
  const duree = Number.isFinite(dureeRaw)
    ? Math.min(150, Math.max(30, Math.round(dureeRaw / 5) * 5))
    : 90;

  return { theme, categorie, effectif, duree, charge };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const params = parseParams(body);

    if (!params) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides ou manquants (theme, effectif requis)' },
        { status: 400 }
      );
    }

    const email = typeof body.email === 'string' ? body.email.toLowerCase() : null;

    // Quota mensuel (si l'utilisateur est identifié et Firestore configuré)
    if (email && adminDb) {
      try {
        const userDoc = await adminDb.collection('users_access').doc(email).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const plan = userData?.plan || 'trial';
          const used = userData?.usage?.sessionsGeneratedThisMonth || 0;
          const limit = getLimit(plan, 'sessionsPerMonth');
          if (limit !== -1 && used >= limit) {
            return NextResponse.json(
              {
                success: false,
                error: 'Limite mensuelle de séances atteinte',
                hint: 'Passez au plan Coach Pro pour générer des séances en illimité.',
              },
              { status: 403 }
            );
          }
        }
      } catch (e) {
        console.error('Vérification quota impossible :', e);
      }
    }

    const { seance, source } = await generateSeance(params);

    if (email && adminDb) {
      try {
        const userRef = adminDb.collection('users_access').doc(email);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const used = userDoc.data()?.usage?.sessionsGeneratedThisMonth || 0;
          await userRef.update({ 'usage.sessionsGeneratedThisMonth': used + 1 });
        }
      } catch (e) {
        console.error('Incrément du compteur impossible :', e);
      }
    }

    return NextResponse.json({ success: true, data: seance, source });
  } catch (error) {
    console.error('Erreur génération de séance :', error);
    return NextResponse.json(
      { success: false, error: 'La génération a échoué, réessayez.' },
      { status: 500 }
    );
  }
}
