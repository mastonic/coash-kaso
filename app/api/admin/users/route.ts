import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const admin = await import('firebase-admin');

    if (!admin.apps.length) {
      const serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }

    const db = admin.firestore();

    // Get all leads
    const leadsSnapshot = await db.collection('leads').orderBy('timestamp', 'desc').get();
    const leads = leadsSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      category: doc.data().category,
      timestamp: doc.data().timestamp,
    }));

    // Get all users with access
    const usersSnapshot = await db.collection('users_access').get();
    const accessMap = new Map<string, any>();
    usersSnapshot.docs.forEach(doc => {
      accessMap.set(doc.id, {
        status: doc.data().status,
        activatedAt: doc.data().activatedAt,
        plan: doc.data().plan,
        trialEndsAt: doc.data().trialEndsAt,
      });
    });

    // Merge leads with access status (un même email peut avoir plusieurs leads)
    const usersData = leads.map(lead => {
      const access = accessMap.get(lead.email) || { status: 'pending', activatedAt: null };
      return {
        ...lead,
        plan: access.plan ?? null,
        trialEndsAt: access.trialEndsAt ?? null,
        access,
      };
    });

    // Comptes activés directement (sans lead associé)
    accessMap.forEach((access, email) => {
      if (!usersData.some(u => u.email === email)) {
        usersData.push({
          id: email,
          email,
          category: '—',
          timestamp: access.activatedAt || new Date(0).toISOString(),
          plan: access.plan ?? null,
          trialEndsAt: access.trialEndsAt ?? null,
          access,
        });
      }
    });

    const activeCount = usersData.filter(u => u.access.status === 'active').length;
    const expiredCount = usersData.filter(u => u.access.status === 'expired').length;
    const totalCount = usersData.length;

    return NextResponse.json({
      success: true,
      users: usersData,
      stats: {
        total: totalCount,
        active: activeCount,
        expired: expiredCount,
        pending: totalCount - activeCount - expiredCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
