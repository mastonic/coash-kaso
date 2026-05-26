import { GoogleGenerativeAI } from '@google/generative-ai';
import { FOOTBALL_EXPERT_SYSTEM, VIDEO_ANALYSIS_PROMPT } from './prompts';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}

const client = new GoogleGenerativeAI(apiKey);

export interface SessionRequest {
  theme: string;
  load: 'recovery' | 'moderate' | 'high';
  school: string;
  playerCount: number;
  dayOffset?: number;
}

export async function generateSession(req: SessionRequest) {
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  const userPrompt = `Génère une séance d'entraînement complète avec les paramètres suivants:
- Thème principal: ${req.theme}
- Charge du jour: ${req.load}
- École de jeu: ${req.school}
- Effectif disponible: ${req.playerCount} joueurs
- Durée totale: 90 minutes
- Format: 3 jeux (20min chacun) + 3 exercices (15min chacun) + 3 situations (20min chacun)

Adapte strictement à ces paramètres. Chaque bloc doit respecter l'école de jeu et l'intensité.`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      systemInstruction: FOOTBALL_EXPERT_SYSTEM,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw new Error('Session generation failed');
  }
}

export async function analyzeVideo(videoBase64: string) {
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'video/mp4',
                data: videoBase64,
              },
            },
            { text: 'Analyse cette vidéo et réponds en JSON structuré.' },
          ],
        },
      ],
      systemInstruction: VIDEO_ANALYSIS_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Video analysis error:', error);
    throw new Error('Video analysis failed');
  }
}
