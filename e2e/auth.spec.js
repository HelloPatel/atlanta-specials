import { test, expect } from '@playwright/test';

test.describe('Authentication screens', () => {
  test('login page renders the email/password form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
  });

  test('login blocks submission of an empty form via native validation', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /^sign in$/i }).click();

    // The required email field should be invalid, so navigation must not occur.
    const emailInvalid = await page
      .getByLabel(/email/i)
      .evaluate((el) => el instanceof HTMLInputElement && !el.validity.valid);
    expect(emailInvalid).toBe(true);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login links to register and forgot-password', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]').first()).toBeVisible();
  });

  test('register page renders a signup form', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });
});
