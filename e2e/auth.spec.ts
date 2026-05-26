import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('should navigate to home page', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('should load page without errors', async ({ page }) => {
    await page.goto('/');
    // Check that page has content (body is not empty)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});
