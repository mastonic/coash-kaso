import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AUDIO_TACTIC_PROMPT } from '@/services/prompts';
import { validateOrigin, checkRequestSize, sanitizeErrorForClient, apiError, apiSuccess } from '@/lib/security';
import { getRateLimitKey, checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp3', 'audio/aac', 'audio/ogg', 'audio/wav'];

interface AnalysisResponse {
  recommendations: Array<{
    issue: string;
    recommendation: string;
    type: 'défensif' | 'transition' | 'pressing' | 'possession' | 'technique';
    duration: number;
  }>;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] POST /api/analyze-audio - Request started`);

  try {
    // Check rate limit
    const rateLimitKey = getRateLimitKey(request);
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
    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
      return apiError(originCheck.error || 'Unauthorized origin', 403);
    }

    // Check request size
    const contentLength = request.headers.get('content-length');
    const sizeCheck = checkRequestSize(contentLength, MAX_AUDIO_SIZE);
    if (!sizeCheck.valid) {
      return apiError(sizeCheck.error || 'Request too large', 413);
    }

    const contentType = request.headers.get('content-type');

    // Parse multipart form data
    if (!contentType?.includes('multipart/form-data')) {
      return apiError('Invalid content type. Expected multipart/form-data', 400);
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return apiError('No audio file provided', 400);
    }

    // Validate audio MIME type
    const mimeType = audioFile.type || 'audio/webm';
    if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return apiError(
        `Invalid audio format. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
        400
      );
    }

    // Convert Blob to Base64
    const buffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(buffer).toString('base64');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create message with audio data
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: AUDIO_TACTIC_PROMPT,
            },
            {
              inlineData: {
                mimeType: mimeType as 'audio/webm' | 'audio/mp3' | 'audio/aac' | 'audio/ogg',
                data: base64Audio,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();

    // Parse JSON response
    let analysisResult: AnalysisResponse;

    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', responseText);

      // Return default recommendations if parsing fails
      analysisResult = {
        recommendations: [
          {
            issue: 'Analyse audio indisponible',
            recommendation: 'Travaillez la possession avec circulation de ballon',
            type: 'possession',
            duration: 20,
          },
          {
            issue: 'Recommandation par défaut',
            recommendation: 'Exercice de transition rapide',
            type: 'transition',
            duration: 18,
          },
        ],
      };
    }

    // Validate and sanitize response
    if (!analysisResult.recommendations || !Array.isArray(analysisResult.recommendations)) {
      throw new Error('Invalid recommendations structure');
    }

    // Ensure we have valid recommendations
    const validRecommendations = analysisResult.recommendations
      .filter(rec => rec.issue && rec.recommendation && rec.type && rec.duration)
      .slice(0, 3); // Max 3 recommendations

    if (validRecommendations.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [
            {
              issue: 'Audio analysé mais résultats insuffisants',
              recommendation: 'Entraînement de possession avec focus compacité',
              type: 'possession',
              duration: 20,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] POST /api/analyze-audio - Success (${duration}ms, ${validRecommendations.length} recommendations)`);

    return apiSuccess({
      recommendations: validRecommendations,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${timestamp}] POST /api/analyze-audio - Error (${duration}ms):`, error);

    return apiError('Erreur lors de l\'analyse de l\'audio', 500);
  }
}
