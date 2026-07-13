import { test, expect } from '@playwright/test';

function qaName(testInfo, type) {
  return `QA ${testInfo.project.name} Seating ${type} ${Date.now()}`;
}

test.describe('Seating management', () => {
  test('creates a table, assigns a guest, and removes the table', async ({
    page,
    isMobile,
  }, testInfo) => {
    const eventName = qaName(testInfo, 'Event');
    const firstName = qaName(testInfo, 'Guest');
    const lastName = 'Mehta';
    const guestName = `${firstName} ${lastName}`;
    const tableName = qaName(testInfo, 'Table');

    await page.goto('/events');
    await page.getByRole('button', { name: /^(add event|or create a custom event)$/i }).first().click();
    await page.getByLabel('Event Name').fill(eventName);
    await page.getByLabel('Date').fill('2027-12-04');
    await page.getByLabel('Start time').fill('18:30');
    await page.getByLabel('End time').fill('23:00');
    await page.getByRole('button', { name: /^add event$/i }).last().click();

    await page.goto('/guests');
    await page.getByRole('button', { name: /^add guest$/i }).first().click();
    await page.getByLabel('First Name').fill(firstName);
    await page.getByLabel('Last Name').fill(lastName);
    await page.getByLabel('Family Name').fill('Mehta Family');
    await page.getByLabel('Side').selectOption('groom');
    await page.getByLabel('Dietary').selectOption('jain');
    await page.getByRole('button', { name: /^add guest$/i }).last().click();

    await page.goto('/seating');
    await page.getByLabel('Select event').selectOption({ label: eventName });

    if (isMobile) {
      await expect(page.getByText('Positions locked')).toBeVisible();
      await expect(page.getByTitle('Move table')).toHaveCount(0);
      await page.getByRole('button', { name: 'Tables', exact: true }).click();
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('button', { name: /Round \(Small\).*6 seats/ }).click();

      await page.getByRole('button', { name: 'Edit Table 1' }).click();
      await page.getByLabel('Table name').fill(tableName);
      await page.getByLabel('Capacity').fill('7');

      const tableNameFontSize = await page.getByLabel('Table name')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(tableNameFontSize).toBeGreaterThanOrEqual(16);

      await page.getByRole('button', { name: 'Save table' }).click();
      await page.getByRole('button', { name: 'Close table details' }).click();
      await page.getByRole('button', { name: /^Guests/ }).click();

      const assignment = page.getByLabel(`Table assignment for ${guestName}`);
      await assignment.selectOption({ label: `${tableName} (0/7)` });
      await expect(assignment).not.toHaveValue('');
      await page.getByRole('button', { name: 'Tables', exact: true }).click();
      await page.getByRole('button', { name: new RegExp(`${tableName}.*1/7 seats`) }).click();
      await expect(page.getByText(guestName, { exact: true })).toBeVisible();

      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Remove table' }).click();
      await expect(page.getByText(tableName, { exact: true })).toHaveCount(0);
    } else {
      await page.getByRole('button', { name: 'Table', exact: true }).click();
      await page.getByRole('button', { name: '+ Create Custom Table' }).click();
      await page.getByLabel('Table Name').fill(tableName);
      await page.getByLabel('Shape').selectOption('round');
      await page.getByLabel('Seats').fill('7');
      await page.getByRole('button', { name: 'Add Table', exact: true }).last().click();
      await expect(page.getByText(tableName, { exact: true })).toBeVisible();

      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Auto-Seat' }).click();
      await expect(page.getByText(guestName, { exact: true })).toBeVisible();

      await page.getByText(tableName, { exact: true }).hover();
      await page.getByTitle('Remove table').click();
      await expect(page.getByText(tableName, { exact: true })).toHaveCount(0);
    }

    await page.goto('/guests');
    await page.getByRole('button', { name: 'List' }).click();
    await page.getByPlaceholder('Search guests...').fill(guestName);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${guestName}` }).click();

    await page.goto('/events');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${eventName}` }).click();
  });
});
