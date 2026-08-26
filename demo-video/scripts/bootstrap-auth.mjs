// Bootstraps an authenticated + seeded Phera session against the local
// Firebase emulators and saves it as reusable Playwright storageState
// (.playwright/auth.json, indexedDB included so Firebase Auth survives).
// Run from the repo root:  node demo-video/scripts/bootstrap-auth.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const APP = process.env.DEMO_URL ?? "http://localhost:5173";
const AUTH = join(ROOT, ".playwright", "auth.json");

const cred = {
  email: process.env.E2E_EMAIL ?? "demo@phera.app",
  password: process.env.E2E_PASSWORD ?? "DemoPass123!",
  displayName: process.env.E2E_DISPLAY_NAME ?? "Phera Demo",
  partnerOne: process.env.E2E_PARTNER_ONE ?? "Priya",
  partnerTwo: process.env.E2E_PARTNER_TWO ?? "Arjun",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signInOrRegister(page) {
  await page.goto(`${APP}/login`);
  await page.getByLabel("Email").fill(cred.email);
  await page.getByLabel("Password").fill(cred.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  const signedIn = await page.waitForURL("**/dashboard", { timeout: 10000 })
    .then(() => true).catch(() => false);
  if (signedIn) return;

  await page.goto(`${APP}/register`);
  await page.getByLabel("Full Name").fill(cred.displayName);
  await page.getByLabel("Email").fill(cred.email);
  await page.getByLabel("Password").fill(cred.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /create free account/i }).click();
  const registered = await page.waitForURL("**/dashboard", { timeout: 20000 })
    .then(() => true).catch(() => false);
  if (!registered) throw new Error(`registration failed, stayed on ${page.url()}`);
}

async function ensureWedding(page) {
  const heading = page.getByRole("heading", {
    name: `${cred.partnerOne} & ${cred.partnerTwo}`,
  });
  if (await heading.isVisible().catch(() => false)) return;

  const createWedding = page.getByRole("button", { name: /^create wedding$/i });
  const state = await Promise.race([
    createWedding.waitFor({ state: "visible", timeout: 20000 }).then(() => "create"),
    heading.waitFor({ state: "visible", timeout: 20000 }).then(() => "ready"),
  ]).catch(() => "unknown");
  if (state === "ready") return;

  await createWedding.click({ timeout: 5000 }).catch(() => {});
  const p1 = page.getByLabel("Partner 1 Name");
  if (await p1.waitFor({ state: "visible", timeout: 5000 }).then(() => true).catch(() => false)) {
    await p1.fill(cred.partnerOne);
    await page.getByLabel("Partner 2 Name").fill(cred.partnerTwo);
    await page.getByLabel("Wedding Date").fill("2027-10-16");
    await page.getByRole("button", { name: /^create wedding$/i }).last().click();
  }
  await heading.waitFor({ timeout: 20000 });
}

async function seedGuests(page) {
  const seedBtn = page.getByRole("button", { name: /^Seed \d+ Guests$/ });
  const doneBtn = page.getByRole("button", { name: /^Done$/ });
  let visible = false;
  for (let attempt = 0; attempt < 3 && !visible; attempt++) {
    await page.goto(`${APP}/seed`);
    // active wedding loads async from Firestore; give it time to render
    visible = await Promise.race([
      seedBtn.waitFor({ state: "visible", timeout: 15000 }).then(() => true),
      doneBtn.waitFor({ state: "visible", timeout: 15000 }).then(() => "done"),
    ]).catch(() => false);
    if (visible === "done") { console.log("  guests already seeded"); return; }
  }
  if (!visible) {
    console.log("  seed page: seed button never appeared — skipping");
    return;
  }
  await seedBtn.click();
  await page.getByLabel("Confirmation").fill("SEED");
  await page.getByRole("button", { name: /add test guests/i }).click();
  await page.getByText(/^Done\. Seeded/).waitFor({ timeout: 60000 });
  console.log("  guests seeded");
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: APP });
  await context.addInitScript(() => {
    localStorage.setItem("phera-onboarding-complete", "true");
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("  pageerror:", e.message));
  try {
    await signInOrRegister(page);
    console.log("\u2713 authenticated");
    await ensureWedding(page);
    console.log("\u2713 wedding ready");
    await seedGuests(page);
    await sleep(1500);
    mkdirSync(join(ROOT, ".playwright"), { recursive: true });
    await context.storageState({ path: AUTH, indexedDB: true });
    console.log(`\u2713 saved storageState \u2192 ${AUTH}`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error("bootstrap failed:", e); process.exit(1); });
