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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const firestore = getDB();
    const doc = await firestore.collection('shared_sessions').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Check if expired
    if (data?.expiresAt && new Date(data.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionData: data?.sessionData,
      theme: data?.theme,
      load: data?.load,
      school: data?.school,
      playerCount: data?.playerCount,
    });
  } catch (error) {
    console.error('Get shared session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load session' },
      { status: 500 }
    );
  }
}
