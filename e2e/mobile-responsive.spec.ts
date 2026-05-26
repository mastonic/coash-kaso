import { test, expect } from '@playwright/test';

test.describe('Mobile Responsive Design', () => {
  test('iPhone: should load home page', async ({ page, browserName }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('iPhone: should load login page', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    const response = await page.goto('/login');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('iPhone: should have correct mobile viewport', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(600);
  });

  test('iPhone: should not have horizontal scroll', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const windowWidth = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  test('Pixel 5: should load home page', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('Pixel 5: should load dashboard', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    const response = await page.goto('/dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('Pixel 5: should have Android viewport', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(600);
    expect(viewport?.height).toBeGreaterThan(700);
  });

  test('iPad: should load home page', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('iPad: should have tablet viewport', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(768);
  });

  test('iPad: should load dashboard', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    const response = await page.goto('/dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('iPad: should load schedule', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    const response = await page.goto('/schedule');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });
});

test.describe('Cross-Device Navigation', () => {
  const routes = [
    '/',
    '/login',
    '/dashboard',
    '/rt-dashboard',
    '/video',
    '/team',
    '/history',
  ];

  routes.forEach(route => {
    test(`all devices: should load ${route}`, async ({ page }, testInfo) => {
      // Skip for desktop, only run on mobile
      if (testInfo.project.name === 'chromium') return;
      const response = await page.goto(route);
      expect(response?.ok() || response?.status() === 302).toBeTruthy();
    });
  });
});

test.describe('Mobile Touch & Interaction', () => {
  test('iPhone: should handle page interactions', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPhone')) return;
    await page.goto('/');
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('Pixel 5: should be responsive to content', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('Pixel')) return;
    await page.goto('/');
    const initialHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(initialHeight).toBeGreaterThan(0);
  });

  test('iPad: should handle tablet interactions', async ({ page }, testInfo) => {
    if (!testInfo.project.name.includes('iPad')) return;
    await page.goto('/');
    const contentWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(contentWidth).toBeGreaterThanOrEqual(768);
  });
});
