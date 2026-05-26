import { test, expect } from '@playwright/test';

test.describe('Billing API Routes', () => {
  test.skip('should have checkout endpoint available', async ({ request }) => {
    // TODO: Requires LEMONSQUEEZY_* env vars
    const response = await request.post('/api/billing/checkout', {
      data: {
        plan: 'coach_pro',
        email: 'test@example.com',
      },
    });
    expect(response.status()).not.toBe(404);
  });

  test.skip('should have user plan endpoint available', async ({ request }) => {
    // TODO: Requires LEMONSQUEEZY_* env vars
    const response = await request.get('/api/user/plan');
    expect(response.status()).not.toBe(404);
  });

  test.skip('should have webhook endpoint available', async ({ request }) => {
    // TODO: Requires LEMONSQUEEZY_WEBHOOK_SECRET env var
    const response = await request.post('/api/billing/webhook', {
      data: {
        event: 'order.created',
      },
    });
    expect(response.status()).not.toBe(404);
  });
});
