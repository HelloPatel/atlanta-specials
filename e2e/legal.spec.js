import { test, expect } from '@playwright/test';

test.describe('Legal and consent flows', () => {
  const legalPages = [
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms of Service'],
    ['/cookies', 'Cookie and Local Storage Notice'],
    ['/copyright', 'Copyright and Takedown Policy'],
    ['/accessibility', 'Accessibility Statement'],
  ];

  for (const [path, heading] of legalPages) {
    test(`${heading} is publicly available`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.locator('a[href="/"]').first()).toBeVisible();
    });
  }

  test('landing footer links to every legal policy', async ({ page }) => {
    await page.goto('/');
    for (const [path] of legalPages) {
      await expect(page.locator(`footer a[href="${path}"]`)).toBeAttached();
    }
  });

  test('signup requires legal acceptance before account creation', async ({ page }) => {
    await page.goto('/register');

    const consent = page.getByRole('checkbox');
    await expect(consent).not.toBeChecked();

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /create free account/i }).click();
    await expect(page.getByText(/please accept the terms of service/i)).toBeVisible();

    await consent.check();
    await expect(consent).toBeChecked();
  });
});
