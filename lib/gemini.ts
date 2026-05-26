import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface DiagramData {
  players: Array<{ x: number; y: number; number?: number; team: 'attaque' | 'défense' }>;
  movements: Array<{ from: { x: number; y: number }; to: { x: number; y: number }; style?: 'passe' | 'dribble' | 'déplacement' }>;
}

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

/**
 * Valide qu'une illustration est bien un JSON DiagramData valide.
 * Si c'est de l'ASCII ou invalide → retourne null.
 */
function validateIllustration(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    // Si c'est déjà un objet stringifié
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.players) &&
      parsed.players.length > 0 &&
      typeof parsed.players[0].x === 'number' &&
      typeof parsed.players[0].y === 'number' &&
      (parsed.players[0].team === 'attaque' || parsed.players[0].team === 'défense')
    ) {
      return JSON.stringify(parsed); // retourne proprement stringifié
    }
    return null;
  } catch {
    return null; // ASCII ou autre → null
  }
}

/**
 * Génère un diagramme par défaut si Gemini a échoué à en produire un valide.
 * Positionne les joueurs logiquement selon le type d'exercice.
 */
function defaultDiagram(playerCount: number, type: 'game' | 'exercise' | 'situation'): string {
  const players: DiagramData['players'] = [];
  const movements: DiagramData['movements'] = [];

  const half = Math.floor(playerCount / 2);
  const attCount = Math.ceil(playerCount / 2);
  const defCount = Math.floor(playerCount / 2);

  if (type === 'game') {
    // Rondo : attaquants en périphérie, défenseurs au centre
    const attAngles = Array.from({ length: attCount }, (_, i) => (i / attCount) * 2 * Math.PI);
    attAngles.forEach((angle, i) => {
      players.push({
        x: Math.round(50 + 32 * Math.cos(angle)),
        y: Math.round(50 + 28 * Math.sin(angle)),
        number: i + 1,
        team: 'attaque',
      });
    });
    for (let i = 0; i < defCount; i++) {
      players.push({ x: 42 + i * 16, y: 50, number: i + 1, team: 'défense' });
    }
    // Quelques passes en périmètre
    if (attCount >= 2) {
      movements.push({ from: { x: players[0].x, y: players[0].y }, to: { x: players[1].x, y: players[1].y }, style: 'passe' });
    }
    if (attCount >= 3) {
      movements.push({ from: { x: players[1].x, y: players[1].y }, to: { x: players[2].x, y: players[2].y }, style: 'passe' });
    }
  } else if (type === 'exercise') {
    // Exercice technique : joueurs en ligne ou triangle
    const cols = Math.ceil(Math.sqrt(playerCount));
    players.forEach = undefined as never;
    for (let i = 0; i < playerCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      players.push({
        x: 20 + col * (60 / Math.max(cols - 1, 1)),
        y: 25 + row * 25,
        number: i + 1,
        team: i % 2 === 0 ? 'attaque' : 'défense',
      });
    }
    if (players.length >= 2) {
      movements.push({ from: { x: players[0].x, y: players[0].y }, to: { x: players[1].x, y: players[1].y }, style: 'passe' });
    }
  } else {
    // Situation : équipes en face à face
    for (let i = 0; i < attCount; i++) {
      players.push({
        x: 25 + (i % 3) * 12,
        y: 20 + Math.floor(i / 3) * 20,
        number: i + 1,
        team: 'attaque',
      });
    }
    for (let i = 0; i < defCount; i++) {
      players.push({
        x: 63 + (i % 3) * 12,
        y: 20 + Math.floor(i / 3) * 20,
        number: i + 1,
        team: 'défense',
      });
    }
    if (players.length >= 2) {
      movements.push({
        from: { x: players[0].x, y: players[0].y },
        to: { x: players[attCount].x, y: players[attCount].y },
        style: 'passe',
      });
    }
  }

  return JSON.stringify({ players, movements });
}

