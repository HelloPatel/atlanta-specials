import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

const weddingsRef = collection(db, COLLECTIONS.WEDDINGS);
const publicWeddingsRef = collection(db, COLLECTIONS.PUBLIC_WEDDINGS);

const PUBLIC_WEDDING_FIELDS = [
  'coupleName',
  'coupleName1',
  'coupleName2',
  'weddingDate',
  'city',
  'venue',
  'slug',
  'settings',
  'websiteTheme',
  'websiteHero',
  'websiteStory',
  'websiteGallery',
  'websiteHotels',
  'websiteRegistry',
  'websiteRsvp',
  'websiteCustomColors',
  'websiteFooter',
  'websitePublished',
  'websiteEventIds',
  'websitePassword',
  'rsvpSettings',
];

export function toPublicWedding(wedding) {
  return Object.fromEntries(
    PUBLIC_WEDDING_FIELDS
      .filter((field) => wedding[field] !== undefined)
      .map((field) => [field, wedding[field]]),
  );
}

export async function createWedding(userId, data) {
  const slug = `${data.coupleName1}-and-${data.coupleName2}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const docRef = doc(weddingsRef);
  const wedding = {
    ownerId: userId,
    coupleName1: data.coupleName1,
    coupleName2: data.coupleName2,
    weddingDate: data.weddingDate || null,
    city: data.city || '',
    venue: data.venue || '',
    slug,
    settings: {
      rsvpOpen: false,
      publicWebsite: false,
      theme: 'classic',
      language: 'en',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(docRef, wedding);
  batch.set(doc(publicWeddingsRef, docRef.id), toPublicWedding(wedding));
  await batch.commit();

  return { id: docRef.id, slug };
}

export async function getWedding(weddingId) {
  const snap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getPublicWedding(weddingId) {
  const snap = await getDoc(doc(publicWeddingsRef, weddingId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function publishWedding(weddingId, wedding) {
  await setDoc(doc(publicWeddingsRef, weddingId), toPublicWedding(wedding), { merge: true });
}

export async function updateWedding(weddingId, data) {
  const privateRef = doc(db, COLLECTIONS.WEDDINGS, weddingId);
  const currentSnapshot = await getDoc(privateRef);
  if (!currentSnapshot.exists()) throw new Error('Wedding not found');

  const nextWedding = { ...currentSnapshot.data(), ...data };
  const batch = writeBatch(db);
  batch.update(privateRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(publicWeddingsRef, weddingId), toPublicWedding(nextWedding), { merge: true });
  await batch.commit();
}

export async function deleteWedding(weddingId) {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  batch.delete(doc(publicWeddingsRef, weddingId));
  await batch.commit();
}

export function subscribeToWeddings(userId, callback) {
  const q = query(weddingsRef, where('ownerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    (error) => {
      console.error('[weddingService] subscribeToWeddings failed:', error);
      callback([]);
    }
  );
}

// Resolve a slug (e.g. "rushi-and-priya") to a wedding document ID
export async function getWeddingBySlug(slug) {
  const q = query(publicWeddingsRef, where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// Determine if a param is a Firestore doc ID or a slug, and resolve to wedding ID
export async function resolveWeddingId(param) {
  // Firestore IDs are typically 20 alphanum chars; slugs contain hyphens and are longer
  if (!param.includes('-')) {
    return param; // likely a doc ID
  }
  const wedding = await getWeddingBySlug(param);
  return wedding ? wedding.id : null;
}
