import { test, expect } from '@playwright/test';

test.describe('Page Navigation & Routing', () => {
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/rt-dashboard', name: 'RT Dashboard' },
    { path: '/video', name: 'Video' },
    { path: '/team', name: 'Team' },
    { path: '/presence', name: 'Presence' },
    { path: '/history', name: 'History' },
  ];

  pages.forEach(({ path, name }) => {
    test(`should load ${name} page (${path})`, async ({ page }) => {
      const response = await page.goto(path);
      // Accept 200 (OK) or 302 (redirect for auth)
      const isValid = response?.ok() || response?.status() === 302;
      expect(isValid).toBeTruthy();
    });
  });

  test('should load coach dashboard', async ({ page }) => {
    await page.goto('/coach-dashboard');
    const response = await page.goto('/coach-dashboard');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });

  test('should load schedule page', async ({ page }) => {
    await page.goto('/schedule');
    const response = await page.goto('/schedule');
    expect(response?.ok() || response?.status() === 302).toBeTruthy();
  });
});
