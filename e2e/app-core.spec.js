import { test, expect } from '@playwright/test';

function qaLabel(testInfo, type) {
  return `QA ${testInfo.project.name} ${type} ${Date.now()}`;
}

test.describe('Core planning workflows', () => {
  test('creates, edits, and deletes an event without mobile time overlap', async ({
    page,
    isMobile,
  }, testInfo) => {
    const eventName = qaLabel(testInfo, 'Event');
    await page.goto('/events');
    await page.getByRole('button', { name: /^(add event|or create a custom event)$/i }).first().click();

    await page.getByLabel('Event Name').fill(eventName);
    await page.getByLabel('Date').fill('2027-10-14');
    await page.getByLabel('Start time').fill('17:00');
    await page.getByLabel('End time').fill('19:30');

    if (isMobile) {
      const [startBox, endBox] = await Promise.all([
        page.getByLabel('Start time').boundingBox(),
        page.getByLabel('End time').boundingBox(),
      ]);
      expect(startBox).not.toBeNull();
      expect(endBox).not.toBeNull();
      expect(endBox.y).toBeGreaterThanOrEqual(startBox.y + startBox.height - 1);

      const inputFontSize = await page.getByLabel('Start time')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(inputFontSize).toBeGreaterThanOrEqual(16);
    }

    await page.getByRole('button', { name: /^add event$/i }).last().click();
    await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

    await page.getByRole('button', { name: `Edit ${eventName}` }).click();
    await page.getByLabel('Venue').fill('Phera QA Ballroom');
    await page.getByRole('button', { name: /save changes/i }).click();
    const eventCard = page.getByRole('button', { name: `Edit ${eventName}` })
      .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    await expect(eventCard.getByText('Phera QA Ballroom')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${eventName}` }).click();
    await expect(page.getByRole('heading', { name: eventName })).toHaveCount(0);
  });

  test('guest editing hides bulk actions and remains stable on mobile', async ({
    page,
    isMobile,
  }, testInfo) => {
    const firstName = qaLabel(testInfo, 'Guest');
    const lastName = 'Patel';
    const fullName = `${firstName} ${lastName}`;
    await page.goto('/guests');
    await page.getByRole('button', { name: /^add guest$/i }).first().click();

    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Family Name').fill('Phera QA Family');
    await page.getByLabel('Side').selectOption('bride');
    await page.getByLabel('Dietary').selectOption('vegetarian');
    await page.getByRole('button', { name: /^add guest$/i }).last().click();

    await page.getByRole('button', { name: 'List' }).click();
    await page.getByPlaceholder('Search guests...').fill(fullName);

    const editButton = page.getByRole('button', { name: `Edit ${fullName}` });
    await expect(editButton).toBeVisible();
    const guestContainer = isMobile
      ? editButton.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]')
      : editButton.locator('xpath=ancestor::tr');
    await guestContainer.locator('input[type="checkbox"]').check();

    const bulkSide = page.locator('select').filter({ hasText: 'Change Side...' });
    await expect(bulkSide).toBeVisible();
    await editButton.click();
    await expect(page.getByRole('heading', { name: 'Edit Guest' })).toBeVisible();
    await expect(bulkSide).toHaveCount(0);

    if (isMobile) {
      const firstNameFontSize = await page.getByLabel('First Name')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(firstNameFontSize).toBeGreaterThanOrEqual(16);
    }

    await page.getByLabel('Side').selectOption('groom');
    await page.getByLabel('Dietary').selectOption('vegan');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(guestContainer.getByText(/groom/i)).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${fullName}` }).click();
    await expect(page.getByText(fullName, { exact: true })).toHaveCount(0);
  });
});
