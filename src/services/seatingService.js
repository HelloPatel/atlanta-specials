import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function seatingDocRef(weddingId, eventId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.SEATING, eventId);
}

function publicSeatingDocRef(weddingId, eventId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PUBLIC_SEATING, eventId);
}

function toPublicSeating(data) {
  return {
    tables: (data.tables || []).map((table) => ({
      id: table.id,
      name: table.name || '',
      capacity: table.capacity || 0,
      assignedGuests: table.assignedGuests || [],
    })),
    updatedAt: serverTimestamp(),
  };
}

export async function getSeating(weddingId, eventId) {
  const snap = await getDoc(seatingDocRef(weddingId, eventId));
  return snap.exists() ? snap.data() : { tables: [], rules: [], zones: [] };
}

export async function saveSeating(weddingId, eventId, data) {
  const batch = writeBatch(db);
  batch.set(seatingDocRef(weddingId, eventId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(publicSeatingDocRef(weddingId, eventId), toPublicSeating(data));
  await batch.commit();
}

export async function publishSeating(weddingId, eventId, data) {
  await setDoc(publicSeatingDocRef(weddingId, eventId), toPublicSeating(data));
}

export function subscribeToSeating(weddingId, eventId, callback) {
  return onSnapshot(
    seatingDocRef(weddingId, eventId),
    (snap) => {
      callback(snap.exists() ? snap.data() : { tables: [], rules: [], zones: [] });
    },
    (error) => {
      console.error('[seatingService] subscribeToSeating failed:', error);
      callback({ tables: [], rules: [], zones: [] });
    }
  );
}

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function guestMatchesSearch(guest, searchName) {
  const query = normalizeSearchValue(searchName);
  if (!query) return false;

  const first = normalizeSearchValue(guest.firstName);
  const last = normalizeSearchValue(guest.lastName);
  const full = normalizeSearchValue(`${guest.firstName || ''} ${guest.lastName || ''}`);

  return [first, last, full].some((value) => value && value.includes(query));
}

export async function getGuestTable(weddingId, eventId, searchName) {
  const [seating, guestsSnapshot] = await Promise.all([
    getDoc(publicSeatingDocRef(weddingId, eventId)).then((snapshot) => (
      snapshot.exists() ? snapshot.data() : { tables: [] }
    )),
    getDocs(collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PUBLIC_GUESTS)),
  ]);

  const guests = guestsSnapshot.docs.map((guestDoc) => ({ id: guestDoc.id, ...guestDoc.data() }));
  const matches = guests.filter((guest) => guestMatchesSearch(guest, searchName));
  if (matches.length === 0) return [];

  const matchesById = new Set(matches.map((guest) => guest.id));

  return (seating.tables || []).flatMap((table) => {
    const seatedGuests = (table.assignedGuests || [])
      .map((guestId) => guests.find((guest) => guest.id === guestId))
      .filter(Boolean);

    return seatedGuests
      .filter((guest) => matchesById.has(guest.id))
      .map((guest) => ({
        guest,
        table: {
          id: table.id,
          name: table.name,
          capacity: table.capacity,
        },
        tablemates: seatedGuests.filter((tablemate) => tablemate.id !== guest.id),
      }));
  });
}
