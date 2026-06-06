import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-ingest-secret');
  if (!secret || secret !== process.env.PROMO_INGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const deals: any[] = Array.isArray(body) ? body : (body.deals ?? []);

    if (deals.length === 0) {
      return NextResponse.json({ message: 'Aucun deal fourni', ingested: 0 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Supprimer les promos expirées
    const expiredSnap = await adminDb
      .collection('catalog_deals')
      .where('valid_until', '<', today)
      .get();

    if (expiredSnap.size > 0) {
      const deleteBatch = adminDb.batch();
      expiredSnap.docs.forEach(doc => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();
    }

    // Écrire les nouveaux deals (max 499 par batch Firestore)
    let ingested = 0;
    for (let i = 0; i < deals.length; i += 499) {
      const chunk = deals.slice(i, i + 499);
      const batch = adminDb.batch();

      for (const deal of chunk) {
        if (!deal.item?.trim() || !deal.chain?.trim() || typeof deal.price_promo !== 'number') continue;

        const ref = adminDb.collection('catalog_deals').doc();
        batch.set(ref, {
          item: deal.item.trim(),
          itemNormalized: deal.item.toLowerCase().trim(),
          chain: deal.chain.trim(),
          brand: deal.brand?.trim() || null,
          price_promo: deal.price_promo,
          price_normal: deal.price_normal ?? null,
          unit: deal.unit?.trim() || null,
          valid_until: deal.valid_until || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          region: deal.region || 'national',
          category: deal.category || 'Épicerie',
          scrapedAt: new Date().toISOString(),
        });
        ingested++;
      }

      await batch.commit();
    }

    return NextResponse.json({
      message: `${ingested} deals ingérés, ${expiredSnap.size} expirés supprimés`,
      ingested,
      deleted: expiredSnap.size,
    });
  } catch (err: any) {
    console.error('Promo ingest error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
