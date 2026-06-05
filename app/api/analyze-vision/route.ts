import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildVisionPromptWithExamples, VisionCorrectionExample } from '@/services/prompts';
import { validateOrigin, sanitizeErrorForClient, apiError, apiSuccess } from '@/lib/security';
import { getRateLimitKey, checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { adminDb } from '@/lib/firebase-admin';
import { getLimit } from '@/lib/plans';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface VisionAnalysisResponse {
  formation: string;
  composition: Array<{
    poste: string;
    nom: string;
  }>;
  consignes: string[];
  observations: string;
  detectedPlayers: string[];
}

export async function POST(request: NextRequest) {
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

    const contentType = request.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      return apiError('Invalid content type. Expected application/json', 400);
    }

    const { imageBase64, email } = await request.json();

    if (!imageBase64) {
      return apiError('No image provided', 400);
    }

    // Check usage limit if email provided (Firebase optional for testing)
    try {
      if (email && adminDb) {
        const userDoc = await adminDb.collection('users_access').doc(email.toLowerCase()).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const plan = userData?.plan || 'trial';
          const usage = userData?.usage || {};

          // Check video analysis limit (vision counts as video analysis)
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
    if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
      return apiError('Invalid base64 format', 400);
    }

    // Check image size (base64 size limits)
    if (imageBase64.length > MAX_IMAGE_SIZE) {
      return apiError(
        `Image too large (${(imageBase64.length / 1024 / 1024).toFixed(1)}MB). Max: ${(MAX_IMAGE_SIZE / 1024 / 1024).toFixed(1)}MB`,
        413
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Fetch recent user corrections and build a self-improving prompt
    let recentExamples: VisionCorrectionExample[] = [];
    try {
      if (adminDb) {
        const feedbackSnap = await adminDb
          .collection('vision_feedback')
          .orderBy('timestamp', 'desc')
          .limit(5)
          .get();
        recentExamples = feedbackSnap.docs
          .map((doc): VisionCorrectionExample | null => {
            const d = doc.data() as Record<string, unknown>;
            if (d.originalResult && d.correctedResult) {
              return {
                originalResult: d.originalResult as VisionCorrectionExample['originalResult'],
                correctedResult: d.correctedResult as VisionCorrectionExample['correctedResult'],
              };
            }
            return null;
          })
          .filter((ex): ex is VisionCorrectionExample => ex !== null);
      }
    } catch {
      // Firebase unavailable — proceed with base prompt
    }

    const dynamicPrompt = buildVisionPromptWithExamples(recentExamples);

    // Create message with image data
    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: dynamicPrompt,
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.response.text();

    // Parse JSON response
    let analysisResult: VisionAnalysisResponse;

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

      // Return default response if parsing fails
      analysisResult = {
        formation: '4-4-2',
        composition: [
          { poste: 'GK', nom: 'Inconnu' },
          { poste: 'LB', nom: 'Inconnu' },
          { poste: 'CB', nom: 'Inconnu' },
          { poste: 'CB', nom: 'Inconnu' },
          { poste: 'RB', nom: 'Inconnu' },
          { poste: 'LM', nom: 'Inconnu' },
          { poste: 'CM', nom: 'Inconnu' },
          { poste: 'CM', nom: 'Inconnu' },
          { poste: 'RM', nom: 'Inconnu' },
          { poste: 'ST', nom: 'Inconnu' },
          { poste: 'ST', nom: 'Inconnu' },
        ],
        consignes: [
          'Analyse de tableau - résultat par défaut',
          'Veuillez vérifier la qualité de l\'image fournie',
        ],
        observations: 'L\'image n\'a pas pu être analysée correctement. Assurez-vous que c\'est une photo claire d\'un tableau tactique.',
        detectedPlayers: [],
      };
    }

    // Validate response structure
    if (!analysisResult.formation || !Array.isArray(analysisResult.composition) || !Array.isArray(analysisResult.consignes)) {
      throw new Error('Invalid analysis result structure');
    }

    // Extract detected players from composition (exclude "Inconnu")
    const detectedPlayers = analysisResult.composition
      .map(player => player.nom)
      .filter(nom => nom && nom !== 'Inconnu');

    const finalResponse = {
      ...analysisResult,
      detectedPlayers,
    };

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

    return apiSuccess(finalResponse);
  } catch (error) {
    console.error('Vision analysis error:', error);
    return apiError('Erreur lors de l\'analyse de l\'image', 500);
  }
}
