import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadE2EEnvironment } from './support/env.js';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

async function signInOrRegister(page, credentials) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();

  const signedIn = await page.waitForURL('**/dashboard', { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (signedIn) return;

  await page.goto('/register');
  await page.getByLabel('Full Name').fill(credentials.displayName);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /create free account/i }).click();
  const registered = await page.waitForURL('**/dashboard', { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (!registered) {
    const message = await page.locator('.text-red-700').first().textContent().catch(() => '');
    throw new Error(`QA account registration failed: ${message || `stayed on ${page.url()}`}`);
  }
}

export default async function globalSetup(config) {
  const credentials = loadE2EEnvironment(rootDir);
  if (!credentials.email || !credentials.password) {
    throw new Error('Authenticated Playwright projects require E2E_EMAIL and E2E_PASSWORD.');
  }

  const baseURL = config.projects[0].use.baseURL;
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addInitScript(() => {
    localStorage.setItem('phera-onboarding-complete', 'true');
  });
  const page = await context.newPage();
  const browserErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  try {
    await signInOrRegister(page, credentials);
    const createWedding = page.getByRole('button', { name: /^create wedding$/i });
    const weddingHeading = page.getByRole('heading', {
      name: `${credentials.partnerOne} & ${credentials.partnerTwo}`,
    });
    const dashboardState = await Promise.race([
      createWedding.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'create'),
      weddingHeading.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'ready'),
    ]).catch(() => 'unknown');

    if (dashboardState === 'create') {
      await page.waitForTimeout(750);
      const existingWeddingLoaded = await weddingHeading.isVisible().catch(() => false);
      if (!existingWeddingLoaded) {
        await createWedding.click({ timeout: 5_000 }).catch(() => {});
        const partnerOneInput = page.getByLabel('Partner 1 Name');
        const createFormOpened = await partnerOneInput.waitFor({ state: 'visible', timeout: 5_000 })
          .then(() => true)
          .catch(() => false);

        if (createFormOpened) {
          await partnerOneInput.fill(credentials.partnerOne);
          await page.getByLabel('Partner 2 Name').fill(credentials.partnerTwo);
          await page.getByLabel('Wedding Date').fill('2027-10-16');
          await page.getByRole('button', { name: /^create wedding$/i }).last().click();
        }
      }
    }

    const weddingReady = dashboardState === 'ready'
      || await weddingHeading.waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);
    if (!weddingReady) {
      const message = await page.locator('.text-red-700').last().textContent().catch(() => '');
      throw new Error([
        `QA wedding creation failed: ${message || 'wedding did not appear'}`,
        ...browserErrors,
      ].join(' | '));
    }
    mkdirSync(`${rootDir}\\.playwright`, { recursive: true });
    await context.storageState({
      path: `${rootDir}\\.playwright\\auth.json`,
      indexedDB: true,
    });
  } finally {
    await browser.close();
  }
}
