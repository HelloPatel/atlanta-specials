const { chromium } = require('playwright');

const SITE = process.env.REC_URL || 'https://brijal-rushi-2026.site';
const OUT = process.env.REC_OUT || 'public/demos';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  console.log('Navigating to', SITE);
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  // Smooth scroll down the landing page
  const height = await page.evaluate(() => document.body.scrollHeight);
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), (height / steps) * i);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1000);
  // scroll back up
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
  console.log('Done. Video saved to', OUT);
})().catch((e) => { console.error('RECORD FAILED:', e); process.exit(1); });
