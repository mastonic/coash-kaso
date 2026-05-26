import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface SessionData {
  games: Array<{
    title: string;
    objective: string;
    content: string;
    illustration: string;
    setup: string;
    duration: number;
  }>;
  exercises: Array<{
    title: string;
    objective: string;
    content: string;
    illustration: string;
    technique: string;
    duration: number;
  }>;
  situations: Array<{
    title: string;
    objective: string;
    content: string;
    illustration: string;
    fieldSetup: string;
    duration: number;
  }>;
}

export async function generateSession(
  theme: string,
  load: string,
  school: string,
  playerCount: number
): Promise<SessionData> {
  const diagramExample = `{"players":[{"x":50,"y":15,"number":1,"team":"défense"},{"x":25,"y":40,"number":2,"team":"défense"},{"x":75,"y":40,"number":3,"team":"attaque"},{"x":50,"y":65,"number":4,"team":"attaque"}],"movements":[{"from":{"x":50,"y":15},"to":{"x":25,"y":40},"style":"passe"},{"from":{"x":25,"y":40},"to":{"x":50,"y":65},"style":"déplacement"}]}`;

  const prompt = `Expert en coaching football ${school}. Génère une séance d'entraînement.

${theme} - Charge: ${load} - ${playerCount} joueurs

IMPORTANT: Le champ "illustration" doit être un JSON STRINGIFIÉ (pas d'ASCII) représentant le schéma tactique avec des joueurs positionnés sur le terrain (coordonnées x/y en pourcentage 0-100).
Format illustration: ${diagramExample}

Règles du schéma:
- x=0 gauche, x=100 droite, y=0 haut, y=100 bas
- team: "attaque" (vert) ou "défense" (rouge)
- movements optionnels: style "passe", "dribble" ou "déplacement"
- Adapte les positions à l'exercice (${playerCount} joueurs max, positionne-les logiquement)

Retour JSON VALIDE UNIQUEMENT (pas de texte):
{
  "games": [
    {"title": string, "objective": string, "content": string, "illustration": string (JSON stringifié du schéma), "setup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "setup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "setup": string, "duration": number}
  ],
  "exercises": [
    {"title": string, "objective": string, "content": string, "illustration": string (JSON stringifié du schéma), "technique": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "technique": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "technique": string, "duration": number}
  ],
  "situations": [
    {"title": string, "objective": string, "content": string, "illustration": string (JSON stringifié du schéma), "fieldSetup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "fieldSetup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": string, "fieldSetup": string, "duration": number}
  ]
}
- Adaptation ${playerCount} joueurs
- Intensité ${load}
- RETOUR UNIQUEMENT JSON, PAS D'AUTRE TEXTE`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini response:', text.substring(0, 200));

    // Extract JSON from markdown code blocks
    let jsonStr = text.trim();

    // Remove markdown code block markers
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    console.log('Parsed JSON start:', jsonStr.substring(0, 100));
    const parsed = JSON.parse(jsonStr) as SessionData;
    console.log('Successfully parsed session with', parsed.games.length, 'games,', parsed.exercises.length, 'exercises,', parsed.situations.length, 'situations');
    return parsed;
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw error;
  }
}

export async function analyzeVideo(fileBase64: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendations: Array<{ theme: string; suggestion: string }>;
}> {
  const prompt = `You are a professional football tactical analyst.
Analyze this training/match video and return ONLY this JSON structure:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "recommendations": [
    {"theme": "possession", "suggestion": "work on..."},
    {"theme": "pressing", "suggestion": "improve..."},
    {"theme": "transitions", "suggestion": "focus on..."}
  ]
}`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'video/mp4',
          data: fileBase64,
        },
      },
      prompt,
    ]);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Video analysis error:', error);
    throw error;
  }
}
