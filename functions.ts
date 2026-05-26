import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateSession = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { theme, load, school, playerCount } = req.body;
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert football coach specialized in the ${school} school of play.
Context: Theme=${theme}, Load=${load}, ${playerCount} players available.
Generate a training session with exactly this JSON structure (no markdown, pure JSON only):
{
  "games": [
    {"title": "Game 1", "objective": "...", "content": "...", "duration": 20},
    {"title": "Game 2", "objective": "...", "content": "...", "duration": 20},
    {"title": "Game 3", "objective": "...", "content": "...", "duration": 20}
  ],
  "exercises": [
    {"title": "Exercise 1", "objective": "...", "content": "...", "duration": 20},
    {"title": "Exercise 2", "objective": "...", "content": "...", "duration": 20},
    {"title": "Exercise 3", "objective": "...", "content": "...", "duration": 20}
  ],
  "situations": [
    {"title": "Situation 1", "objective": "...", "content": "...", "duration": 20},
    {"title": "Situation 2", "objective": "...", "content": "...", "duration": 20},
    {"title": "Situation 3", "objective": "...", "content": "...", "duration": 20}
  ]
}
Adapt intensity and player organization to ${playerCount} players and ${load} load. Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const sessionData = JSON.parse(jsonStr);

    res.json(sessionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate session' });
  }
});

export const analyzeVideo = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const { videoBase64 } = req.body;
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'video/mp4',
          data: videoBase64,
        },
      },
      'You are a professional football tactical analyst. Analyze this video and return ONLY JSON: {"strengths": ["..."], "weaknesses": ["..."], "recommendations": [{"theme": "...", "suggestion": "..."}]}',
    ]);

    const text = result.response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    const analysisData = JSON.parse(jsonStr);

    res.json(analysisData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});
