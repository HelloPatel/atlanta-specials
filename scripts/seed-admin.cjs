/*
 * Admin-side seed script for the atlanta-specials (Phera) Firestore project.
 *
 * Seeds a realistic 315-person Indian wedding (guests + events + a seating
 * layout with a head table, estate tables, staggered rounds, a dance floor,
 * stage/DJ booth and bar) into the test account's wedding so the app shows
 * real data for demos and screen recordings.
 *
 * The service-account key is a SECRET and must never be committed. Point to it
 * with the SEED_KEY env var, or it falls back to the local session folder path.
 *
 *   node scripts/seed-admin.cjs
 *   SEED_EMAIL=someone@example.com node scripts/seed-admin.cjs
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const KEY_PATH =
  process.env.SEED_KEY ||
  'C:/Users/patelrushi/.copilot/session-state/4334c45c-4672-45f1-8cf4-0af6be8d8506/files/serviceAccountKey.json';

const TEST_EMAIL = process.env.SEED_EMAIL || 'patel.rushi512@gmail.com';

// ─── Reuse the exact generateGuests() from src/pages/SeedData.jsx ────────────
// This keeps the seeded dataset identical to the in-app seeder.
function loadGenerateGuests() {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'pages', 'SeedData.jsx'),
    'utf8'
  );
  const start = src.indexOf('function generateGuests()');
  const end = src.indexOf('export default');
  if (start === -1 || end === -1) {
    throw new Error('Could not locate generateGuests() in SeedData.jsx');
  }
  const body = src.slice(start, end);
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\nreturn generateGuests;`)();
}

// ─── Event templates (mirrors constants.js EVENT_TEMPLATES) ──────────────────
const EVENTS = [
  { name: 'Mehndi', dressCode: 'Colorful / Traditional', daysBefore: 3 },
  { name: 'Sangeet', dressCode: 'Semi-formal / Festive', daysBefore: 2 },
  { name: 'Haldi', dressCode: 'Yellow / White', daysBefore: 1 },
  { name: 'Wedding Ceremony', dressCode: 'Formal Indian Attire', daysBefore: 0 },
  { name: 'Reception', dressCode: 'Formal / Cocktail', daysBefore: 0 },
];

// ─── Build a Phera-convention seating layout ─────────────────────────────────
// Conventions: head table TOP, stage/DJ BOTTOM (opposite head table), rounds
// staggered on the sides for viewing angles, plus dance floor and bar zones.
function buildSeatingLayout() {
  const tables = [];
  const CANVAS_W = 1200;
  const cx = CANVAS_W / 2;

  // Head table — top center (estate / rectangular sweetheart-plus-family table)
  tables.push({
    id: 'table_head',
    label: 'Head Table',
    shape: 'estate',
    seats: 12,
    x: cx - 130,
    y: 40,
    width: 260,
    height: 90,
    rotation: 0,
  });

  // Staggered round tables down both sides (viewing angles toward head table).
  let n = 1;
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const rowY = 220 + r * 150;
    const stagger = r % 2 === 0 ? 0 : 60;
    // left column
    tables.push({
      id: `table_${n}`,
      label: `Table ${n}`,
      shape: 'round',
      seats: 10,
      x: 180 + stagger,
      y: rowY,
      width: 120,
      height: 120,
      rotation: 0,
    });
    n++;
    // left-inner column
    tables.push({
      id: `table_${n}`,
      label: `Table ${n}`,
      shape: 'round',
      seats: 10,
      x: 360 + stagger,
      y: rowY + 40,
      width: 120,
      height: 120,
      rotation: 0,
    });
    n++;
    // right-inner column
    tables.push({
      id: `table_${n}`,
      label: `Table ${n}`,
      shape: 'round',
      seats: 10,
      x: CANVAS_W - 480 - stagger,
      y: rowY + 40,
      width: 120,
      height: 120,
      rotation: 0,
    });
    n++;
    // right column
    tables.push({
      id: `table_${n}`,
      label: `Table ${n}`,
      shape: 'round',
      seats: 10,
      x: CANVAS_W - 300 - stagger,
      y: rowY,
      width: 120,
      height: 120,
      rotation: 0,
    });
    n++;
  }

  // A few estate tables near the front for extended family.
  tables.push({
    id: 'table_estate_l',
    label: 'Family Estate A',
    shape: 'estate',
    seats: 14,
    x: cx - 300,
    y: 150,
    width: 200,
    height: 80,
    rotation: 0,
  });
  tables.push({
    id: 'table_estate_r',
    label: 'Family Estate B',
    shape: 'estate',
    seats: 14,
    x: cx + 100,
    y: 150,
    width: 200,
    height: 80,
    rotation: 0,
  });

  // Zones — dance floor center, stage/DJ at the BOTTOM (opposite head table),
  // bar to the side. Use both spellings-safe canonical types.
  const zones = [
    {
      id: 'zone_dancefloor',
      type: 'dance-floor',
      label: 'Dance Floor',
      x: cx - 160,
      y: 620,
      width: 320,
      height: 220,
    },
    {
      id: 'zone_stage',
      type: 'stage',
      label: 'Stage / DJ Booth',
      x: cx - 170,
      y: 870,
      width: 340,
      height: 110,
    },
    {
      id: 'zone_bar',
      type: 'bar',
      label: 'Bar',
      x: 60,
      y: 700,
      width: 110,
      height: 200,
    },
    {
      id: 'zone_entrance',
      type: 'entrance',
      label: 'Entrance',
      x: CANVAS_W - 180,
      y: 900,
      width: 140,
      height: 80,
    },
  ];

  return { tables, zones };
}

async function main() {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`Service account key not found at: ${KEY_PATH}`);
    console.error('Set SEED_KEY to the absolute path of the key JSON.');
    process.exit(1);
  }

  const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  initializeApp({ credential: cert(key) });
  const auth = getAuth();
  const db = getFirestore();

  console.log(`Project: ${key.project_id}`);

  // 1. Resolve the test user.
  let user;
  try {
    user = await auth.getUserByEmail(TEST_EMAIL);
  } catch (e) {
    console.error(`Could not find auth user ${TEST_EMAIL}: ${e.message}`);
    process.exit(1);
  }
  console.log(`User: ${user.email} (uid ${user.uid})`);

  // 2. Find (or create) a wedding owned by this user.
  const weddingsRef = db.collection('weddings');
  let weddingSnap = await weddingsRef.where('ownerId', '==', user.uid).limit(1).get();

  let weddingId;
  if (weddingSnap.empty) {
    const docRef = await weddingsRef.add({
      ownerId: user.uid,
      coupleName1: 'Priya',
      coupleName2: 'Arjun',
      weddingDate: '2026-03-14',
      city: 'Atlanta, GA',
      venue: 'The Estate at Atlanta',
      slug: 'priya-and-arjun',
      settings: { rsvpOpen: true, publicWebsite: false, theme: 'classic', language: 'en' },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    weddingId = docRef.id;
    console.log(`Created new wedding ${weddingId} (Priya & Arjun)`);
  } else {
    weddingId = weddingSnap.docs[0].id;
    const w = weddingSnap.docs[0].data();
    console.log(`Using existing wedding ${weddingId} (${w.coupleName1 || '?'} & ${w.coupleName2 || '?'})`);
  }

  const weddingRef = weddingsRef.doc(weddingId);

  // 3. Seed events (idempotent — clear existing first).
  const eventsCol = weddingRef.collection('events');
  const existingEvents = await eventsCol.get();
  if (!existingEvents.empty) {
    const del = db.batch();
    existingEvents.docs.forEach((d) => del.delete(d.ref));
    await del.commit();
  }
  const base = new Date('2026-03-14T17:00:00');
  const eventIds = [];
  for (const ev of EVENTS) {
    const d = new Date(base);
    d.setDate(base.getDate() - ev.daysBefore);
    const ref = eventsCol.doc();
    eventIds.push(ref.id);
    await ref.set({
      name: ev.name,
      date: d.toISOString().slice(0, 10),
      dressCode: ev.dressCode,
      venue: 'The Estate at Atlanta',
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`Seeded ${EVENTS.length} events.`);

  // 4. Seed guests (clear existing, then batch-write with some RSVP status).
  const generateGuests = loadGenerateGuests();
  const guests = generateGuests();
  console.log(`Generated ${guests.length} guests.`);

  const guestsCol = weddingRef.collection('guests');
  const existingGuests = await guestsCol.get();
  if (!existingGuests.empty) {
    // delete in chunks of 450
    for (let i = 0; i < existingGuests.docs.length; i += 450) {
      const del = db.batch();
      existingGuests.docs.slice(i, i + 450).forEach((d) => del.delete(d.ref));
      await del.commit();
    }
    console.log(`Cleared ${existingGuests.size} existing guests.`);
  }

  // Give guests realistic RSVP statuses across the main events.
  const statuses = ['attending', 'attending', 'attending', 'pending', 'declined'];
  for (let i = 0; i < guests.length; i += 450) {
    const chunk = guests.slice(i, i + 450);
    const batch = db.batch();
    chunk.forEach((guest, idx) => {
      const rsvpStatus = {};
      eventIds.forEach((eid, j) => {
        rsvpStatus[eid] = statuses[(i + idx + j) % statuses.length];
      });
      const ref = guestsCol.doc();
      batch.set(ref, { ...guest, rsvpStatus, createdAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log(`  wrote ${Math.min(i + 450, guests.length)} / ${guests.length}`);
  }
  console.log(`Seeded ${guests.length} guests.`);

  // 5. Seed a seating layout doc (Phera conventions).
  const layout = buildSeatingLayout();
  await weddingRef.collection('seating').doc('main').set({
    name: 'Reception Floor Plan',
    tables: layout.tables,
    zones: layout.zones,
    canvasWidth: 1200,
    canvasHeight: 1050,
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log(`Seeded seating layout: ${layout.tables.length} tables, ${layout.zones.length} zones.`);

  console.log('\nDone. Wedding ready for demo/recording.');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
