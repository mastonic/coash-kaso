import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, category } = await request.json();

    if (!email || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use Firebase Admin SDK on server side
    const admin = await import('firebase-admin');

    // Initialize if not already done
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
    const normalizedEmail = email.toLowerCase();

    // Add the lead to Firestore
    const docRef = await db.collection('leads').add({
      email: normalizedEmail,
      category,
      timestamp: new Date().toISOString(),
    });

    // Auto-activate trial plan for new user
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    if (adminDb) {
      await adminDb.collection('users_access').doc(normalizedEmail).set(
        {
          email: normalizedEmail,
          status: 'active',
          plan: 'trial',
          trialEndsAt: trialEndsAt.toISOString(),
          usage: {
            videoAnalysesUsed: 0,
            videoAnalysesResetAt: now.toISOString(),
            sessionsGeneratedThisMonth: 0,
            sessionsResetAt: now.toISOString(),
          },
        },
        { merge: true }
      );
    }

    // Get the count of all leads
    const snapshot = await db.collection('leads').get();
    const leadNumber = snapshot.size;

    return NextResponse.json({
      success: true,
      leadNumber,
      docId: docRef.id,
    });
  } catch (error: any) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save lead' },
      { status: 500 }
    );
  }
}

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
    const snapshot = await db.collection('leads').orderBy('timestamp', 'desc').get();
    
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      category: doc.data().category,
      timestamp: doc.data().timestamp,
    }));

    return NextResponse.json({
      success: true,
      leads,
      count: leads.length,
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
