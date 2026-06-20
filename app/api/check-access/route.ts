import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Mode démo : sans Firebase configuré, l'accès est accordé en essai.
    // Permet d'utiliser l'app (génération, historique local) sans backend.
    if (!adminDb) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        plan: 'trial',
        status: 'demo',
        usage: null,
        email: normalizedEmail,
      });
    }

    const userDoc = await adminDb
      .collection('users_access')
      .doc(normalizedEmail)
      .get();

    const userData = userDoc.data();
    let hasAccess = false;

    if (userData) {
      // Expiration de la période d'essai
      if (userData.plan === 'trial' && userData.trialEndsAt) {
        const trialEndsAt = new Date(userData.trialEndsAt);
        if (new Date() > trialEndsAt && userData.status === 'active') {
          userData.status = 'expired';
          await adminDb
            .collection('users_access')
            .doc(normalizedEmail)
            .update({ status: 'expired' });
        }
      }

      hasAccess = userData.status === 'active';
    }

    return NextResponse.json({
      success: true,
      hasAccess,
      plan: userData?.plan || null,
      status: userData?.status || null,
      usage: userData?.usage || null,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Error checking access:', error);
    const message =
      error instanceof Error ? error.message : 'Erreur vérification accès';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
