import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Seance } from '@/lib/seance/schema';

export interface SessionRecord {
  id: string;
  theme: string;
  categorie: string;
  effectif: number;
  duree: number;
  charge: string;
  ecole?: string;
  source?: string;
  date: string;
  titre?: string;
  content?: Seance;
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email requis' }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ success: true, sessions: [] });
  }

  try {
    const snap = await adminDb
      .collection('seances')
      .doc(email.toLowerCase())
      .collection('historique')
      .orderBy('date', 'desc')
      .limit(100)
      .get();

    const sessions: Omit<SessionRecord, 'content'>[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        theme: d.theme,
        categorie: d.categorie,
        effectif: d.effectif,
        duree: d.duree,
        charge: d.charge,
        ecole: d.ecole,
        source: d.source,
        date: d.date,
        titre: d.titre,
      };
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Historique GET:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      session: SessionRecord;
    };

    const email = body.email?.toLowerCase();
    if (!email || !body.session) {
      return NextResponse.json({ success: false, error: 'Email et session requis' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: true, id: body.session.id });
    }

    const record = {
      ...body.session,
      savedAt: new Date().toISOString(),
    };

    await adminDb
      .collection('seances')
      .doc(email)
      .collection('historique')
      .doc(body.session.id)
      .set(record);

    return NextResponse.json({ success: true, id: body.session.id });
  } catch (error) {
    console.error('Historique POST:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
