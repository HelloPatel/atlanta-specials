// Records cinematic Phera demo clips by driving the LIVE app (authenticated,
// seeded) with Playwright: a visible synthetic cursor glides, clicks ripple, and
// every scene is captured as its own webm in out/clips/.
//
// Authenticated recording: every scene loads .playwright/auth.json (produced by
// bootstrap-auth.mjs, indexedDB included so Firebase Auth survives). We do NOT
// chain context.storageState() between scenes because that call drops indexedDB
// and would lose the login — each scene starts from the same saved auth instead.
//
// Usage (from repo root, emulators + vite must be up):
//   node demo-video/scripts/record.mjs [scene ...]
import { chromium } from "playwright";
import { existsSync, mkdirSync, renameSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));      // demo-video/
const REPO = dirname(ROOT);                                        // repo root
const CLIPS = join(ROOT, "out", "clips");
const FIXTURES = join(ROOT, "fixtures");
const IMPORT_CSV = join(FIXTURES, "import-guests.csv");
const AUTH = join(REPO, ".playwright", "auth.json");
const APP = process.env.DEMO_URL ?? "http://localhost:5173";
// Record at the composition's native resolution, 1:1 — matches the landscape render.
const SIZE = { width: 1920, height: 1080 };

const CURSOR_INIT = `
(() => {
  const make = () => {
    if (document.getElementById("__cursor")) return;
    const c = document.createElement("div");
    c.id = "__cursor";
    c.style.cssText = [
      "position:fixed", "left:-40px", "top:-40px", "width:22px", "height:22px",
      "border-radius:50%", "background:rgba(255,255,255,0.95)",
      "border:1.5px solid rgba(120,30,60,0.55)", "box-shadow:0 1px 8px rgba(0,0,0,0.35)",
      "z-index:2147483647", "pointer-events:none", "transform:translate(-50%,-50%)",
      "transition:width .12s ease,height .12s ease,background .12s ease",
    ].join(";");
    document.documentElement.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => { c.style.width = "15px"; c.style.height = "15px"; c.style.background = "rgba(158,42,80,0.95)"; }, true);
    addEventListener("mouseup", () => { c.style.width = "22px"; c.style.height = "22px"; c.style.background = "rgba(255,255,255,0.95)"; }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", make);
  else make();
})();
`;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Director {
  constructor(page) {
    this.page = page;
    this.x = SIZE.width / 2;
    this.y = SIZE.height / 2;
    this.events = [];
    this.t0 = Date.now();
  }
  log(type, extra = {}) {
    this.events.push({ type, t: (Date.now() - this.t0) / 1000, x: Math.round(this.x), y: Math.round(this.y), ...extra });
  }
  async glideTo(x, y, ms = 650) {
    const steps = Math.max(12, Math.round(ms / 16));
    const [x0, y0] = [this.x, this.y];
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps);
      await this.page.mouse.move(x0 + (x - x0) * t, y0 + (y - y0) * t);
      await sleep(ms / steps);
    }
    this.x = x; this.y = y;
  }
  async glide(selector, ms = 650) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout: 15000 });
    await el.scrollIntoViewIfNeeded().catch(() => {});
    const box = await el.boundingBox();
    await this.glideTo(box.x + box.width / 2, box.y + box.height / 2, ms);
    return el;
  }
  async click(selector, { pause = 260, ms = 600, force = false } = {}) {
    const el = await this.glide(selector, ms);
    await sleep(pause);
    await el.click({ delay: 70, force });
    this.log("click", { selector });
  }
  async type(selector, text, { perChar = 70 } = {}) {
    await this.click(selector);
    for (const ch of text) { await this.page.keyboard.type(ch); await sleep(perChar); }
    this.log("type", { selector, chars: text.length });
  }
  async wheel(dy, ms = 700) {
    const steps = Math.max(10, Math.round(ms / 16));
    for (let i = 0; i < steps; i++) { await this.page.mouse.wheel(0, dy / steps); await sleep(ms / steps); }
  }
  /** Choose an option in a native <select> by its visible label. */
  async selectByLabel(selector, label) {
    const el = await this.glide(selector, 550);
    await el.selectOption({ label });
    this.log("select", { selector, label });
    await sleep(200);
  }
  /** Glide to a drop zone, then feed a file into the modal's hidden <input>. */
  async dropFiles(dropSelector, inputSelector, filePath) {
    await this.glide(dropSelector, 700).catch(() => {});
    await sleep(300);
    await this.page.setInputFiles(inputSelector, filePath);
    this.log("drop", { filePath });
  }
  /** dnd-kit pointer drag: press a guest chip, nudge past the activation
   *  threshold, then walk the cursor onto a table and release. */
  async dragGuest(fromSelector, toSelector) {
    const from = await this.glide(fromSelector, 700);
    const fb = await from.boundingBox();
    const to = this.page.locator(toSelector).first();
    await to.scrollIntoViewIfNeeded().catch(() => {});
    const tb = await to.boundingBox();
    if (!fb || !tb) return;
    const [sx, sy] = [fb.x + fb.width / 2, fb.y + fb.height / 2];
    const [tx, ty] = [tb.x + tb.width / 2, tb.y + tb.height / 2];
    await this.page.mouse.move(sx, sy);
    await this.page.mouse.down();
    await sleep(160);
    await this.page.mouse.move(sx + 10, sy + 10, { steps: 5 }); // pass PointerSensor activation
    await sleep(120);
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps);
      await this.page.mouse.move(sx + (tx - sx) * t, sy + (ty - sy) * t, { steps: 2 });
      await sleep(26);
    }
    this.x = tx; this.y = ty;
    await sleep(200);
    await this.page.mouse.up();
    this.log("drag", { fromSelector, toSelector });
    await sleep(400);
  }
}

