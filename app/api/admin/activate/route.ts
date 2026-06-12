import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Activation d'un accès par l'admin.
 *
 * Relance un essai complet : statut actif ET nouvelle date d'expiration
 * (sinon un compte dont l'essai est passé ré-expire au login suivant).
 */
export async function POST(request: NextRequest) {
  try {
    const { email, days } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase non configuré sur ce déploiement' },
        { status: 503 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const trialDays = Number.isFinite(Number(days))
      ? Math.min(365, Math.max(1, Math.round(Number(days))))
      : 7;
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const ref = adminDb.collection('users_access').doc(normalizedEmail);
    const existing = await ref.get();
    const plan = existing.data()?.plan || 'trial';

    await ref.set(
      {
        email: normalizedEmail,
        status: 'active',
        plan,
        activatedAt: now.toISOString(),
        // Seuls les essais expirent ; les plans payants n'ont pas de date de fin
        ...(plan === 'trial' ? { trialEndsAt: trialEndsAt.toISOString() } : {}),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      plan,
      trialEndsAt: plan === 'trial' ? trialEndsAt.toISOString() : null,
      message:
        plan === 'trial'
          ? `Accès activé pour ${trialDays} jours`
          : 'Accès activé',
    });
  } catch (error) {
    console.error('Error activating user:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to activate user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
