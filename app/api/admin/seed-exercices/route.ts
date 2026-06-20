import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CATALOGUE_EXERCICES } from '@/lib/exercices/catalogue';

/** Seed le catalogue d'exercices dans Firestore. Admin uniquement. */
export async function POST(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'DB non configurée' }, { status: 503 });
  }

  try {
    const batch = adminDb.batch();
    const now = new Date().toISOString();

    for (const exercice of CATALOGUE_EXERCICES) {
      const ref = adminDb.collection('exercices').doc(exercice.id);
      batch.set(ref, { ...exercice, createdAt: exercice.createdAt ?? now }, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${CATALOGUE_EXERCICES.length} exercices importés dans Firestore`,
      ids: CATALOGUE_EXERCICES.map((e) => e.id),
    });
  } catch (error) {
    console.error('Seed exercices:', error);
    return NextResponse.json({ success: false, error: 'Erreur seed' }, { status: 500 });
  }
}

/** Retourne le nombre d'exercices en base. */
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: false, total: 0 });
  }

  try {
    const snap = await adminDb.collection('exercices').count().get();
    return NextResponse.json({ success: true, total: snap.data().count, inCatalogue: CATALOGUE_EXERCICES.length });
  } catch (error) {
    console.error('Seed exercices count:', error);
    return NextResponse.json({ success: false, error: 'Erreur' }, { status: 500 });
  }
}
