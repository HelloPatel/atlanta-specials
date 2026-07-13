import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function weddingDocRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId);
}

function publicWeddingDocRef(weddingId) {
  return doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId);
}

export async function saveWebsiteConfig(weddingId, config) {
  const batch = writeBatch(db);
  batch.update(weddingDocRef(weddingId), {
    ...config,
    updatedAt: serverTimestamp(),
  });
  batch.set(publicWeddingDocRef(weddingId), config, { merge: true });
  await batch.commit();
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
