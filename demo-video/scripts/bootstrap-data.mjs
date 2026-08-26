// Seeds events, seating, games (bets) and photo groups for the demo wedding
// directly against the local Firebase emulators using the Firebase Web SDK,
// signed in as the demo owner so security rules pass.
//   node demo-video/scripts/bootstrap-data.mjs
import { initializeApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore, connectFirestoreEmulator,
  collection, doc, getDoc, getDocs, setDoc, writeBatch, serverTimestamp,
  query, where, limit,
} from "firebase/firestore";
import { generateReceptionLayout } from "../../src/components/seating/seatingLayouts.js";

const cred = {
  email: process.env.E2E_EMAIL ?? "demo@phera.app",
  password: process.env.E2E_PASSWORD ?? "DemoPass123!",
};

const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-phera.firebaseapp.com",
  projectId: "demo-phera",
  storageBucket: "demo-phera.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:e2e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const pick = (arr, n) => arr.slice(0, n);
const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

function toPublicEvent(e) {
  return {
    name: e.name || "", date: e.date || "", startTime: e.startTime || "",
    endTime: e.endTime || "", venue: e.venue || "", address: e.address || "",
    dressCode: e.dressCode || "", description: e.description || "",
    inviteAll: e.inviteAll !== undefined ? e.inviteAll : true,
    guestIds: e.guestIds || [], order: e.order || 0, updatedAt: serverTimestamp(),
  };
}

async function addEvent(weddingId, event) {
  const ref = doc(collection(db, "weddings", weddingId, "events"));
  const priv = { ...event, createdAt: serverTimestamp() };
  const batch = writeBatch(db);
  batch.set(ref, priv);
  batch.set(doc(db, "publicWeddings", weddingId, "events", ref.id), toPublicEvent(priv));
  await batch.commit();
  return ref.id;
}

