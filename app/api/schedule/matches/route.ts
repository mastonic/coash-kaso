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
    const from = searchParams.get('from') || '2000-01-01';
    const to = searchParams.get('to') || '2100-12-31';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    // Simplified query to avoid needing composite index
    const snapshot = await firestore
      .collection('teams')
      .doc(email)
      .collection('matches')
      .orderBy('date', 'asc')
      .get();

    // Filter in memory instead
    const filteredDocs = snapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return data.date >= from && data.date <= to;
    });

    const matches = filteredDocs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, opponent, date, time, venue, competition, availablePlayerIds } = await request.json();

    if (!email || !opponent || !date || !time || !venue) {
      return NextResponse.json(
        { success: false, error: 'Email, opponent, date, time, and venue required' },
        { status: 400 }
      );
    }

    const matchId = `match-${Date.now()}`;
    const now = new Date().toISOString();

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('matches')
      .doc(matchId)
      .set({
        id: matchId,
        opponent,
        date,
        time,
        venue,
        competition: competition || undefined,
        availablePlayerIds: availablePlayerIds || [],
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      match: {
        id: matchId,
        opponent,
        date,
        time,
        venue,
        competition,
        availablePlayerIds: availablePlayerIds || [],
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create match' },
      { status: 500 }
    );
  }
}
