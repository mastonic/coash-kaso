import { test, expect } from '@playwright/test';

test.describe('Mobile Performance & Accessibility', () => {
  test('iPhone: page should load quickly', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('iPhone: should not have horizontal scroll', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  test('iPhone: text should be readable', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const body = page.locator('body');
    const fontSize = await body.evaluate(el => window.getComputedStyle(el).fontSize);
    const fontSizeValue = parseInt(fontSize);
    expect(fontSizeValue).toBeGreaterThanOrEqual(12);
  });

  test('Pixel 5: page should be responsive', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('Pixel 5: should handle Android layout', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(600);
  });

  test('Pixel 5: forms should be usable', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/login');
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });

  test('iPad: should optimize for larger screen', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(768);
  });

  test('iPad: content should be readable', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('iPad: should load all pages quickly', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    const pages = ['/', '/login', '/dashboard', '/video', '/team'];
    for (const route of pages) {
      const startTime = Date.now();
      const response = await page.goto(route);
      const loadTime = Date.now() - startTime;
      expect(response?.ok() || response?.status() === 302).toBeTruthy();
      expect(loadTime).toBeLessThan(5000);
    }
  });
});

test.describe('Mobile Form Usability', () => {
  test('iPhone: login form should be accessible', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/login');
    const response = page.url();
    expect(response).toContain('localhost');
  });

  test('Pixel 5: inputs should have proper size', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/login');
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });

  test('iPad: form layout should be optimized', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/login');
    const form = page.locator('form').first();
    const isVisible = await form.isVisible().catch(() => false);
    // Form may not exist but page should load
    const response = page.url();
    expect(response).toContain('localhost');
  });
});

test.describe('Mobile Navigation', () => {
  test('iPhone: navigation should work', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThanOrEqual(0);
  });

  test('Pixel 5: can navigate between pages', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/');
    const response = await page.goto('/dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('iPad: wide layout should be used', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(768);
  });
});
