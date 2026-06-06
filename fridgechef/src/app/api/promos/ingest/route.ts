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
      await Promise.all(expiredSnap.docs.map(doc => doc.ref.delete()));
    }

    // Écrire les nouveaux deals en parallèle
    const writes = deals
      .filter(deal => deal.item?.trim() && deal.chain?.trim() && typeof deal.price_promo === 'number')
      .map(deal =>
        adminDb.collection('catalog_deals').doc().set({
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
        })
      );

    await Promise.all(writes);

    return NextResponse.json({
      message: `${writes.length} deals ingérés, ${expiredSnap.size} expirés supprimés`,
      ingested: writes.length,
      deleted: expiredSnap.size,
    });
  } catch (err: any) {
    console.error('Promo ingest error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
