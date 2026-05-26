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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const doc = await firestore
      .collection('teams')
      .doc(email)
      .collection('attendance')
      .doc(date)
      .get();

    const attendance = doc.exists
      ? doc.data()
      : {
          date,
          presentPlayerIds: [],
          updatedAt: new Date().toISOString(),
        };

    return NextResponse.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, playerId, date } = await request.json();
    const attendanceDate = date || new Date().toISOString().split('T')[0];

    if (!email || !playerId) {
      return NextResponse.json(
        { success: false, error: 'Email and playerId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const attendanceRef = firestore
      .collection('teams')
      .doc(email)
      .collection('attendance')
      .doc(attendanceDate);

    // Use arrayUnion to add playerId if not already present
    await attendanceRef.set(
      {
        date: attendanceDate,
        presentPlayerIds: firestore.FieldValue.arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const updatedDoc = await attendanceRef.get();

    return NextResponse.json({
      success: true,
      attendance: updatedDoc.data(),
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}
