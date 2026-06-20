import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'DB non configurée' }, { status: 503 });
  }

  try {
    const doc = await adminDb
      .collection('seances')
      .doc(email.toLowerCase())
      .collection('historique')
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ success: false, error: 'Séance non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Historique GET[id]:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = request.nextUrl.searchParams.get('email');

  if (!email || !adminDb) {
    return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });
  }

  try {
    await adminDb
      .collection('seances')
      .doc(email.toLowerCase())
      .collection('historique')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Historique DELETE:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
