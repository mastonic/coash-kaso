import { NextRequest, NextResponse } from 'next/server';
import { analyzeVideo } from '@/lib/gemini';
import { validateOrigin, apiError, apiSuccess } from '@/lib/security';
import { getRateLimitKey, checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const rateLimitKey = getRateLimitKey(req);
    const rateLimitResult = checkRateLimit(rateLimitKey);

    if (!rateLimitResult.allowed) {
      const response = apiError('Too many requests. Please try again later.', 429);
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Validate origin
    const originCheck = validateOrigin(req);
    if (!originCheck.valid) {
      return apiError(originCheck.error || 'Unauthorized origin', 403);
    }

    const { videoBase64, email } = await req.json();

    if (!videoBase64) {
      return apiError('Missing video data', 400);
    }

    // Check usage limit if email provided (Firebase optional for testing)
    try {
      if (email && adminDb) {
        const userDoc = await adminDb.collection('users_access').doc(email.toLowerCase()).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const plan = userData?.plan || 'trial';
          const usage = userData?.usage || {};

          // Check video analysis limit
          const videoLimit = getLimit(plan, 'videoAnalyses');
          if (videoLimit !== -1 && usage.videoAnalysesUsed >= videoLimit) {
            return apiError('Video analysis limit reached for this month', 403);
          }
        }
      }
    } catch (firebaseError) {
      // Skip Firebase checks during testing - continue with analysis
      console.warn('Firebase usage check skipped (testing mode):', firebaseError);
    }

    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(videoBase64)) {
      return apiError('Invalid base64 format', 400);
    }

    // Check video size
    if (videoBase64.length > MAX_VIDEO_SIZE) {
      return apiError(
        `Video too large (${(videoBase64.length / 1024 / 1024).toFixed(1)}MB). Max: ${(MAX_VIDEO_SIZE / 1024 / 1024).toFixed(1)}MB`,
        413
      );
    }

    const analysis = await analyzeVideo(videoBase64);

    // Increment video analysis counter if email provided (optional for testing)
    try {
      if (email && adminDb) {
        const userRef = adminDb.collection('users_access').doc(email.toLowerCase());
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const usage = userDoc.data()?.usage || {};
          await userRef.update({
            'usage.videoAnalysesUsed': (usage.videoAnalysesUsed || 0) + 1,
          });
        }
      }
    } catch (firebaseError) {
      // Skip Firebase update during testing
      console.warn('Firebase usage update skipped (testing mode):', firebaseError);
    }

    return apiSuccess(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return apiError('Failed to analyze video', 500);
  }
}
