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
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { email, photoUrl, photoStoragePath, ...updateData } = await request.json();

    if (!email || !playerId) {
      return NextResponse.json(
        { success: false, error: 'Email and playerId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const playerRef = firestore
      .collection('teams')
      .doc(email)
      .collection('players')
      .doc(playerId);

    await playerRef.update({
      ...updateData,
      ...(photoUrl && { photoUrl }),
      ...(photoStoragePath && { photoStoragePath }),
      updatedAt: new Date().toISOString(),
    });

    const doc = await playerRef.get();

    return NextResponse.json({
      success: true,
      player: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Update player error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;
    const { email } = await request.json();

    if (!email || !playerId) {
      return NextResponse.json(
        { success: false, error: 'Email and playerId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('players')
      .doc(playerId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Player deleted',
    });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete player' },
      { status: 500 }
    );
  }
}
