import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/lemonsqueezy';

export async function POST(request: NextRequest) {
  try {
    const { plan, email } = await request.json();

    // Validate input
    if (!plan || !email) {
      return NextResponse.json(
        { error: 'Missing plan or email' },
        { status: 400 }
      );
    }

    if (plan !== 'coach_pro' && plan !== 'rt_manager') {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Create checkout session with LemonSqueezy
    const { checkoutUrl } = await createCheckout(plan, email);

    return NextResponse.json(
      { checkoutUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
