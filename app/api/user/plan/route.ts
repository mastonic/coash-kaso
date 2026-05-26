import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PLANS, PlanType } from '@/lib/plans';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const userDoc = await adminDb.collection('users_access').doc(email).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let userData = userDoc.data()!;
    const now = new Date();

    // Check and expire trial if needed
    if (userData.plan === 'trial' && userData.trialEndsAt) {
      const trialEndsAt = new Date(userData.trialEndsAt);
      if (now > trialEndsAt) {
        userData.status = 'expired';
      }
    }

    // Auto-reset monthly usage counters
    if (userData.usage) {
      const lastReset = new Date(userData.usage.videoAnalysesResetAt);
      if (isNewMonth(lastReset, now)) {
        userData.usage.videoAnalysesUsed = 0;
        userData.usage.videoAnalysesResetAt = now.toISOString();
      }

      const lastSessionReset = new Date(userData.usage.sessionsResetAt);
      if (isNewMonth(lastSessionReset, now)) {
        userData.usage.sessionsGeneratedThisMonth = 0;
        userData.usage.sessionsResetAt = now.toISOString();
      }

      // Persist reset if needed
      if (
        isNewMonth(lastReset, now) ||
        isNewMonth(lastSessionReset, now)
      ) {
        await userDoc.ref.update({
          usage: userData.usage,
        });
      }
    }

    // Persist status change if needed
    if (userData.status === 'expired' && userDoc.data()?.status !== 'expired') {
      await userDoc.ref.update({ status: 'expired' });
    }

    const plan = userData.plan as PlanType;
    const planConfig = PLANS[plan] || PLANS.trial;
    const limits = planConfig.limits;

    const usage = userData.usage || {
      videoAnalysesUsed: 0,
      videoAnalysesResetAt: now.toISOString(),
      sessionsGeneratedThisMonth: 0,
      sessionsResetAt: now.toISOString(),
    };

    return NextResponse.json(
      {
        plan,
        status: userData.status || 'pending',
        usage,
        limits,
        trialEndsAt: userData.trialEndsAt || null,
        planActivatedAt: userData.planActivatedAt || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Plan fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

// Helper to check if we've entered a new month
function isNewMonth(lastDate: Date, currentDate: Date): boolean {
  return (
    lastDate.getMonth() !== currentDate.getMonth() ||
    lastDate.getFullYear() !== currentDate.getFullYear()
  );
}
