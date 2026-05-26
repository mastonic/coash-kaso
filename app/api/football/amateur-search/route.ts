import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const LEAGUE_NAMES: Record<string, string> = {
  national2: 'National 2',
  regional:  'Régional 1 (DH)',
  regional2: 'Régional 2',
  regional3: 'Régional 3',
  district1: 'District 1',
  district2: 'District 2',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get('league') || 'district1';
  const region = (searchParams.get('region') || '').trim();

  if (!region) {
    return NextResponse.json({ success: false, error: 'Région ou département requis' }, { status: 400 });
  }

  const leagueName = LEAGUE_NAMES[league] ?? league;

  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ googleSearchRetrieval: {} }],
  });

  const prompt = `Cherche le classement actuel du championnat ${leagueName} de football amateur en ${region}, France (saison en cours).
Retourne UNIQUEMENT un tableau JSON valide avec TOUTES les équipes du classement.
Format STRICT — rien avant ni après le JSON :
[
  {"rank":1,"name":"FC Exemple","played":12,"won":9,"drawn":2,"lost":1,"goalsFor":28,"goalsAgainst":10,"points":29},
  {"rank":2,"name":"AS Autre Club","played":12,"won":8,"drawn":1,"lost":3,"goalsFor":22,"goalsAgainst":14,"points":25}
]
Si aucun classement trouvé, retourne exactement : []`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        error: `Classement introuvable pour ${leagueName} en ${region}. Essayez un nom de région plus précis (ex: "Gironde", "Île-de-France", "Nord-Pas-de-Calais").`,
      }, { status: 404 });
    }

    let teams: unknown[];
    try {
      teams = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ success: false, error: 'Résultat Gemini non parsable' }, { status: 500 });
    }

    if (!Array.isArray(teams) || teams.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Aucune équipe trouvée pour ${leagueName} en ${region}.`,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { teams, count: teams.length, league, region, leagueName },
    });
  } catch (error) {
    console.error('Gemini search error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur Gemini',
    }, { status: 500 });
  }
}