// ───────────────────────────── scenes ─────────────────────────────
// Cinematic product sizzle for the landing-page hero. Guests are seeded (~150);
// events/seating are intentionally left for feature-specific videos. Keep motion
// calm — glide, pause, act, hold.

const scenes = {
  /** Dashboard glance: couple name, big countdown, the four stat cards, then the
   *  live guest analytics (dietary + side split). */
  async "01-dashboard"(d, page) {
    await page.goto(`${APP}/dashboard`);
    await page.getByRole("heading", { name: "Priya & Arjun" }).waitFor({ timeout: 20000 });
    await sleep(1400);
    // sweep across the four quick-stat cards
    await d.glide('button:has-text("Guests")', 800);
    await sleep(500);
    await d.glide('button:has-text("Events")', 550);
    await sleep(350);
    await d.glide('button:has-text("Seated")', 550);
    await sleep(350);
    await d.glide('button:has-text("RSVP Rate")', 550);
    await sleep(700);
    // drift down to the analytics cards
    await d.wheel(520, 900);
    await sleep(1600);
    await d.glide('text=Dietary Breakdown', 700).catch(() => {});
    await sleep(1800);
  },

  /** Guest List: 150+ seeded guests, then a live search filter. */
  async "02-guests"(d, page) {
    await page.goto(`${APP}/guests`);
    await page.getByRole("heading", { name: "Guest List" }).waitFor({ timeout: 20000 });
    await sleep(1500);
    await d.glideTo(SIZE.width / 2, SIZE.height * 0.55, 700);
    await sleep(1000);
    await d.type('input[placeholder="Search guests..."]', "Sharma", { perChar: 90 });
    await sleep(2200);
  },

  /** Events timeline: three ceremonies with distinct invite scopes. */
  async events(d, page) {
    await page.goto(`${APP}/events`);
    await page.getByRole("heading", { name: "Events", exact: true }).waitFor({ timeout: 20000 });
    await sleep(1400);
    for (const name of ["Mehndi", "Sangeet", "Reception"]) {
      await d.glide(`h3:has-text("${name}")`, 700).catch(() => {});
      await sleep(1100);
    }
    await sleep(900);
  },

  /** Seating: pick the Reception, glide across the populated tables around the
   *  dance floor, then drag an unassigned guest onto a table. */
  async seating(d, page) {
    await page.goto(`${APP}/seating`);
    await page.getByRole("heading", { name: "Seating Chart" }).waitFor({ timeout: 20000 });
    await sleep(900);
    await d.selectByLabel('select[aria-label="Select event"]', "Reception");
    await page.locator('text=Head Table').first().waitFor({ timeout: 15000 }).catch(() => {});
    await sleep(1300);
    // sweep the layout
    for (const t of ["Head Table", "Table 2", "Table 5", "Table 7"]) {
      await d.glide(`text=${t}`, 650).catch(() => {});
      await sleep(700);
    }
    await sleep(400);
    // drag one unassigned guest onto a table
    await d.dragGuest('[aria-roledescription="draggable"]', 'text=Table 4').catch(() => {});
    await sleep(1600);
  },

  /** Import: drop a spreadsheet, map, preview, and bulk-add guests. */
  async import(d, page) {
    await page.goto(`${APP}/guests`);
    await page.getByRole("heading", { name: "Guest List" }).waitFor({ timeout: 20000 });
    await sleep(1000);
    await d.click('button:has-text("Import")');
    await page.getByRole("heading", { name: "Import Guests" }).waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(900);
    await d.dropFiles('text=/drag|drop|upload/i', 'input[type="file"]', IMPORT_CSV);
    await page.locator('text=/Found \\d+ guests/i').first().waitFor({ timeout: 15000 }).catch(() => {});
    await sleep(1600);
    await d.click('button:has-text("Preview Import")').catch(() => {});
    await sleep(1600);
    // confirm — target by dynamic count so we don't hit the toolbar's Import button
    const confirm = page.getByRole("button", { name: /Import \d+ Guests/ });
    await confirm.waitFor({ timeout: 8000 }).catch(() => {});
    const cb = await confirm.boundingBox().catch(() => null);
    if (cb) {
      await d.glideTo(cb.x + cb.width / 2, cb.y + cb.height / 2, 550);
      await sleep(260);
      await confirm.click({ delay: 70 }).catch(() => {});
    }
    await page.locator('text=/Import Complete/i').first().waitFor({ timeout: 20000 }).catch(() => {});
    await sleep(2000);
  },

  /** Photos: the live shot-list queue — current group banner, then up-next. */
  async photos(d, page) {
    await page.goto(`${APP}/photos`);
    await page.getByRole("heading", { name: "Photo Groups" }).waitFor({ timeout: 20000 });
    await sleep(1400);
    await d.glide('text=Current group', 700).catch(() => {});
    await sleep(1400);
    await d.wheel(360, 800);
    await sleep(900);
    await d.glide('text=Queue', 650).catch(() => {});
    await sleep(1800);
  },

  /** Games: vote stats, per-question tallies, and the live leaderboard. */
  async games(d, page) {
    await page.goto(`${APP}/bets`);
    await page.getByRole("heading", { name: "Bets & Games" }).waitFor({ timeout: 20000 });
    await sleep(1400);
    await d.glideTo(SIZE.width * 0.5, SIZE.height * 0.32, 650);
    await sleep(1200);
    await d.wheel(420, 850);
    await sleep(1200);
    await d.glide('text=Top players', 700).catch(() => {});
    await sleep(2000);
  },
};

