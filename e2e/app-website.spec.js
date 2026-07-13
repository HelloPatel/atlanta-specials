import { test, expect } from '@playwright/test';

test.describe('Wedding website builder', () => {
  test('updates theme, background artwork, copy, and preview on both viewports', async ({
    page,
    isMobile,
  }) => {
    const tagline = `A weekend built around family, music, and good food ${Date.now()}`;
    await page.goto('/website');

    await page.getByRole('button', { name: /Royal Gold/ }).click();
    await page.getByLabel('Tagline or Quote').fill(tagline);
    await page.getByLabel('Background Style').selectOption('paisley');

    if (isMobile) {
      for (const label of ['Tagline or Quote', 'Background Style']) {
        const fontSize = await page.getByLabel(label)
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }
    }

    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    const hero = page.locator('[data-website-theme="royal-gold"][data-background-style="paisley"]');
    await expect(hero).toBeVisible();
    await expect(hero.locator('[data-hero-pattern="paisley"]')).toBeVisible();
    await expect(hero.getByText(tagline, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Background Style').selectOption('floral');
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await expect(page.locator('[data-background-style="floral"] [data-hero-pattern="floral"]')).toBeVisible();

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('button', { name: /Save (Draft|Changes)/ }).click();
    await expect(page.getByLabel('Tagline or Quote')).toHaveValue(tagline);
  });
});
