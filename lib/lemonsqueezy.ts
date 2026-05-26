// LemonSqueezy API client and helpers
import crypto from 'crypto';

const API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

export interface LemonSqueezyCheckoutData {
  checkoutUrl: string;
}

export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, any>;
    relationships?: Record<string, any>;
  };
}

// Verify webhook signature using HMAC SHA256
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload, 'utf-8')
    .digest('hex');

  return hash === signature;
}

// Create a checkout session for a specific plan
export async function createCheckout(
  plan: 'coach_pro' | 'rt_manager',
  email: string,
  successUrl?: string
): Promise<LemonSqueezyCheckoutData> {
  if (!API_KEY || !STORE_ID) {
    throw new Error('LemonSqueezy API credentials not configured');
  }

  const variantId =
    plan === 'coach_pro'
      ? process.env.LEMONSQUEEZY_COACH_PRO_VARIANT_ID
      : process.env.LEMONSQUEEZY_RT_MANAGER_VARIANT_ID;

  if (!variantId) {
    throw new Error(`LemonSqueezy variant ID not configured for plan: ${plan}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://proseance.vercel.app';
  const checkoutSuccessUrl = successUrl || `${appUrl}/billing/success`;

  const checkoutData = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: {
            email,
            plan,
          },
        },
        product_options: {
          redirect_url: checkoutSuccessUrl,
          enabled_variants: [parseInt(variantId)],
        },
        preview: false,
        expires_at: null,
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: STORE_ID,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: variantId,
          },
        },
      },
    },
  };

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LemonSqueezy API error:', error);
      throw new Error(`Failed to create checkout: ${response.statusText}`);
    }

    const result = await response.json();
    const checkoutUrl = result.data.attributes.url;

    if (!checkoutUrl) {
      throw new Error('No checkout URL returned from LemonSqueezy');
    }

    return { checkoutUrl };
  } catch (error) {
    console.error('Error creating LemonSqueezy checkout:', error);
    throw error;
  }
}

// Retrieve subscription details from LemonSqueezy
export async function getSubscription(subscriptionId: string): Promise<any> {
  if (!API_KEY) {
    throw new Error('LemonSqueezy API credentials not configured');
  }

  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch subscription: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

// Extract plan from subscription attributes
export function getPlanFromSubscription(subscription: any): 'coach_pro' | 'rt_manager' | null {
  const customData = subscription.attributes?.order_item?.custom_data;
  const plan = customData?.plan || subscription.attributes?.variant?.name;

  if (plan?.includes('Coach Pro') || plan === 'coach_pro') {
    return 'coach_pro';
  }
  if (plan?.includes('RT Manager') || plan === 'rt_manager') {
    return 'rt_manager';
  }

  return null;
}
