import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndCheckQuota } from '@/lib/api-auth';
import { getGeminiClient, callWithFallback } from '@/lib/gemini-client';
import { awardPoints, incrementUserStat, checkAndAwardBadges, updateStreak } from '@/lib/gamification';
import { adminDb } from '@/lib/firebase-admin';

interface ScanFeedbackExample {
  originalIngredients: string[];
  correctedIngredients: string[];
}

const BASE_PROMPTS: Record<string, string> = {
  fridge: `Tu es un assistant culinaire expert. Analyse cette photo de RÉFRIGÉRATEUR ouvert.

1. INGRÉDIENTS : Identifie tous les aliments frais et produits laitiers visibles (légumes, fruits, viandes, fromages, yaourts, sauces, boissons, restes, etc.). Ignore les étagères, bacs et ustensiles.

2. DLC : Si tu vois un produit avec une date de péremption lisible (DLC, DDM, DLUO, "à consommer avant"), lis-la. Priorité aux produits les plus périssables (viandes, laitages).

Retourne UNIQUEMENT ce JSON :
{"ingredients":["Tomates","Fromage","Lait"],"dlc":{"found":false,"productName":null,"date":null,"category":null}}

Règles DLC : "found": true si date lisible sur emballage, "date": "YYYY-MM-DD", "category": "laitage"|"viande"|"conserves"|"legume"|null, "productName": nom court. Si vue d'ensemble du frigo (pas de focus sur un produit), met found: false.`,

  placard: `Tu es un assistant culinaire expert. Analyse cette photo de PLACARD / GARDE-MANGER.

1. INGRÉDIENTS : Identifie tous les produits secs et conserves visibles (pâtes, riz, farine, sucre, huile, conserves, épices, céréales, biscuits, legumineuses, etc.). Ignore les boîtes vides, ustensiles, emballages non alimentaires.

2. DLC : Si tu vois un produit avec une date de péremption lisible (DLC, DDM, DLUO, "best before"), lis-la.

Retourne UNIQUEMENT ce JSON :
{"ingredients":["Pâtes","Riz","Lentilles"],"dlc":{"found":false,"productName":null,"date":null,"category":null}}

Règles DLC : "found": true si date lisible, "date": "YYYY-MM-DD", "category": "conserves"|"feculents"|"epices"|"sucre"|null, "productName": nom court.`,

  receipt: `Tu es un assistant culinaire expert. Analyse ce TICKET DE CAISSE.

1. INGRÉDIENTS : Extrais uniquement les articles alimentaires achetés (ignore les produits ménagers, cosmétiques, emballages, articles non alimentaires). Normalise les noms : "TOMATES CERISES 500G" → "Tomates cerises".

2. DLC : Non applicable pour un ticket de caisse.

Retourne UNIQUEMENT ce JSON :
{"ingredients":["Tomates cerises","Poulet","Yaourt nature"],"dlc":{"found":false,"productName":null,"date":null,"category":null}}

Règles : Si un article est ambigu (ex: "ART DIVERS"), ignore-le. Inclus seulement les aliments clairement identifiables.`,

  freezer: `Tu es un assistant culinaire expert. Analyse cette photo de CONGÉLATEUR.

1. INGRÉDIENTS : Identifie tous les aliments surgelés visibles (viandes, poissons, légumes surgelés, plats préparés, glaces, etc.). Les emballages peuvent être givrés ou partiellement visibles — fais de ton mieux. Ignore les bacs et accessoires.

2. DLC : Si tu vois une date de congélation ou de péremption lisible sur un emballage, lis-la.

Retourne UNIQUEMENT ce JSON :
{"ingredients":["Poulet surgelé","Petits pois","Pizza surgelée"],"dlc":{"found":false,"productName":null,"date":null,"category":null}}

Règles DLC : "found": true si date lisible, "date": "YYYY-MM-DD", "category": "viande"|"poisson"|"legume"|"plat_prepare"|null, "productName": nom court.`,
};

