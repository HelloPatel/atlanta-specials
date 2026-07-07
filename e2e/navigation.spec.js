import { test, expect } from '@playwright/test';

test.describe('Routing & access control', () => {
  test('unknown routes show the 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('a sampling of protected routes all redirect to login', async ({ page }) => {
    for (const route of ['/guests', '/events', '/seating', '/rsvp']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    }
  });
});
