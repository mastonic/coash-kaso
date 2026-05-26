import { NextRequest, NextResponse } from 'next/server';

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

    // Deactivate user by setting status to pending
    await db.collection('users_access').doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      status: 'pending',
      revokedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      email: email.toLowerCase(),
      message: 'User deactivated',
    });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
