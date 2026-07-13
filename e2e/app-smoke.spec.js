import { test, expect } from '@playwright/test';

const APP_ROUTES = [
  ['/dashboard', /.+ & .+/],
  ['/guests', /^guest list$/i],
  ['/events', /^events$/i],
  ['/seating', /^seating chart$/i],
  ['/rsvp', /^rsvp$/i],
  ['/print', /^print and export$/i],
  ['/photos', /^photo groups$/i],
  ['/bets', /^bets & games$/i],
  ['/website', /^wedding website$/i],
];

test.describe('Authenticated application shell', () => {
  for (const [route, heading] of APP_ROUTES) {
    test(`${route} loads without horizontal page overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route}$`));
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));
      expect(overflow.document, `${route} document overflow`).toBeLessThanOrEqual(1);
      expect(overflow.body, `${route} body overflow`).toBeLessThanOrEqual(1);
    });
  }

  test('mobile navigation opens and reaches secondary tools', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile navigation behavior');
    await page.goto('/dashboard');

    await page.getByRole('button', { name: /more navigation options/i }).click();
    await expect(page.getByRole('heading', { name: 'Navigation menu' })).toBeVisible();
    await page.getByRole('link', { name: 'Events' }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByRole('heading', { name: 'Navigation menu' })).toHaveCount(0);
  });
});
