import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body as { imageBase64: string; mimeType: string };

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'Image requise' }, { status: 400 });
    }

    const prompt = `Tu es un assistant football. Analyse cette image et extrait le tableau de classement.
Retourne UNIQUEMENT ce JSON valide, sans texte avant ni après :
[
  {"rank": 1, "name": "Nom Équipe FC", "played": 10, "won": 7, "drawn": 2, "lost": 1, "goalsFor": 22, "goalsAgainst": 10, "points": 23},
  {"rank": 2, "name": "Autre Club", "played": 10, "won": 6, "drawn": 2, "lost": 2, "goalsFor": 18, "goalsAgainst": 12, "points": 20}
]
Règles :
- Si une colonne stat est absente, mets 0
- N'invente rien : extrait uniquement ce qui est visible
- Si aucun tableau de classement n'est visible, retourne exactement : []`;

    const result = await model.generateContent([
      { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
      prompt,
    ]);

    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

    let teams: unknown[];
    try {
      teams = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Aucun tableau de classement détecté dans cette image' },
        { status: 422 }
      );
    }

    if (!Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun tableau de classement détecté dans cette image' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: { teams, count: teams.length } });
  } catch (error) {
    console.error('Amateur scan error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
