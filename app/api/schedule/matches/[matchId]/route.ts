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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const { email, ...updateData } = await request.json();

    if (!email || !matchId) {
      return NextResponse.json(
        { success: false, error: 'Email and matchId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const matchRef = firestore
      .collection('teams')
      .doc(email)
      .collection('matches')
      .doc(matchId);

    await matchRef.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const doc = await matchRef.get();

    return NextResponse.json({
      success: true,
      match: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update match' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    const { email } = await request.json();

    if (!email || !matchId) {
      return NextResponse.json(
        { success: false, error: 'Email and matchId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('matches')
      .doc(matchId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Match deleted',
    });
  } catch (error) {
    console.error('Delete match error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete match' },
      { status: 500 }
    );
  }
}
