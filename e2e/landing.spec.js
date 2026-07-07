import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders the hero and primary calls to action', async ({ page }) => {
    await page.goto('/');

    // Hero headline (text is split across spans/line-breaks in the markup).
    await expect(page.getByRole('heading', { name: /Indian wedding/i }).first()).toBeVisible();

    // "See it in action" demo section is always present.
    await expect(page.getByRole('heading', { name: /See it in action/i })).toBeVisible();

    // Sign-up / sign-in entry points exist (may appear multiple times).
    await expect(page.locator('a[href="/register"]').first()).toBeAttached();
    await expect(page.locator('a[href="/login"]').first()).toBeAttached();
  });

  test('does not surface the app error boundary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });
});
