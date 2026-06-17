import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';
import { generateSeance } from '@/lib/seance/generator';
import {
  CATEGORIES,
  CHARGES,
  DOMAINES,
  ECOLES,
  THEMES,
  type Categorie,
  type Charge,
  type EcoleDeJeu,
  type SeanceParams,
  type SousThemeId,
} from '@/lib/seance/schema';

export const maxDuration = 120;

/** Mappe l'ancien format (theme/load/school/playerCount) vers les paramètres v2 */
function parseParams(body: Record<string, unknown>): SeanceParams | null {
  const allSousThemeIds = new Set<string>([
    ...THEMES.map((t) => t.id),
    ...DOMAINES.flatMap((d) => d.sousThemes.map((s) => s.id)),
  ]);

  const legacyThemeMap: Record<string, SousThemeId> = {
    centre: 'ailes',
    controle: 'technique',
    phases: 'finition',
    '1v1': 'duels',
  };

  const themeRaw = String(body.theme ?? '');
  const theme = allSousThemeIds.has(themeRaw)
    ? (themeRaw as SousThemeId)
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

  const ecoleRaw = body.ecole as string | undefined;
  const ecole = ecoleRaw && ECOLES.some((e) => e.id === ecoleRaw)
    ? (ecoleRaw as EcoleDeJeu)
    : undefined;

  return { theme, categorie, effectif, duree, charge, ecole };
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
        const userRef = adminDb.collection('users_access').doc(email);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const plan = userData.plan || 'trial';
          const limit = getLimit(plan, 'sessionsPerMonth');
          if (limit !== -1) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const trackedMonth = userData.usage?.currentMonth;
            const used = trackedMonth === currentMonth
              ? (userData.usage?.sessionsGeneratedThisMonth || 0)
              : 0;
            if (used >= limit) {
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
        }
      } catch (e) {
        console.error('Vérification quota impossible :', e);
      }
    }

    const exercicesRecents = Array.isArray(body.exercicesRecents)
      ? (body.exercicesRecents as string[]).filter((s) => typeof s === 'string')
      : undefined;

    const { seance, source } = await generateSeance(params, exercicesRecents);

    if (email && adminDb) {
      try {
        const userRef = adminDb.collection('users_access').doc(email);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const currentMonth = new Date().toISOString().slice(0, 7);
          const trackedMonth = userDoc.data()?.usage?.currentMonth;
          const used = trackedMonth === currentMonth
            ? (userDoc.data()?.usage?.sessionsGeneratedThisMonth || 0)
            : 0;
          await userRef.update({
            'usage.sessionsGeneratedThisMonth': used + 1,
            'usage.currentMonth': currentMonth,
          });
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
