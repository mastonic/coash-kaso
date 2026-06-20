import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';
import { generateDraft } from '@/lib/seance/generator';
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

function parseDraftParams(body: Record<string, unknown>): SeanceParams | null {
  // Collect all valid sous-theme IDs
  const allSousThemeIds = new Set<string>([
    ...THEMES.map((t) => t.id),
    ...DOMAINES.flatMap((d) => d.sousThemes.map((s) => s.id)),
  ]);

  const themeRaw = String(body.theme ?? '');
  if (!allSousThemeIds.has(themeRaw)) return null;
  const theme = themeRaw as SousThemeId;

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
    const params = parseDraftParams(body);

    if (!params) {
      return NextResponse.json(
        { success: false, error: 'Paramètres invalides ou manquants (theme, effectif requis)' },
        { status: 400 }
      );
    }

    const email = typeof body.email === 'string' ? body.email.toLowerCase() : null;
    const exercicesRecents = Array.isArray(body.exercicesRecents)
      ? (body.exercicesRecents as string[]).filter((s) => typeof s === 'string')
      : undefined;

    // Vérification du quota mensuel
    if (email && adminDb) {
      try {
        const userRef = adminDb.collection('users_access').doc(email);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          const userData = userDoc.data()!;
          const plan = userData.plan || 'trial';
          const limit = getLimit(plan, 'sessionsPerMonth');

          if (limit !== -1) {
            const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
            const trackedMonth = userData.usage?.currentMonth;
            // Remise à zéro automatique si nouveau mois
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

            // Incrément compteur (après génération réussie)
            const { draft, source } = await generateDraft(params, exercicesRecents);
            await userRef.update({
              'usage.sessionsGeneratedThisMonth': used + 1,
              'usage.currentMonth': currentMonth,
            }).catch((e) => console.error('Incrément quota impossible :', e));
            return NextResponse.json({ success: true, data: draft, source });
          }
        }
      } catch (e) {
        console.error('Vérification quota impossible :', e);
        // En cas d'erreur Firestore, on laisse passer sans bloquer
      }
    }

    // Pas de quota (plan illimité, pas d'email, ou Firestore non configuré)
    const { draft, source } = await generateDraft(params, exercicesRecents);
    return NextResponse.json({ success: true, data: draft, source });
  } catch (error) {
    console.error('Erreur génération draft :', error);
    return NextResponse.json(
      { success: false, error: 'La génération a échoué, réessayez.' },
      { status: 500 }
    );
  }
}