async function saveSeating(weddingId, eventId, data) {
  const batch = writeBatch(db);
  batch.set(doc(db, "weddings", weddingId, "seating", eventId),
    { ...data, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(doc(db, "weddings", weddingId, "publicSeating", eventId), {
    tables: (data.tables || []).map((t) => ({
      id: t.id, name: t.name || "", capacity: t.capacity || 0,
      assignedGuests: t.assignedGuests || [],
    })),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

async function main() {
  const { user } = await signInWithEmailAndPassword(auth, cred.email, cred.password);
  console.log("\u2713 signed in", user.uid);

  const wsnap = await getDocs(query(collection(db, "weddings"), where("ownerId", "==", user.uid), limit(1)));
  if (wsnap.empty) throw new Error("no wedding for demo user — run bootstrap-auth first");
  const weddingId = wsnap.docs[0].id;
  console.log("\u2713 wedding", weddingId);

  const gsnap = await getDocs(collection(db, "weddings", weddingId, "guests"));
  const guests = gsnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const brideIds = guests.filter((g) => g.side === "bride").map((g) => g.id);
  const groomIds = guests.filter((g) => g.side === "groom").map((g) => g.id);
  const allIds = guests.map((g) => g.id);
  const names = guests.map((g) => `${g.firstName || ""} ${g.lastName || ""}`.trim()).filter(Boolean);
  console.log(`  ${guests.length} guests (${brideIds.length} bride / ${groomIds.length} groom)`);

  // ---- Events -------------------------------------------------------------
  const eventDefs = [
    { name: "Mehndi", date: "2027-10-14", startTime: "16:00", endTime: "20:00",
      venue: "Rangoli Lawns", address: "Sandy Springs, Atlanta, GA",
      dressCode: "Colorful / Traditional",
      description: "Intimate mehndi afternoon for the bride's close family and friends.",
      inviteAll: false, guestIds: brideIds, order: 0 },
    { name: "Sangeet", date: "2027-10-15", startTime: "19:00", endTime: "23:30",
      venue: "The Grand Ballroom", address: "Downtown Atlanta, GA",
      dressCode: "Semi-formal / Festive",
      description: "A night of music, dance performances and dinner for everyone.",
      inviteAll: true, guestIds: [], order: 1 },
    { name: "Reception", date: "2027-10-16", startTime: "19:00", endTime: "23:59",
      venue: "Atlanta Marriott Marquis", address: "265 Peachtree Center Ave NE, Atlanta, GA",
      dressCode: "Formal / Cocktail",
      description: "Grand reception dinner celebrating Priya & Arjun.",
      inviteAll: false, guestIds: pick(allIds, 170), order: 2 },
  ];
  const eventIds = {};
  for (const def of eventDefs) eventIds[def.name] = await addEvent(weddingId, def);
  console.log("\u2713 events:", Object.keys(eventIds).join(", "));

  // ---- Seating (Reception) -----------------------------------------------
  const { tables, zones } = generateReceptionLayout(9);
  const receptionIds = pick(allIds, 170);
  let cursor = 0;
  const seatedTables = tables.map((t) => {
    if (t.isHeadTable) {
      const take = receptionIds.slice(cursor, cursor + 6); cursor += 6;
      return { ...t, assignedGuests: take };
    }
    const seats = Math.min(t.capacity || 8, 8);
    const take = receptionIds.slice(cursor, cursor + seats); cursor += seats;
    return { ...t, assignedGuests: take };
  });
  await saveSeating(weddingId, eventIds.Reception, { tables: seatedTables, zones, rules: [] });
  console.log(`\u2713 seating: ${seatedTables.length} tables, ${cursor} guests seated`);

  // ---- Games (bets) -------------------------------------------------------
  const questions = [
    { id: "q1", section: "Ceremony", text: "Who cries first at the ceremony?", options: ["Priya", "Arjun", "Both", "Neither"], order: 0 },
    { id: "q2", section: "Ceremony", text: "Will the baraat arrive on time?", options: ["Yes", "No"], order: 1 },
    { id: "q3", section: "Reception", text: "First dance — choreographed or freestyle?", options: ["Choreographed", "Freestyle"], order: 2 },
    { id: "q4", section: "Reception", text: "How many speeches run over five minutes?", options: ["0-1", "2-3", "4+"], order: 3 },
    { id: "q5", section: "Reception", text: "Who hits the dance floor first?", options: ["Bride's side", "Groom's side"], order: 4 },
    { id: "q6", section: "Fun", text: "Total selfies at the photo booth?", options: ["Under 200", "200-400", "Over 400"], order: 5 },
    { id: "q7", section: "Fun", text: "Late-night snack of choice?", options: ["Dosa", "Pizza", "Chaat"], order: 6 },
  ];
  const correctAnswers = { q1: "Both", q2: "No", q3: "Choreographed" };
  await setDoc(doc(db, "weddings", weddingId, "bets", "config"),
    { questions, correctAnswers, votingLocked: false, updatedAt: serverTimestamp() }, { merge: true });

  const voters = pick(names.sort(() => Math.random() - 0.5), 32);
  for (const name of voters) {
    const answers = {};
    for (const q of questions) answers[q.id] = sample(q.options);
    const id = encodeURIComponent(name.trim().toLowerCase().replace(/\s+/g, " "));
    await setDoc(doc(db, "weddings", weddingId, "betsVotes", id), {
      guestName: name.trim(), normalizedName: name.trim().toLowerCase(),
      answers, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  console.log(`\u2713 games: ${questions.length} questions, ${voters.length} votes`);

  // ---- Photo groups -------------------------------------------------------
  const groups = [
    { name: "Bride & Groom", status: "current", members: ["Priya", "Arjun"] },
    { name: "Bride's Immediate Family", status: "completed", members: pick(names, 6) },
    { name: "Groom's Immediate Family", status: "completed", members: pick(names.slice(6), 6) },
    { name: "All Grandparents", status: "pending", members: pick(names.slice(12), 4) },
    { name: "College Friends", status: "pending", members: pick(names.slice(16), 8) },
    { name: "Office Colleagues", status: "pending", members: pick(names.slice(24), 6) },
    { name: "The Cousins Squad", status: "pending", members: pick(names.slice(30), 10) },
    { name: "Full Wedding Party", status: "pending", members: pick(names.slice(40), 12) },
  ];
  const batch = writeBatch(db);
  groups.forEach((g, i) => {
    batch.set(doc(collection(db, "weddings", weddingId, "photoGroups")), {
      name: g.name, members: g.members, order: i, status: g.status,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  console.log(`\u2713 photos: ${groups.length} groups`);

  console.log("\u2713 data seed complete");
}

main().then(() => process.exit(0)).catch((e) => { console.error("data seed failed:", e); process.exit(1); });
