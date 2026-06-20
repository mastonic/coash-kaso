import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ExerciceCatalogue } from '@/lib/exercices/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const theme = searchParams.get('theme');
  const domaine = searchParams.get('domaine');
  const procede = searchParams.get('procede');
  const categorie = searchParams.get('categorie');
  const effectif = searchParams.get('effectif');
  const source = searchParams.get('source');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);

  if (!adminDb) {
    return NextResponse.json({ success: true, exercices: [] });
  }

  try {
    let query = adminDb
      .collection('exercices')
      .orderBy('titre')
      .limit(limit) as FirebaseFirestore.Query;

    if (procede) {
      query = query.where('procede', '==', procede);
    }
    if (domaine) {
      query = query.where('domaine', '==', domaine);
    }
    if (source) {
      query = query.where('source', '==', source);
    }

    const snap = await query.get();

    let exercices = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ExerciceCatalogue, 'id'>),
    })) as ExerciceCatalogue[];

    // Filtres post-requête (Firestore ne supporte pas les array-contains multiple)
    if (theme) {
      exercices = exercices.filter((e) => e.themes.includes(theme as ExerciceCatalogue['themes'][number]));
    }
    if (categorie) {
      exercices = exercices.filter((e) =>
        e.categoriesAge.includes(categorie as ExerciceCatalogue['categoriesAge'][number])
      );
    }
    if (effectif) {
      const eff = parseInt(effectif);
      if (!isNaN(eff)) {
        exercices = exercices.filter((e) => e.effectifMin <= eff && e.effectifMax >= eff);
      }
    }

    return NextResponse.json({ success: true, exercices, total: exercices.length });
  } catch (error) {
    console.error('Exercices GET:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