function buildPromptWithExamples(scanType: string, examples: ScanFeedbackExample[]): string {
  const base = BASE_PROMPTS[scanType] || BASE_PROMPTS.fridge;

  const meaningful = examples.filter(
    ex =>
      JSON.stringify([...ex.originalIngredients].sort()) !==
      JSON.stringify([...ex.correctedIngredients].sort())
  );

  if (meaningful.length === 0) return base;

  const lessons = meaningful
    .map((ex, i) => {
      const lines: string[] = [];

      const invented = ex.originalIngredients.filter(item => !ex.correctedIngredients.includes(item));
      const missed = ex.correctedIngredients.filter(item => !ex.originalIngredients.includes(item));

      if (invented.length > 0)
        lines.push(`  • Produits détectés à tort : ${invented.join(', ')}`);
      if (missed.length > 0)
        lines.push(`  • Produits présents mais non détectés : ${missed.join(', ')}`);

      return lines.length > 0 ? `Correction ${i + 1} :\n${lines.join('\n')}` : null;
    })
    .filter(Boolean)
    .join('\n\n');

  if (!lessons) return base;

  return `${base}

LEÇONS DES SCANS PRÉCÉDENTS — applique impérativement ces corrections :
${lessons}`;
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateAndCheckQuota(request, false);
  if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const uid = authResult.uid;

  try {
    const { image, scanType = 'fridge' } = await request.json();
    if (!image) return NextResponse.json({ error: "Image manquante" }, { status: 400 });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const mimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const genAI = getGeminiClient();

    // Fetch recent corrections for this scan type to improve accuracy
    let recentExamples: ScanFeedbackExample[] = [];
    try {
      const feedbackSnap = await adminDb
        .collection('scan_feedback')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      recentExamples = feedbackSnap.docs
        .map((doc): ScanFeedbackExample | null => {
          const d = doc.data() as Record<string, unknown>;
          if (
            d.scanType === scanType &&
            Array.isArray(d.originalIngredients) &&
            Array.isArray(d.correctedIngredients)
          ) {
            return {
              originalIngredients: d.originalIngredients as string[],
              correctedIngredients: d.correctedIngredients as string[],
            };
          }
          return null;
        })
        .filter((ex): ex is ScanFeedbackExample => ex !== null)
        .slice(0, 5);
    } catch {
      // Firebase unavailable — proceed with base prompt
    }

    const prompt = buildPromptWithExamples(scanType, recentExamples);

    const rawJson = await callWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]}]
      });
      const text = (result.response.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json|```/g, '').trim();
      if (!text) throw new Error('Vision API returned empty response');
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed?.ingredients)) throw new Error("Format JSON invalide");
        return text;
      } catch (e) {
        console.error('Scan-fridge JSON parse error:', e, 'Raw:', text);
        throw new Error("Réponse Vision API invalide (JSON parse failed)");
      }
    });

    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      console.error('Scan-fridge final parse error:', e, 'Raw:', rawJson);
      throw new Error('Failed to parse ingredients from vision');
    }
    const ingredients: string[] = parsed.ingredients || [];
    const dlcRaw = parsed.dlc || { found: false, productName: null, date: null, category: null };
    const dlcInfo = dlcRaw.found ? dlcRaw : null;

    const scanRef = adminDb.collection('scans').doc();
    await scanRef.set({
      userId: uid,
      ingredients,
      dlc: dlcInfo,
      scanType,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    await awardPoints(uid, 'scan');
    await incrementUserStat(uid, 'totalScans');
    await updateStreak(uid);
    const newBadges = await checkAndAwardBadges(uid);

    return NextResponse.json({ ingredients, newBadges, scanId: scanRef.id, dlcInfo });

  } catch (err: any) {
    console.error("Scan-fridge Gemini error:", err?.message || err);
    return NextResponse.json({ error: "Analyse échouée" }, { status: 500 });
  }
}
