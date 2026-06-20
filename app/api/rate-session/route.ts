import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      email?: string;
      rating?: number;
      feedback?: string;
      wasExecuted?: boolean;
    };

    const { sessionId, email, rating, feedback, wasExecuted } = body;

    if (!sessionId || !email || typeof rating !== 'number') {
      return NextResponse.json(
        { success: false, error: 'sessionId, email et rating sont requis' },
        { status: 400 }
      );
    }

    const clampedRating = Math.min(5, Math.max(1, Math.round(rating)));

    if (!adminDb) {
      return NextResponse.json({ success: true });
    }

    const ratingData = {
      coach_rating: clampedRating,
      coach_feedback: feedback ?? null,
      was_executed: wasExecuted ?? null,
      rated_at: new Date().toISOString(),
    };

    // Persist to seances/{email}/historique/{sessionId}
    await adminDb
      .collection('seances')
      .doc(email.toLowerCase())
      .collection('historique')
      .doc(sessionId)
      .set(ratingData, { merge: true });

    // Also persist to flat /sessions/{sessionId} if it exists (anti-repetition system)
    try {
      const flatRef = adminDb.collection('sessions').doc(sessionId);
      const flatSnap = await flatRef.get();
      if (flatSnap.exists) {
        await flatRef.set(ratingData, { merge: true });
      }
    } catch {
      // /sessions may not exist — not critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('rate-session POST:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
