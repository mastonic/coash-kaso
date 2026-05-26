import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const admin = await import('firebase-admin');

    if (!admin.apps.length) {
      const serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }

    const db = admin.firestore();
    const normalizedEmail = email.toLowerCase();

    // Check if user has access
    const userDoc = await db.collection('users_access').doc(normalizedEmail).get();

    let userData = userDoc.data();
    let hasAccess = false;

    if (userData) {
      // Check if trial has expired
      if (userData.plan === 'trial' && userData.trialEndsAt) {
        const trialEndsAt = new Date(userData.trialEndsAt);
        if (new Date() > trialEndsAt) {
          userData.status = 'expired';
          // Persist expiration
          if (adminDb) {
            await adminDb.collection('users_access').doc(normalizedEmail).update({
              status: 'expired',
            });
          }
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
  } catch (error: any) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur vérification accès' },
      { status: 500 }
    );
  }
}
