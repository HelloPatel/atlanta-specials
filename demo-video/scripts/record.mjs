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
import { existsSync, mkdirSync, renameSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));      // demo-video/
const REPO = dirname(ROOT);                                        // repo root
const CLIPS = join(ROOT, "out", "clips");
const FIXTURES = join(ROOT, "fixtures");
const IMPORT_CSV = join(FIXTURES, "import-guests.csv");
const AUTH = join(REPO, ".playwright", "auth.json");
const APP = process.env.DEMO_URL ?? "http://localhost:5173";
// The public guest-view beat needs a real, seeded weddingId. Emulator data is
// ephemeral, so bootstrap-data.mjs writes the freshly-seeded id here each run.
const WEDDING_ID = (process.env.DEMO_WEDDING_ID
  ?? (existsSync(join(ROOT, "out", "wedding-id.txt"))
    ? readFileSync(join(ROOT, "out", "wedding-id.txt"), "utf8")
    : "")).trim();
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

// Scripted overlay layer: lower-third captions, a spotlight ring that frames the
// element being acted on, click ripples, and output callout badges. Re-injected on
// every navigation so it survives page.goto across the walkthrough routes.
const OVERLAY_INIT = `
(() => {
  const ID = "__demo_overlay";
  const ensure = () => {
    let root = document.getElementById(ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ID;
    root.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif";
    const style = document.createElement("style");
    style.textContent = [
      "@keyframes __demo_ring{0%{box-shadow:0 0 0 3px rgba(158,42,80,.55),0 0 0 9999px rgba(15,10,20,.14)}70%{box-shadow:0 0 0 6px rgba(158,42,80,.15),0 0 0 9999px rgba(15,10,20,.14)}100%{box-shadow:0 0 0 3px rgba(158,42,80,.55),0 0 0 9999px rgba(15,10,20,.14)}}",
      "@keyframes __demo_rip{0%{opacity:.55;transform:translate(-50%,-50%) scale(.2)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}",
      "@keyframes __demo_pop{0%{opacity:0;transform:translateY(6px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}",
    ].join("");
    root.appendChild(style);
    document.documentElement.appendChild(root);
    return root;
  };
  const el = (tag, css) => { const n = document.createElement(tag); n.style.cssText = css; return n; };

  // Navigation "curtain": an eager, opaque full-viewport wash injected at
  // document-start so it masks the white reload paint on every page.goto. The
  // Director fades it out once the destination has mounted — turning the hard
  // reload flash between beats into a soft ivory crossfade.
  const curtainEnsure = () => {
    let c = document.getElementById("__demo_curtain");
    if (c) return c;
    if (!document.body) return null;                   // body not parsed yet — caller retries
    c = document.createElement("div");
    c.id = "__demo_curtain";
    c.style.cssText = "position:fixed;inset:0;z-index:2147483645;pointer-events:none;opacity:1;transition:opacity .55s ease;background:radial-gradient(130% 130% at 50% 30%, #fbf7f6 0%, #f4e8e7 52%, #ecd9dd 100%)";
    document.body.appendChild(c);
    return c;
  };

  const api = {
    say(text) {
      const root = ensure();
      let cap = document.getElementById("__demo_cap");
      if (!text) { if (cap) cap.style.opacity = "0"; return; }
      if (!cap) {
        cap = el("div", "position:absolute;left:50%;bottom:8.5%;transform:translateX(-50%);max-width:74%;display:flex;align-items:center;gap:12px;padding:14px 22px;border-radius:16px;background:rgba(17,12,20,.82);backdrop-filter:blur(10px);color:#fff;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-.01em;box-shadow:0 12px 40px rgba(0,0,0,.35);opacity:0;transition:opacity .45s ease;white-space:nowrap");
        cap.id = "__demo_cap";
        const dot = el("span", "flex:0 0 auto;width:11px;height:11px;border-radius:50%;background:#e0568a;box-shadow:0 0 0 4px rgba(224,86,138,.25)");
        const txt = el("span", ""); txt.id = "__demo_cap_txt";
        cap.appendChild(dot); cap.appendChild(txt);
        root.appendChild(cap);
      }
      document.getElementById("__demo_cap_txt").textContent = text;
      cap.style.opacity = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => { cap.style.opacity = "1"; }));
    },
    ring(r) {
      const root = ensure();
      let ring = document.getElementById("__demo_ring");
      if (!r) { if (ring) ring.style.opacity = "0"; return; }
      if (!ring) {
        ring = el("div", "position:absolute;border-radius:14px;transition:all .5s cubic-bezier(.32,.72,0,1);opacity:0;animation:__demo_ring 1.8s ease-in-out infinite");
        ring.id = "__demo_ring";
        root.appendChild(ring);
      }
      const pad = 8;
      ring.style.left = (r.x - pad) + "px";
      ring.style.top = (r.y - pad) + "px";
      ring.style.width = (r.width + pad * 2) + "px";
      ring.style.height = (r.height + pad * 2) + "px";
      ring.style.opacity = "1";
    },
    badge(r, text, side) {
      const root = ensure();
      let b = document.getElementById("__demo_badge");
      if (b) b.remove();
      if (!r || !text) return;
      b = el("div", "position:absolute;display:flex;align-items:center;gap:8px;padding:9px 15px;border-radius:12px;background:#fff;color:#7a1e3c;font-size:20px;font-weight:700;letter-spacing:-.01em;box-shadow:0 10px 30px rgba(122,30,60,.28),0 0 0 1px rgba(122,30,60,.12);animation:__demo_pop .4s cubic-bezier(.32,.72,0,1) both");
      b.id = "__demo_badge";
      const check = el("span", "flex:0 0 auto;display:inline-flex;width:20px;height:20px;border-radius:50%;background:#16a34a;color:#fff;align-items:center;justify-content:center;font-size:13px;font-weight:900");
      check.textContent = "\\u2713";
      const t = el("span", ""); t.textContent = text;
      b.appendChild(check); b.appendChild(t);
      root.appendChild(b);
      const bw = 260, bh = 40;
      let bx = r.x + r.width + 14, by = r.y + r.height / 2 - bh / 2;
      if (side === "left") bx = r.x - bw - 14;
      if (side === "top") { bx = r.x + r.width / 2 - bw / 2; by = r.y - bh - 14; }
      if (side === "bottom") { bx = r.x + r.width / 2 - bw / 2; by = r.y + r.height + 14; }
      b.style.left = Math.max(16, bx) + "px";
      b.style.top = Math.max(16, by) + "px";
    },
    ripple(x, y) {
      const root = ensure();
      const rp = el("div", "position:absolute;left:" + x + "px;top:" + y + "px;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,rgba(224,86,138,.5),rgba(224,86,138,0) 70%);animation:__demo_rip .6s ease-out forwards");
      root.appendChild(rp);
      setTimeout(() => rp.remove(), 650);
    },
    clear() { this.ring(null); this.badge(null); },
    /** Show (opaque) or hide (transparent) the navigation curtain. */
    curtain(show) {
      const c = curtainEnsure();
      if (c) c.style.opacity = show ? "1" : "0";
      // Once revealing, drop the document-start ivory wash so it can't tint content.
      if (!show) { try { document.documentElement.style.background = ""; } catch (e) {} }
    },
  };
  window.__demo = api;
  // Mask the white reload paint WITHOUT corrupting the parse: paint <html> ivory via a
  // style *property* (no node appended at document-start), then build the real opaque
  // curtain node once <body> exists so reveal() can crossfade it out.
  try { document.documentElement.style.background = "radial-gradient(130% 130% at 50% 30%, #fbf7f6 0%, #f4e8e7 52%, #ecd9dd 100%)"; } catch (e) {}
  const curtainBoot = () => { curtainEnsure(); ensure(); };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", curtainBoot);
  else curtainBoot();
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
  /** Show / update the scripted lower-third caption. Pass "" to hide. */
  async say(text, hold = 0) {
    await this.page.evaluate((t) => window.__demo?.say(t), text).catch(() => {});
    if (hold) await sleep(hold);
  }
  /** Clear ring + badge highlights. */
  async clear() {
    await this.page.evaluate(() => window.__demo?.clear()).catch(() => {});
  }
  async cover() {
    await this.page.evaluate(() => window.__demo?.curtain(true)).catch(() => {});
  }
  async reveal() {
    await this.page.evaluate(() => window.__demo?.curtain(false)).catch(() => {});
  }
  /** Masked navigation between beats. Fades an opaque curtain over the current
   *  page, hard-navigates, waits for the destination heading to paint UNDER the
   *  curtain, then fades the curtain out — so the white document-reload flash is
   *  never on screen. Preserves the existing goto-per-beat pattern, just hidden. */
  async go(path, { heading = null, wait = null, revealDelay = 340 } = {}) {
    await this.say("");
    await this.clear();
    await this.cover();
    await sleep(360);                                   // dim outgoing page to ivory
    await this.page.goto(`${APP}${path}`, { waitUntil: "domcontentloaded" });
    // the fresh document's curtain is already opaque; hold it while React mounts.
    if (heading) {
      await this.page.getByRole("heading", heading).first().waitFor({ timeout: 20000 }).catch(() => {});
    } else if (wait) {
      await this.page.locator(wait).first().waitFor({ timeout: 20000 }).catch(() => {});
    }
    await sleep(revealDelay);                           // let content settle behind it
    await this.reveal();
    await sleep(560);                                   // curtain fade-out duration
  }
  async _box(selector) {
    const el = this.page.locator(selector).first();
    await el.waitFor({ state: "visible", timeout: 15000 });
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(120);
    return { el, box: await el.boundingBox() };
  }
  /** Glide to an element and frame it with the spotlight ring. */
  async focus(selector, { ms = 650, label = null, side = "right", hold = 0 } = {}) {
    const el = await this.glide(selector, ms);
    const box = await el.boundingBox();
    if (box) {
      await this.page.evaluate((r) => window.__demo?.ring(r), box).catch(() => {});
      if (label) await this.page.evaluate(([r, t, s]) => window.__demo?.badge(r, t, s), [box, label, side]).catch(() => {});
    }
    if (hold) await sleep(hold);
    return el;
  }
  /** Pin an output callout badge on an element (highlights a result). */
  async callout(selector, text, { side = "right", hold = 0 } = {}) {
    try {
      const { box } = await this._box(selector);
      if (box) await this.page.evaluate(([r, t, s]) => window.__demo?.badge(r, t, s), [box, text, side]);
    } catch { /* element gone — skip */ }
    if (hold) await sleep(hold);
  }
  async ripple() {
    await this.page.evaluate(([x, y]) => window.__demo?.ripple(x, y), [this.x, this.y]).catch(() => {});
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
  async click(selector, { pause = 260, ms = 600, force = false, ring = true } = {}) {
    const el = await this.glide(selector, ms);
    if (ring) {
      const box = await el.boundingBox();
      if (box) await this.page.evaluate((r) => window.__demo?.ring(r), box).catch(() => {});
    }
    await sleep(pause);
    await this.ripple();
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

// ── feature choreographies ──────────────────────────────────────────────
// Each is a self-contained, captioned walkthrough of one product area, driven
// on the REAL app UI. The hero scene chains them into a single flow; the tile
// scenes reuse one apiece. `lead` overrides the opening caption so a tile can
// frame itself, while the hero uses overarching, benefit-led copy.

const feature = {
  async dashboard(d, page, { lead = "One home base for the entire wedding" } = {}) {
    await d.go("/dashboard", { heading: { name: "Priya & Arjun" } });
    await sleep(300);
    await d.say(lead, 1500);
    await d.focus('button:has-text("Guests")', { label: "Total guests", side: "bottom", hold: 700 });
    await d.focus('button:has-text("Seated")', { hold: 550 });
    await d.focus('button:has-text("RSVP Rate")', { label: "RSVPs, live", side: "bottom", hold: 900 });
    await d.clear();
    await d.say("Live guest analytics — at a glance", 400);
    await d.wheel(520, 900);
    await sleep(700);
    await d.focus('text=Dietary Breakdown', { label: "Auto-tallied", side: "right", hold: 1600 }).catch(() => {});
    await d.clear();
  },

  async guests(d, page, { lead = "Every guest, organized in one place" } = {}) {
    await d.go("/guests", { heading: { name: "Guest List" } });
    await sleep(300);
    await d.say(lead, 1400);
    await d.glideTo(SIZE.width / 2, SIZE.height * 0.5, 650);
    await sleep(500);
    await d.say("Search hundreds of guests instantly", 300);
    await d.type('input[placeholder="Search guests..."]', "Sharma", { perChar: 95 });
    await sleep(600);
    await d.callout('input[placeholder="Search guests..."]', "Filtered as you type", { side: "bottom", hold: 1900 });
    await d.clear();
  },

  async events(d, page, { lead = "A timeline for every ceremony" } = {}) {
    await d.go("/events", { heading: { name: "Events", exact: true } });
    await sleep(300);
    await d.say(lead, 1300);
    const scopes = { Haldi: "Close family only", Mehndi: "Its own invite list", Sangeet: "Everyone's invited" };
    for (const name of ["Haldi", "Mehndi", "Sangeet"]) {
      await d.focus(`h3:has-text("${name}")`, { label: scopes[name], side: "right", hold: 1150 }).catch(() => {});
    }
    await d.clear();
    await d.say("Each event keeps its own guest list", 1500);
    await d.clear();
    await sleep(300);
  },

  async seating(d, page, { lead = "Drag-and-drop seating charts" } = {}) {
    await d.go("/seating", { heading: { name: "Seating Chart" } });
    await sleep(300);
    await d.say(lead, 900);
    await d.selectByLabel('select[aria-label="Select event"]', "Reception");
    await page.locator('text=Head Table').first().waitFor({ timeout: 15000 }).catch(() => {});
    await sleep(800);
    await d.say("Visual tables, laid out like the venue", 300);
    for (const t of ["Head Table", "Table 3", "Table 6"]) {
      await d.focus(`text=${t}`, { ms: 680, hold: 820 }).catch(() => {});
    }
    await d.clear();
    await d.say("Drag any guest to a seat", 500);
    await d.dragGuest('[aria-roledescription="draggable"]', 'text=Table 4').catch(() => {});
    await d.callout('text=Table 4', "Seated instantly", { side: "right", hold: 1700 }).catch(() => {});
    await d.clear();
  },

  async import(d, page, { lead = "Import your whole list in seconds" } = {}) {
    await d.go("/guests", { heading: { name: "Guest List" } });
    await sleep(300);
    await d.say(lead, 900);
    await d.click('button:has-text("Import")');
    await page.getByRole("heading", { name: "Import Guests" }).waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(700);
    await d.say("Drop a spreadsheet — CSV or Excel", 400);
    await d.dropFiles('text=/drag|drop|upload/i', 'input[type="file"]', IMPORT_CSV);
    const found = page.locator('text=/Found \\d+ guests/i').first();
    await found.waitFor({ timeout: 15000 }).catch(() => {});
    let foundTxt = "Guests detected";
    try {
      const raw = (await found.textContent())?.trim() || "";
      foundTxt = (raw.match(/Found\s+\d+\s+guests/i) || [raw])[0];
    } catch {}
    await d.callout('text=/Found \\d+ guests/i', foundTxt, { side: "bottom", hold: 1500 }).catch(() => {});
    await d.clear();
    await d.click('button:has-text("Preview Import")').catch(() => {});
    await sleep(500);
    await d.say("Preview and confirm", 900);
    const confirm = page.getByRole("button", { name: /Import \d+ Guests/ });
    await confirm.waitFor({ timeout: 8000 }).catch(() => {});
    const cb = await confirm.boundingBox().catch(() => null);
    if (cb) {
      await d.glideTo(cb.x + cb.width / 2, cb.y + cb.height / 2, 520);
      await d.page.evaluate((r) => window.__demo?.ring(r), cb).catch(() => {});
      await sleep(240);
      await d.ripple();
      await confirm.click({ delay: 70 }).catch(() => {});
    }
    await page.locator('text=/Import Complete/i').first().waitFor({ timeout: 20000 }).catch(() => {});
    await d.clear();
    await d.say("Done — 136 guests added", 2100);
    await d.clear();
  },

  async photos(d, page, { lead = "A shot list your photographer will love" } = {}) {
    await d.go("/photos", { heading: { name: "Photo Groups" } });
    await sleep(300);
    await d.say(lead, 1300);
    await d.focus('text=Current group', { label: "On deck now", side: "right", hold: 1400 }).catch(() => {});
    await d.clear();
    await d.say("The queue keeps the day moving", 300);
    await d.wheel(360, 800);
    await sleep(500);
    await d.focus('text=Queue', { hold: 1600 }).catch(() => {});
    await d.clear();
  },

  async games(d, page, { lead = "Keep guests engaged with live games" } = {}) {
    await d.go("/bets", { heading: { name: "Bets & Games" } });
    await sleep(300);
    await d.say(lead, 1300);
    await d.glideTo(SIZE.width * 0.5, SIZE.height * 0.34, 600);
    await sleep(700);
    await d.say("Guests vote from their phones", 300);
    await d.wheel(420, 850);
    await sleep(600);
    await d.focus('text=Top players', { label: "Live leaderboard", side: "right", hold: 1900 }).catch(() => {});
    await d.clear();
  },

  // The guest-facing public RSVP — proves the couple's work becomes a real page
  // guests use, on any device. Needs a seeded, published weddingId (WEDDING_ID).
  async guestView(d, page, { lead = "And this is what your guests see" } = {}) {
    if (!WEDDING_ID) { console.log("  (guestView skipped — no DEMO_WEDDING_ID / out/wedding-id.txt)"); return; }
    await d.go(`/rsvp/${WEDDING_ID}`, { wait: 'input[placeholder="Enter your first or last name"]' });
    await sleep(400);
    await d.say(lead, 1600);
    await d.glideTo(SIZE.width / 2, SIZE.height * 0.46, 650);
    await sleep(400);
    await d.say("They find their family in one search", 500);
    await d.type('input[placeholder="Enter your first or last name"]', "Mehta", { perChar: 95 }).catch(() => {});
    await sleep(500);
    await d.click('button:has-text("Search")').catch(() => {});
    await sleep(900);
    await d.callout('text=/Mehta Family|Mehta/i', "One tap to RSVP — per event", { side: "right", hold: 2100 }).catch(() => {});
    await d.clear();
  },
};

const scenes = {
  /** HERO — one continuous ~70–85s walkthrough of the whole product, captioned
   *  and highlighted end to end. Ends back on the dashboard for a clean loop. */
  async hero(d, page) {
    await feature.dashboard(d, page, { lead: "Plan the whole wedding in one place" });
    await feature.import(d, page, { lead: "Start by importing your whole guest list" });
    await feature.events(d, page, { lead: "A timeline for every ceremony" });
    await feature.seating(d, page, { lead: "Seat everyone with drag-and-drop" });
    await feature.photos(d, page, { lead: "Never miss a must-have photo" });
    await feature.guestView(d, page, { lead: "And this is what your guests see" });
    // full circle — land back on the dashboard countdown
    await d.go("/dashboard", { heading: { name: "Priya & Arjun" } });
    await d.say("Phera — everything for the big day", 300);
    await d.glideTo(SIZE.width / 2, SIZE.height * 0.32, 700);
    await sleep(2200);
    await d.clear();
  },

  async events(d, page) { await feature.events(d, page); },
  async seating(d, page) { await feature.seating(d, page); },
  async import(d, page) { await feature.import(d, page); },
  async photos(d, page) { await feature.photos(d, page); },
  async games(d, page) { await feature.games(d, page); },
  async guestView(d, page) { await feature.guestView(d, page); },
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
  await context.addInitScript(OVERLAY_INIT);
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
