import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { email, targetImageBase64, players } = await request.json();

    if (!email || !targetImageBase64 || !players || players.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email, targetImageBase64, and players required' },
        { status: 400 }
      );
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const playersWithPhotos = players.filter((p: any) => p.photoUrl);
    if (playersWithPhotos.length === 0) {
      return NextResponse.json(
        {
          success: true,
          matchedPlayerId: null,
          matchedPlayerName: 'Aucun joueur avec photo',
          confidence: 'low',
          reason: 'Aucun joueur na de photo pour la comparaison',
        }
      );
    }

    // Make parallel comparisons: 1:1 each player
    const comparisons = await Promise.all(
      playersWithPhotos.map(async (player: any) => {
        try {
          const response = await fetch(player.photoUrl);
          if (!response.ok) return null;

          const buffer = await response.arrayBuffer();
          const base64Photo = Buffer.from(buffer).toString('base64');

          const content = [
            {
              type: 'text' as const,
              text: `Je dois comparer deux photos de visages. La première est une photo de référence d'un joueur, la deuxième est une photo cible que je dois identifier.

Photo de référence: Joueur ID ${player.id}, Nom: ${player.name}
Photo cible: Visage à identifier

Réponds UNIQUEMENT avec un JSON valide (pas de texte avant ou après):
{
  "matchedPlayerId": "${player.id}",
  "matchedPlayerName": "${player.name}",
  "confidence": "high" ou "medium" ou "low",
  "reason": "Pourquoi ce joueur correspond ou non"
}

- confidence "high": correspondance très certaine (> 80%)
- confidence "medium": correspondance probable (50-80%)
- confidence "low": correspondance incertaine (< 50%)

Si le visage ne correspond pas, retourne quand même le JSON mais avec confidence "low".

Compare attentivement les traits du visage, la forme du visage, les yeux, le nez, les cheveux, etc.`,
            },
            {
              type: 'image' as const,
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Photo,
              },
            },
            {
              type: 'image' as const,
              inlineData: {
                mimeType: 'image/jpeg',
                data: targetImageBase64,
              },
            },
          ];

          const result = await model.generateContent(content as any);
          const text = result.response.text();

          // Extract JSON from response
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) return null;

          return JSON.parse(jsonMatch[0]);
        } catch (error) {
          console.error(`Error comparing with player ${player.id}:`, error);
          return null;
        }
      })
    );

    // Find the best match
    const validComparisons = comparisons.filter((c): c is any => c !== null);
    if (validComparisons.length === 0) {
      return NextResponse.json({
        success: true,
        matchedPlayerId: null,
        matchedPlayerName: 'Aucun match',
        confidence: 'low',
        reason: 'Impossible de comparer avec les photos disponibles',
      });
    }

    // Sort by confidence: high > medium > low
    const confidenceScore = (conf: string) => (conf === 'high' ? 3 : conf === 'medium' ? 2 : 1);
    const bestMatch = validComparisons.sort(
      (a, b) => confidenceScore(b.confidence) - confidenceScore(a.confidence)
    )[0];

    return NextResponse.json({
      success: true,
      matchedPlayerId: bestMatch.matchedPlayerId,
      matchedPlayerName: bestMatch.matchedPlayerName,
      confidence: bestMatch.confidence,
      reason: bestMatch.reason,
    });
  } catch (error) {
    console.error('Identify player error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to identify player' },
      { status: 500 }
    );
  }
}
