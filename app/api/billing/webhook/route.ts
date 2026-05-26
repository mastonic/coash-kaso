import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getPlanFromSubscription } from '@/lib/lemonsqueezy';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || request.headers.get('x-lemonsqueezy-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const subscription = payload.data?.attributes;
    const subscriptionId = payload.data?.id;

    if (!eventName || !subscription || !subscriptionId) {
      console.error('Invalid webhook payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Extract email and plan from subscription
    const email = subscription.customer_email || subscription.user_email;
    const customData = subscription.custom_data || {};
    const plan = customData.plan || getPlanFromSubscription(payload.data);

    if (!email || !plan) {
      console.error('Missing email or plan in subscription', {
        email,
        plan,
        customData,
        subscription,
      });
      return NextResponse.json(
        { error: 'Missing email or plan' },
        { status: 400 }
      );
    }

    // Update Firestore based on event type
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const userRef = adminDb.collection('users_access').doc(email);

    switch (eventName) {
      case 'subscription_created':
        await userRef.set(
          {
            email,
            status: 'active',
            plan,
            lsCustomerId: subscription.customer_id,
            lsSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            planActivatedAt: new Date().toISOString(),
            usage: {
              videoAnalysesUsed: 0,
              videoAnalysesResetAt: new Date().toISOString(),
              sessionsGeneratedThisMonth: 0,
              sessionsResetAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );
        console.log(`Subscription created for ${email}: ${plan}`);
        break;

      case 'subscription_updated':
        const subStatus =
          subscription.status === 'cancelled' ? 'cancelled' : 'active';
        await userRef.update({
          plan,
          subscriptionStatus: subStatus,
          status: subStatus === 'cancelled' ? 'expired' : 'active',
          lsSubscriptionId: subscriptionId,
        });
        console.log(`Subscription updated for ${email}: ${subStatus}`);
        break;

      case 'subscription_cancelled':
        await userRef.update({
          subscriptionStatus: 'cancelled',
          status: 'expired',
        });
        console.log(`Subscription cancelled for ${email}`);
        break;

      case 'subscription_expired':
        await userRef.update({
          subscriptionStatus: 'expired',
          status: 'expired',
        });
        console.log(`Subscription expired for ${email}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventName}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
