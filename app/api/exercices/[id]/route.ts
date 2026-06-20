import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'DB non configurée' }, { status: 503 });
  }

  try {
    const doc = await adminDb.collection('exercices').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Exercice non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, exercice: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Exercice GET[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
