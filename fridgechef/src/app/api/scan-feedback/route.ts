import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndCheckQuota } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const authResult = await authenticateAndCheckQuota(request, false);
  if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { scanId, scanType, originalIngredients, correctedIngredients } = await request.json();

    if (!scanType || !Array.isArray(correctedIngredients)) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }

    await adminDb.collection('scan_feedback').add({
      userId: authResult.uid,
      scanId: scanId || null,
      scanType,
      originalIngredients: Array.isArray(originalIngredients) ? originalIngredients : [],
      correctedIngredients: correctedIngredients.filter((s: unknown) => typeof s === 'string' && s.trim()),
      timestamp: new Date(),
    });

    return NextResponse.json({ message: 'Correction enregistrée. Merci !' });
  } catch (err) {
    console.error('Scan feedback error:', err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }
}