export async function generateSession(
  theme: string,
  load: string,
  school: string,
  playerCount: number
): Promise<SessionData> {

  // Exemple très explicite pour Gemini
  const diagramExample = JSON.stringify({
    players: [
      { x: 20, y: 50, number: 1, team: 'attaque' },
      { x: 50, y: 20, number: 2, team: 'attaque' },
      { x: 80, y: 50, number: 3, team: 'attaque' },
      { x: 50, y: 80, number: 4, team: 'attaque' },
      { x: 40, y: 50, number: 1, team: 'défense' },
      { x: 60, y: 50, number: 2, team: 'défense' },
    ],
    movements: [
      { from: { x: 20, y: 50 }, to: { x: 50, y: 20 }, style: 'passe' },
      { from: { x: 50, y: 20 }, to: { x: 80, y: 50 }, style: 'passe' },
      { from: { x: 40, y: 50 }, to: { x: 55, y: 40 }, style: 'déplacement' },
    ],
  });

  const prompt = `Tu es un expert en coaching football (école ${school}).
Génère une séance d'entraînement complète sur le thème "${theme}", charge "${load}", ${playerCount} joueurs.

⚠️ LANGUE OBLIGATOIRE : TOUT LE TEXTE DOIT ÊTRE EN FRANÇAIS
- Tous les champs (title, objective, content, setup, technique, fieldSetup) sont UNIQUEMENT EN FRANÇAIS
- PAS de traduction dans la langue de l'école
- Même si school="${school}", le contenu reste 100% FRANÇAIS

RÈGLE ABSOLUE POUR LE CHAMP "illustration" :
- TOUJOURS un JSON stringifié (string entre guillemets dans le JSON global)
- JAMAIS de texte ASCII, JAMAIS de caractères comme +, -, |, O, X
- Format OBLIGATOIRE : ${diagramExample}
- x=0 gauche, x=100 droite, y=0 haut, y=100 bas (coordonnées % du terrain)
- team UNIQUEMENT "attaque" ou "défense"
- movements.style UNIQUEMENT "passe", "dribble" ou "déplacement"
- Positionne ${playerCount} joueurs MAX de façon LOGIQUE pour chaque exercice
- Les joueurs attaquants d'un côté, défenseurs de l'autre (ou en cercle pour rondo)

Retourne UNIQUEMENT ce JSON valide, sans aucun texte avant ou après :
{
  "games": [
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "setup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "setup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "setup": string, "duration": number}
  ],
  "exercises": [
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "technique": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "technique": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "technique": string, "duration": number}
  ],
  "situations": [
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "fieldSetup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "fieldSetup": string, "duration": number},
    {"title": string, "objective": string, "content": string, "illustration": "<JSON stringifié>", "fieldSetup": string, "duration": number}
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini response (first 300):', text.substring(0, 300));

    // Nettoie les blocs markdown
    let jsonStr = text.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    // Nettoie les caractères problématiques avant parsing
    // Échappe les apostrophes non échappées dans les strings JSON
    jsonStr = jsonStr.replace(/: "([^"]*)'([^"]*)"/g, ': "$1\\'$2"');

    let parsed: SessionData;
    try {
      parsed = JSON.parse(jsonStr) as SessionData;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('JSON string around error:', jsonStr.substring(Math.max(0, 7800), 7900));
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // ── VALIDATION ET CORRECTION DES ILLUSTRATIONS ──────────────────────
    // Si Gemini a quand même retourné de l'ASCII → on remplace par un diagramme par défaut
    const fixItems = <T extends { illustration: string }>(
      items: T[],
      type: 'game' | 'exercise' | 'situation'
    ): T[] =>
      items.map((item) => ({
        ...item,
        illustration: validateIllustration(item.illustration) ?? defaultDiagram(playerCount, type),
      }));

    parsed.games      = fixItems(parsed.games,      'game');
    parsed.exercises  = fixItems(parsed.exercises,  'exercise');
    parsed.situations = fixItems(parsed.situations, 'situation');

    console.log(
      'Session OK:',
      parsed.games.length, 'games,',
      parsed.exercises.length, 'exercises,',
      parsed.situations.length, 'situations'
    );

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
      { inlineData: { mimeType: 'video/mp4', data: fileBase64 } },
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
