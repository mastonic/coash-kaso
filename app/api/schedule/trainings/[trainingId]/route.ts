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
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    const { trainingId } = await params;
    const { email, ...updateData } = await request.json();

    if (!email || !trainingId) {
      return NextResponse.json(
        { success: false, error: 'Email and trainingId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    const trainingRef = firestore
      .collection('teams')
      .doc(email)
      .collection('trainings')
      .doc(trainingId);

    await trainingRef.update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    const doc = await trainingRef.get();

    return NextResponse.json({
      success: true,
      training: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Update training error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update training' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ trainingId: string }> }
) {
  try {
    const { trainingId } = await params;
    const { email } = await request.json();

    if (!email || !trainingId) {
      return NextResponse.json(
        { success: false, error: 'Email and trainingId required' },
        { status: 400 }
      );
    }

    const firestore = getDB();
    await firestore
      .collection('teams')
      .doc(email)
      .collection('trainings')
      .doc(trainingId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Training deleted',
    });
  } catch (error) {
    console.error('Delete training error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete training' },
      { status: 500 }
    );
  }
}
