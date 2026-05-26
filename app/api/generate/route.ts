import { NextRequest, NextResponse } from 'next/server';
import { generateSession } from '@/lib/gemini';
import { validateOrigin, apiError, apiSuccess } from '@/lib/security';
import { getRateLimitKey, checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

const VALID_THEMES = ['Possession', 'Pressing', 'Transitions', 'Centre', 'Ailes', 'Controle', 'Vitesse', 'Phases', '1v1'];
const VALID_LOADS = ['Recovery', 'Moderate', 'High'];
const VALID_SCHOOLS = ['Française', 'Espagnole', 'Allemande', 'Hollandaise', 'Brésilienne', 'Argentine', 'Italienne'];

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

    const { theme, load, school, playerCount } = await req.json();

    // Validate required fields
    if (!theme || !load || !school || !playerCount) {
      return apiError('Missing required fields: theme, load, school, playerCount', 400);
    }

    // Validate theme
    if (!VALID_THEMES.includes(theme)) {
      return apiError(`Invalid theme. Allowed: ${VALID_THEMES.join(', ')}`, 400);
    }

    // Validate load
    if (!VALID_LOADS.includes(load)) {
      return apiError(`Invalid load. Allowed: ${VALID_LOADS.join(', ')}`, 400);
    }

    // Validate school
    if (!VALID_SCHOOLS.includes(school)) {
      return apiError(`Invalid school. Allowed: ${VALID_SCHOOLS.join(', ')}`, 400);
    }

    // Validate playerCount
    const playerCountNum = parseInt(playerCount);
    if (isNaN(playerCountNum) || playerCountNum < 6 || playerCountNum > 25) {
      return apiError('Invalid player count. Must be between 6 and 25', 400);
    }

    const session = await generateSession(theme, load, school, playerCountNum);
    return apiSuccess(session);
  } catch (error) {
    console.error('API error:', error);
    return apiError('Failed to generate session', 500);
  }
}
