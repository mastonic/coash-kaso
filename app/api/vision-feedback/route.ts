import { NextRequest } from 'next/server';
import { validateOrigin, apiError, apiSuccess } from '@/lib/security';
import { getRateLimitKey, checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);
    const rateLimitResult = checkRateLimit(rateLimitKey);
    if (!rateLimitResult.allowed) {
      const response = apiError('Too many requests. Please try again later.', 429);
      const headers = createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const originCheck = validateOrigin(request);
    if (!originCheck.valid) return apiError(originCheck.error || 'Unauthorized origin', 403);

    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) return apiError('Invalid content type', 400);

    const { imageHash, originalResult, correctedResult, email } = await request.json();

    if (
      !imageHash ||
      typeof imageHash !== 'string' ||
      !correctedResult?.formation ||
      !Array.isArray(correctedResult?.composition)
    ) {
      return apiError('Données de correction incomplètes', 400);
    }

    if (!adminDb) return apiError('Base de données indisponible', 503);

    await adminDb.collection('vision_feedback').add({
      imageHash,
      originalResult: originalResult ?? null,
      correctedResult: {
        formation: correctedResult.formation,
        composition: correctedResult.composition,
        consignes: Array.isArray(correctedResult.consignes) ? correctedResult.consignes : [],
      },
      email: typeof email === 'string' ? email.toLowerCase() : null,
      timestamp: new Date(),
      verified: false,
    });

    return apiSuccess({ message: 'Correction enregistrée. Merci !' });
  } catch (error) {
    console.error('Vision feedback error:', error);
    return apiError("Erreur lors de l'enregistrement", 500);
  }
}
