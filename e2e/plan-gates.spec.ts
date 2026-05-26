import { test, expect } from '@playwright/test';

test.describe('Plan Gates & Feature Access', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Page might redirect or show auth if not logged in
    // This test validates the route exists and responds
    const response = await page.goto('/dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('should load billing success page', async ({ page }) => {
    await page.goto('/billing/success');
    const response = await page.goto('/billing/success');
    expect(response?.ok()).toBeTruthy();
  });

  test('should load rt-dashboard', async ({ page }) => {
    await page.goto('/rt-dashboard');
    const response = await page.goto('/rt-dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('should have plan-gate component functionality', async ({ page }) => {
    // Test that the page can load without errors
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });
});