// ───────────────────────────── main ─────────────────────────────

if (!existsSync(AUTH)) {
  console.error(`missing ${AUTH} — run: node demo-video/scripts/bootstrap-auth.mjs`);
  process.exit(1);
}
mkdirSync(CLIPS, { recursive: true });
const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(scenes);

for (const name of names) {
  if (!scenes[name]) { console.error(`unknown scene ${name}`); process.exit(1); }
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    deviceScaleFactor: 1,
    recordVideo: { dir: CLIPS, size: SIZE },
    colorScheme: "light",
    storageState: AUTH,
  });
  await context.addInitScript(CURSOR_INIT);
  await context.addInitScript(() => localStorage.setItem("phera-onboarding-complete", "true"));
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`  pageerror: ${e.message}`));
  console.log(`▶ ${name}`);
  const d = new Director(page);
  try {
    await scenes[name](d, page);
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
  }
  const video = page.video();
  await context.close();
  const path = await video.path();
  renameSync(path, join(CLIPS, `${name}.webm`));
  writeFileSync(join(CLIPS, `${name}.events.json`), JSON.stringify(d.events, null, 2));
  await browser.close();
  console.log(`  ✓ out/clips/${name}.webm (+events.json)`);
}
console.log("done:", readdirSync(CLIPS).join(", "));
