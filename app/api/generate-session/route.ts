import { generateSession as genSession } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const { theme, load, school, playerCount, email } = await request.json();

    if (!theme || !load || !school || !playerCount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check usage limit if email provided
    if (email && adminDb) {
      const userDoc = await adminDb.collection('users_access').doc(email.toLowerCase()).get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        const plan = userData?.plan || 'trial';
        const usage = userData?.usage || {};

        // Check monthly session limit
        const sessionLimit = getLimit(plan, 'sessionsPerMonth');
        if (sessionLimit !== -1 && usage.sessionsGeneratedThisMonth >= sessionLimit) {
          return NextResponse.json(
            { success: false, error: 'Session generation limit reached for this month' },
            { status: 403 }
          );
        }
      }
    }

    // Add timeout of 120 seconds (Vercel max is 300s)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Generation timeout - API took too long')), 120000)
    );

    const sessionPromise = genSession(theme, load, school, playerCount);
    const sessionData = await Promise.race([sessionPromise, timeoutPromise]);

    // Increment session counter if email provided
    if (email && adminDb) {
      const userRef = adminDb.collection('users_access').doc(email.toLowerCase());
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const usage = userDoc.data()?.usage || {};
        await userRef.update({
          'usage.sessionsGeneratedThisMonth': (usage.sessionsGeneratedThisMonth || 0) + 1,
        });
      }
    }

    return NextResponse.json({ success: true, data: sessionData });
  } catch (error) {
    console.error('Session generation error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: message.includes('timeout') ? 'La génération a pris trop de temps. Essayez à nouveau.' : undefined
      },
      { status: 500 }
    );
  }
}
