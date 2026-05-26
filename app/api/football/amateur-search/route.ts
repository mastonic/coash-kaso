import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const LEAGUE_NAMES: Record<string, string> = {
  national2: 'National 2',
  regional:  'Régional 1',
  regional2: 'Régional 2',
  regional3: 'Régional 3',
  district1: 'District 1',
  district2: 'District 2',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'district1';
  const city = (searchParams.get('city') || '').trim();

  if (!city) {
    return NextResponse.json({ success: false, error: 'Ville requise' }, { status: 400 });
  }

  const leagueName = LEAGUE_NAMES[league] ?? league;

  // gemini-2.0-flash supporte googleSearch (web grounding)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });

  const prompt = `Recherche sur internet le classement actuel du championnat de football ${leagueName} près de ${city} en France (saison 2024-2025).

Retourne UNIQUEMENT un tableau JSON, sans texte avant ni après :
[
  {"rank":1,"name":"FC Exemple","played":12,"won":9,"drawn":2,"lost":1,"goalsFor":28,"goalsAgainst":10,"points":29},
  {"rank":2,"name":"AS Autre Club","played":12,"won":8,"drawn":1,"lost":3,"goalsFor":22,"goalsAgainst":14,"points":25}
]

- Inclure toutes les équipes du classement trouvé
- Si aucun classement n'est trouvé, retourne : []`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extraire le JSON du texte retourné
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: `Aucun classement trouvé pour ${leagueName} près de ${city}. Essayez avec le nom du département ou de la région.`,
      }, { status: 404 });
    }

    let teams: unknown[];
    try {
      teams = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ success: false, error: 'Format de réponse inattendu' }, { status: 500 });
    }

    if (!Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Aucune équipe trouvée pour ${leagueName} près de ${city}.`,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { teams, count: teams.length, league, city, leagueName },
    });
  } catch (error) {
    console.error('Gemini search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur Gemini',
    }, { status: 500 });
  }
}
