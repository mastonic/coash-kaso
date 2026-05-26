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
    const snapshot = await firestore
      .collection('teams')
      .doc(email)
      .collection('trainings')
      .where('date', '>=', from)
      .where('date', '<=', to)
      .orderBy('date', 'asc')
      .orderBy('time', 'asc')
      .get();

    const trainings = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      trainings,
    });
  } catch (error) {
    console.error('Get trainings error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch trainings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, type, date, time, location, availablePlayerIds, notes } = await request.json();

    if (!email || !type || !date || !time || !location) {
      return NextResponse.json(
        { success: false, error: 'Email, type, date, time, and location required' },
        { status: 400 }
      );
    }

    const trainingId = `training-${Date.now()}`;
    const now = new Date().toISOString();

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('trainings')
      .doc(trainingId)
      .set({
        id: trainingId,
        type,
        date,
        time,
        location,
        availablePlayerIds: availablePlayerIds || [],
        notes: notes || undefined,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      training: {
        id: trainingId,
        type,
        date,
        time,
        location,
        availablePlayerIds: availablePlayerIds || [],
        notes,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Create training error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create training' },
      { status: 500 }
    );
  }
}
