import { test, expect } from '@playwright/test';

function qaName(testInfo, type) {
  return `QA ${testInfo.project.name} RSVP ${type} ${Date.now()}`;
}

test.describe('RSVP management', () => {
  test('manages RSVP state, settings, sharing, and exports', async ({
    page,
    isMobile,
  }, testInfo) => {
    const eventName = qaName(testInfo, 'Event');
    const firstName = qaName(testInfo, 'Guest');
    const lastName = 'Shah';
    const guestName = `${firstName} ${lastName}`;

    await page.goto('/events');
    await page.getByRole('button', { name: /^(add event|or create a custom event)$/i }).first().click();
    await page.getByLabel('Event Name').fill(eventName);
    await page.getByLabel('Date').fill('2027-11-06');
    await page.getByLabel('Start time').fill('18:00');
    await page.getByLabel('End time').fill('22:00');
    await page.getByRole('button', { name: /^add event$/i }).last().click();
    await expect(page.getByRole('heading', { name: eventName })).toBeVisible();

    await page.goto('/guests');
    await page.getByRole('button', { name: /^add guest$/i }).first().click();
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Family Name').fill('Shah Family');
    await page.getByLabel('Side').selectOption('bride');
    await page.getByLabel('Dietary').selectOption('vegetarian');
    await page.getByRole('button', { name: /^add guest$/i }).last().click();

    await page.goto('/rsvp');
    await page.getByPlaceholder('Search guests...').fill(guestName);
    await page.getByLabel('Event filter').selectOption({ label: eventName });

    if (isMobile) {
      await page.getByRole('button', { name: `${eventName}: —`, exact: true }).click();
      await expect(page.getByRole('button', { name: `${eventName}: Yes`, exact: true })).toBeVisible();
    } else {
      const guestContainer = page.getByText(guestName, { exact: true }).first().locator('xpath=ancestor::tr');
      await guestContainer.getByTitle('accepted').click();
      await expect(guestContainer.getByTitle('accepted')).toHaveClass(/bg-green-500/);
    }
    await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

    const rsvpStateButton = page.getByRole('button', { name: /^RSVPs (Open|Closed)$/ });
    const initialState = await rsvpStateButton.textContent();
    await rsvpStateButton.click();
    await expect(rsvpStateButton).not.toHaveText(initialState);
    await rsvpStateButton.click();
    await expect(rsvpStateButton).toHaveText(initialState);

    await page.getByRole('button', { name: 'RSVP settings' }).click();
    await page.getByLabel('RSVP Deadline').fill('2027-10-15');
    await page.getByLabel('Planning buffer (%)').fill('12');
    await page.getByLabel('Custom Welcome Message').fill('Please reply for every event on your invitation.');
    await page.getByLabel('RSVP Password (optional)').fill('qa-rsvp');
    await page.getByLabel('Require phone number').check();

    if (isMobile) {
      for (const label of ['RSVP Deadline', 'Planning buffer (%)', 'Custom Welcome Message']) {
        const fontSize = await page.getByLabel(label)
          .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }
    }

    await page.getByRole('button', { name: 'Save Settings' }).click();
    await page.getByRole('button', { name: 'RSVP settings' }).click();
    await expect(page.getByLabel('RSVP Deadline')).toHaveValue('2027-10-15');
    await expect(page.getByLabel('Planning buffer (%)')).toHaveValue('12');
    await expect(page.getByLabel('Require phone number')).toBeChecked();
    await page.getByRole('button', { name: 'Save Settings' }).click();

    await page.getByRole('button', { name: 'Share RSVP link' }).click();
    await expect(page.getByLabel('RSVP link', { exact: true })).toHaveValue(/\/rsvp\//);
    await expect(page.getByRole('link', { name: 'Preview RSVP Page' })).toHaveAttribute('href', /\/rsvp\//);
    await page.getByRole('button', { name: 'Close dialog' }).click();

    await page.getByRole('button', { name: 'Export RSVP data' }).click();
    await expect(page.getByRole('menuitem', { name: 'RSVP log (CSV)' })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'RSVP log (CSV)' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('rsvp-log.csv');

    await page.goto('/guests');
    await page.getByRole('button', { name: 'List' }).click();
    await page.getByPlaceholder('Search guests...').fill(guestName);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${guestName}` }).click();
    await expect(page.getByText(guestName, { exact: true })).toHaveCount(0);

    await page.goto('/events');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${eventName}` }).click();
    await expect(page.getByRole('heading', { name: eventName })).toHaveCount(0);
  });
});
