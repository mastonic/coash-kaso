import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

let db: any = null;

function getDB() {
  if (!db) {
    const serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
    }
    db = getFirestore();
  }
  return db;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionData, theme, load, school, playerCount } = await request.json();

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Session data required' },
        { status: 400 }
      );
    }

    // Generate unique share ID
    const shareId = Math.random().toString(36).substring(2, 11);

    // Save to Firestore
    const firestore = getDB();
    await firestore.collection('shared_sessions').doc(shareId).set({
      sessionData,
      theme,
      load,
      school,
      playerCount,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchai-henna.vercel.app'}/share/${shareId}`;

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
    });
  } catch (error) {
    console.error('Share session error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to share' },
      { status: 500 }
    );
  }
}
