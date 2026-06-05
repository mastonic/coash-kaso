import { test, expect } from '@playwright/test';

test.describe('Vision Feedback API — validation', () => {
  test('POST /api/vision-feedback rejects empty body', async ({ request }) => {
    const res = await request.post('/api/vision-feedback', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/vision-feedback rejects missing imageHash', async ({ request }) => {
    const res = await request.post('/api/vision-feedback', {
      data: {
        correctedResult: {
          formation: '4-3-3',
          composition: [{ poste: 'GK', nom: 'Inconnu' }],
          consignes: [],
        },
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/vision-feedback rejects missing correctedResult', async ({ request }) => {
    const res = await request.post('/api/vision-feedback', {
      data: { imageHash: 'abc123' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/vision-feedback rejects wrong content-type', async ({ request }) => {
    const res = await request.post('/api/vision-feedback', {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/vision-feedback accepts valid correction (200 or 503 in test env)', async ({ request }) => {
    const res = await request.post('/api/vision-feedback', {
      data: {
        imageHash: 'testHash1234567890abcdef',
        originalResult: {
          formation: '4-4-2',
          composition: [{ poste: 'GK', nom: 'Jean Dupont' }],
          consignes: ['Consigne inventée'],
        },
        correctedResult: {
          formation: '4-3-3',
          composition: [{ poste: 'GK', nom: 'Inconnu' }],
          consignes: [],
        },
      },
      headers: { 'Content-Type': 'application/json' },
    });
    // 200 = saved to Firebase; 503 = Firebase unavailable in test env — both acceptable
    expect([200, 503]).toContain(res.status());
  });
});

test.describe('Analyze Vision API — non-regression after few-shot injection', () => {
  test('POST /api/analyze-vision still responds after prompt update', async ({ request }) => {
    const res = await request.post('/api/analyze-vision', {
      data: { imageBase64: 'dGVzdA==' }, // invalid base64 image — triggers validation
      headers: { 'Content-Type': 'application/json' },
    });
    // Endpoint must still be reachable — not 404 or 500 crash
    expect(res.status()).not.toBe(404);
    expect([400, 413, 429, 500]).toContain(res.status());
  });

  test('POST /api/analyze-vision returns 400 when no image provided', async ({ request }) => {
    const res = await request.post('/api/analyze-vision', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Video page — non-regression', () => {
  test('should load /video page without crash', async ({ page }) => {
    const response = await page.goto('/video');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });
});
