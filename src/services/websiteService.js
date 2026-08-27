import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function weddingDocRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId);
}

function publicWeddingDocRef(weddingId) {
  return doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId);
}

// Mirror the website config to the public (guest-facing) collection. This is a
// secondary write — it must never block or fail the core save, otherwise a
// stale/undeployed public rule would make Save/Publish appear broken even
// though the owner's private config saved fine. Failures are logged.
async function mirrorPublicWebsite(weddingId, config) {
  try {
    await setDoc(publicWeddingDocRef(weddingId), config, { merge: true });
  } catch (error) {
    console.error('Failed to mirror public website (guest site may be stale):', error);
  }
}

export async function saveWebsiteConfig(weddingId, config) {
  // Authoritative write: the owner's private wedding doc. If this fails, the
  // error propagates so the UI can surface it.
  await updateDoc(weddingDocRef(weddingId), {
    ...config,
    updatedAt: serverTimestamp(),
  });
  // Non-fatal public mirror so the guest website reflects the change.
  await mirrorPublicWebsite(weddingId, config);
}

export function subscribeToWebsite(weddingId, callback) {
  return onSnapshot(publicWeddingDocRef(weddingId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export async function getPublicWebsite(weddingId) {
  const snapshot = await getDoc(publicWeddingDocRef(weddingId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}
