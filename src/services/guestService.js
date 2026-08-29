import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function guestsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS);
}

function publicGuestsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PUBLIC_GUESTS);
}

function familiesRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.FAMILIES);
}

// Firestore allows at most 500 writes per batch. Chunk below that so large
// imports/deletes/updates don't throw once a wedding grows past ~500 guests.
const BATCH_WRITE_LIMIT = 450;

async function commitInChunks(items, apply, writesPerItem = 1) {
  const itemLimit = Math.floor(BATCH_WRITE_LIMIT / writesPerItem);
  for (let i = 0; i < items.length; i += itemLimit) {
    const batch = writeBatch(db);
    for (const item of items.slice(i, i + itemLimit)) apply(batch, item);
    await batch.commit();
  }
  return items.length;
}

// ─── Guest CRUD ─────────────────────────────────────────────────────────────

export function toPublicGuest(guest) {
  const phoneDigits = String(guest.phone || '').replace(/\D/g, '');
  return {
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    familyId: guest.familyId || null,
    familyName: guest.familyName || '',
    phoneLast4: phoneDigits.slice(-4),
    isChild: (guest.tags || []).includes('Kids'),
    updatedAt: serverTimestamp(),
  };
}

export async function addGuest(weddingId, guest) {
  const docRef = doc(guestsRef(weddingId));
  const privateGuest = {
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    email: guest.email || '',
    phone: guest.phone || '',
    familyId: guest.familyId || null,
    familyName: guest.familyName || '',
    side: guest.side || 'bride',
    relation: guest.relation || '',
    dietary: guest.dietary || 'vegetarian',
    dietaryNotes: guest.dietaryNotes || '',
    tableNumber: guest.tableNumber || null,
    seatIndex: guest.seatIndex || null,
    rsvpStatus: guest.rsvpStatus || {},
    rsvpMethod: guest.rsvpMethod || 'manual',
    plusOne: guest.plusOne || false,
    plusOneName: guest.plusOneName || '',
    needsHotel: guest.needsHotel || false,
    hotelNotes: guest.hotelNotes || '',
    travelFrom: guest.travelFrom || '',
    arrivalDate: guest.arrivalDate || null,
    departureDate: guest.departureDate || null,
    language: guest.language || 'en',
    notes: guest.notes || '',
    tags: guest.tags || [],
    importedFrom: guest.importedFrom || 'manual',
    createdAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(docRef, privateGuest);
  batch.set(doc(publicGuestsRef(weddingId), docRef.id), toPublicGuest(privateGuest));
  await batch.commit();
  return docRef.id;
}

export async function updateGuest(weddingId, guestId, data) {
  const privateRef = doc(guestsRef(weddingId), guestId);
  const currentSnapshot = await getDoc(privateRef);
  if (!currentSnapshot.exists()) throw new Error('Guest not found');

  const nextGuest = { ...currentSnapshot.data(), ...data };
  const batch = writeBatch(db);
  batch.update(privateRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(publicGuestsRef(weddingId), guestId), toPublicGuest(nextGuest));
  await batch.commit();
}

export async function deleteGuest(weddingId, guestId) {
  const batch = writeBatch(db);
  batch.delete(doc(guestsRef(weddingId), guestId));
  batch.delete(doc(publicGuestsRef(weddingId), guestId));
  await batch.commit();
}

export async function deleteGuestsBatch(weddingId, guestIds) {
  return commitInChunks(guestIds, (batch, id) => {
    batch.delete(doc(guestsRef(weddingId), id));
    batch.delete(doc(publicGuestsRef(weddingId), id));
  }, 2);
}

export function subscribeToGuests(weddingId, callback) {
  return onSnapshot(guestsRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// ─── Bulk import ────────────────────────────────────────────────────────────

function buildImportedGuest(guest) {
  return {
    firstName: guest.firstName || '',
    lastName: guest.lastName || '',
    email: guest.email || '',
    phone: guest.phone || '',
    familyId: guest.familyId || null,
    familyName: guest.familyName || '',
    side: guest.side || 'bride',
    relation: guest.relation || '',
    dietary: guest.dietary || 'vegetarian',
    dietaryNotes: guest.dietaryNotes || '',
    tableNumber: guest.tableNumber || null,
    seatIndex: null,
    rsvpStatus: {},
    rsvpMethod: 'manual',
    plusOne: guest.plusOne || false,
    plusOneName: guest.plusOneName || '',
    needsHotel: false,
    hotelNotes: '',
    travelFrom: '',
    arrivalDate: null,
    departureDate: null,
    language: guest.language || 'en',
    notes: guest.notes || '',
    tags: guest.tags || [],
    importedFrom: 'excel',
    createdAt: serverTimestamp(),
  };
}

/**
 * Import guests and return the created records as { id, guest } pairs so the
 * caller can reconcile connected data (e.g. adding each new guest to the
 * events they were marked invited to). Doc ids are generated client-side up
 * front, which keeps the whole import in the same batched write.
 */
export async function importGuestsWithIds(weddingId, guests) {
  const ref = guestsRef(weddingId);
  const publicRef = publicGuestsRef(weddingId);
  const created = [];
  await commitInChunks(guests, (batch, guest) => {
    const privateRef = doc(ref);
    const privateGuest = buildImportedGuest(guest);
    batch.set(privateRef, privateGuest);
    batch.set(doc(publicRef, privateRef.id), toPublicGuest(privateGuest));
    created.push({ id: privateRef.id, guest });
  }, 2);
  return created;
}

export async function importGuestsBatch(weddingId, guests) {
  const created = await importGuestsWithIds(weddingId, guests);
  return created.length;
}

export async function syncPublicGuestDirectory(weddingId, guests) {
  const publicSnapshot = await getDocs(publicGuestsRef(weddingId));
  const privateIds = new Set(guests.map((guest) => guest.id));
  const operations = [
    ...guests.map((guest) => ({ type: 'set', guest })),
    ...publicSnapshot.docs
      .filter((guestDoc) => !privateIds.has(guestDoc.id))
      .map((guestDoc) => ({ type: 'delete', id: guestDoc.id })),
  ];

  return commitInChunks(operations, (batch, operation) => {
    if (operation.type === 'delete') {
      batch.delete(doc(publicGuestsRef(weddingId), operation.id));
      return;
    }
    batch.set(
      doc(publicGuestsRef(weddingId), operation.guest.id),
      toPublicGuest(operation.guest),
    );
  });
}

// ─── Bulk update (table assignment, event assignment, etc.) ─────────────────

export async function updateGuestsBatch(weddingId, updates) {
  return commitInChunks(updates, (batch, { guestId, data, currentGuest }) => {
    batch.update(doc(guestsRef(weddingId), guestId), data);
    batch.set(
      doc(publicGuestsRef(weddingId), guestId),
      toPublicGuest({ ...currentGuest, ...data }),
    );
  }, 2);
}

// ─── Family CRUD ────────────────────────────────────────────────────────────

export async function addFamily(weddingId, family) {
  const familyName = (family.familyName || '').trim();
  if (!familyName) {
    throw new Error('Family name is required');
  }
  const docRef = await addDoc(familiesRef(weddingId), {
    familyName,
    headOfFamily: family.headOfFamily || null,
    memberIds: family.memberIds || [],
    side: family.side || 'bride',
    address: family.address || '',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateFamily(weddingId, familyId, data) {
  await updateDoc(doc(familiesRef(weddingId), familyId), data);
}

export async function deleteFamily(weddingId, familyId) {
  await deleteDoc(doc(familiesRef(weddingId), familyId));
}

export function subscribeToFamilies(weddingId, callback) {
  return onSnapshot(familiesRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}
