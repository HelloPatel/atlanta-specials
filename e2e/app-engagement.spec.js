import { test, expect } from '@playwright/test';

function uniqueName(testInfo, label) {
  return `QA ${testInfo.project.name} ${label} ${Date.now()}`;
}

test.describe('Photo groups and games', () => {
  test('creates, edits, runs, completes, and deletes a photo group', async ({
    page,
    isMobile,
  }, testInfo) => {
    const groupName = uniqueName(testInfo, 'Photo Group');
    const updatedName = `${groupName} Updated`;
    await page.goto('/photos');
    await page.getByRole('button', { name: /add group/i }).click();
    await page.getByLabel('Group name').fill(groupName);
    await page.getByLabel('Members').fill('Asha Patel\nNikhil Patel');

    if (isMobile) {
      const fontSize = await page.getByLabel('Group name')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }

    await page.getByRole('button', { name: /^add group$/i }).last().click();
    await expect(page.getByRole('button', { name: `Edit ${groupName}` })).toBeVisible();

    await page.getByRole('button', { name: `Edit ${groupName}` }).click();
    await page.getByLabel('Group name').fill(updatedName);
    await page.getByRole('button', { name: /save changes/i }).click();

    const editButton = page.getByRole('button', { name: `Edit ${updatedName}` });
    const groupCard = editButton.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
    await expect(groupCard).toContainText('Asha Patel');
    await groupCard.getByRole('button', { name: /^(set|set current)$/i }).click();
    await expect(page.getByText('Current group')).toBeVisible();
    await expect(page.getByRole('heading', { name: updatedName, level: 2 })).toBeVisible();

    await page.getByRole('button', { name: /mark complete/i }).click();
    await expect(groupCard).toContainText('completed');
    await page.getByRole('button', { name: `Delete ${updatedName}` }).click();
    await expect(page.getByRole('button', { name: `Edit ${updatedName}` })).toHaveCount(0);
  });

  test('creates, edits, scores, locks, and deletes a game question', async ({
    page,
    isMobile,
  }, testInfo) => {
    page.on('pageerror', (error) => console.error(`Games page error: ${error.stack || error.message}`));
    const question = uniqueName(testInfo, 'Question');
    const updatedQuestion = `${question}?`;
    await page.goto('/bets');
    await page.getByRole('button', { name: /add question/i }).click();
    await page.getByLabel('Section').fill('Reception');
    await page.getByLabel('Question', { exact: true }).fill(question);
    await page.getByLabel('Options', { exact: true }).fill('Option A\nOption B');

    if (isMobile) {
      const fontSize = await page.getByLabel('Question', { exact: true })
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }

    await page.getByRole('button', { name: /^add question$/i }).last().click();
    await expect(page.getByRole('button', { name: `Edit ${question}` })).toBeVisible();

    await page.getByRole('button', { name: `Edit ${question}` }).click();
    await page.getByLabel('Question', { exact: true }).fill(updatedQuestion);
    await page.getByRole('button', { name: /save changes/i }).click();

    const editButton = page.getByRole('button', { name: `Edit ${updatedQuestion}` });
    const questionCard = editButton.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
    await questionCard.getByRole('button', { name: /Option A \(0\)/ }).click();
    await expect(questionCard).toContainText('Correct answer: Option A');

    const votingButton = page.getByRole('button', { name: /^(open|locked)$/i, exact: true });
    await votingButton.click();
    await expect(page.getByRole('button', { name: 'Locked', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Locked', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeVisible();

    await page.getByRole('button', { name: `Delete ${updatedQuestion}` }).click();
    await expect(editButton).toHaveCount(0);
  });
});
