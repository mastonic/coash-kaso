import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const snapshot = await firestore
      .collection('teams')
      .doc(email)
      .collection('players')
      .orderBy('createdAt', 'asc')
      .get();

    const players = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      players,
    });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, position, number } = await request.json();

    if (!email || !name || !position || !number) {
      return NextResponse.json(
        { success: false, error: 'Email, name, position, and number required' },
        { status: 400 }
      );
    }

    const playerId = `player-${Date.now()}`;
    const now = new Date().toISOString();

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('players')
      .doc(playerId)
      .set({
        id: playerId,
        name,
        position,
        number,
        photoUrl: undefined,
        photoStoragePath: undefined,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      player: {
        id: playerId,
        name,
        position,
        number,
        photoUrl: undefined,
        photoStoragePath: undefined,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Create player error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create player' },
      { status: 500 }
    );
  }
}
