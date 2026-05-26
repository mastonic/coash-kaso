import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { email, videoBase64, players } = await request.json();

    if (!email || !videoBase64 || !players || players.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email, videoBase64, and players required' },
        { status: 400 }
      );
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Filter players with photos
    const playersWithPhotos = players.filter((p: any) => p.photoUrl);
    if (playersWithPhotos.length === 0) {
      return NextResponse.json(
        {
          success: true,
          identifications: [],
          message: 'Aucun joueur avec photo pour la comparaison',
        }
      );
    }

    // Fetch player photos and prepare content
    const playerPhotos = await Promise.all(
      playersWithPhotos.map(async (player: any) => {
        try {
          const response = await fetch(player.photoUrl);
          if (!response.ok) return null;

          const buffer = await response.arrayBuffer();
          const base64Photo = Buffer.from(buffer).toString('base64');

          return {
            playerId: player.id,
            playerName: player.name,
            playerNumber: player.number,
            photoBase64: base64Photo,
          };
        } catch (error) {
          console.error(`Error fetching photo for ${player.id}:`, error);
          return null;
        }
      })
    );

    const validPhotos = playerPhotos.filter((p): p is any => p !== null);
    if (validPhotos.length === 0) {
      return NextResponse.json(
        {
          success: true,
          identifications: [],
          message: 'Impossible de charger les photos des joueurs',
        }
      );
    }

    // Build multimodal content with player reference photos first
    const content: any = [
      {
        type: 'text' as const,
        text: `Tu es un analyste vidéo de football spécialisé dans l'identification des joueurs.

Voici les photos de référence des joueurs de l'équipe:
${validPhotos.map((p, i) => `${i + 1}. Joueur ID: ${p.playerId}, Nom: ${p.playerName}, Numéro: ${p.playerNumber}`).join('\n')}

Analyse la vidéo et identifie chaque joueur visible en utilisant:
- Les traits du visage (comparer avec les photos de référence)
- Le numéro de maillot (si visible)
- La silhouette et le style de jeu
- La couleur du maillot et la position sur le terrain

Retourne UNIQUEMENT un JSON valide (pas de texte avant ou après):
{
  "identifications": [
    {
      "playerId": "player-id-or-UNKNOWN",
      "playerName": "Nom du Joueur ou Joueur Inconnu",
      "confidence": "high" ou "medium" ou "low",
      "description": "Joueur portant le #7, cheveux noirs, côté gauche du terrain",
      "timestampApprox": "0:23"
    }
  ]
}

CONTRAINTES:
- playerId: utiliser exactement l'ID fourni ou "UNKNOWN"
- confidence: "high" (>80%), "medium" (50-80%), "low" (<50%)
- description: courte description de la position et apparence
- timestampApprox: approximativement quand visible (ex: "0:15", "1:30")
- Ne lister que les joueurs clairement visibles (minimum 2-3 secondes)
- Si un joueur apparaît plusieurs fois, ne le lister qu'une fois
- Retourner au maximum 11 identifications (11 joueurs sur le terrain)
- JSON parsable
- Pas de texte avant ou après le JSON`,
      },
    ];

    // Add reference photos
    for (const photo of validPhotos) {
      content.push({
        type: 'image' as const,
        inlineData: {
          mimeType: 'image/jpeg',
          data: photo.photoBase64,
        },
      });
    }

    // Add video
    content.push({
      type: 'video' as const,
      inlineData: {
        mimeType: 'video/mp4',
        data: videoBase64,
      },
    });

    // Call Gemini
    const result = await model.generateContent(content);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: true,
        identifications: [],
        message: 'Impossible de parser la réponse de l\'IA',
      });
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      identifications: parsedResult.identifications || [],
    });
  } catch (error) {
    console.error('Identify in video error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to identify players in video',
      },
      { status: 500 }
    );
  }
}
