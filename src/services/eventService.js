import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function eventsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.EVENTS);
}

function publicEventsRef(weddingId) {
  return collection(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId, COLLECTIONS.PUBLIC_EVENTS);
}

function toPublicEvent(event) {
  return {
    name: event.name || '',
    date: event.date || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    venue: event.venue || '',
    address: event.address || '',
    dressCode: event.dressCode || '',
    description: event.description || '',
    inviteAll: event.inviteAll !== undefined ? event.inviteAll : true,
    guestIds: event.guestIds || [],
    order: event.order || 0,
    updatedAt: serverTimestamp(),
  };
}

// Mirror an event to the public (guest-facing) collection. This is a
// secondary write for the guest website — it must never block or fail the
// core save, otherwise a stale/undeployed public rule would make the whole
// events page appear broken. Failures are logged and reconciled later by
// syncPublicEvents() on next load.
async function mirrorPublicEvent(weddingId, eventId, eventData) {
  try {
    await setDoc(doc(publicEventsRef(weddingId), eventId), toPublicEvent(eventData));
  } catch (error) {
    console.error('Failed to mirror public event (guest website may be stale):', error);
  }
}

export async function addEvent(weddingId, event) {
  const docRef = doc(eventsRef(weddingId));
  const privateEvent = {
    name: event.name,
    date: event.date || '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    venue: event.venue || '',
    address: event.address || '',
    dressCode: event.dressCode || '',
    description: event.description || '',
    inviteAll: event.inviteAll !== undefined ? event.inviteAll : true,
    guestIds: event.guestIds || [],
    order: event.order || 0,
    createdAt: serverTimestamp(),
  };
  await setDoc(docRef, privateEvent);
  await mirrorPublicEvent(weddingId, docRef.id, privateEvent);
  return docRef.id;
}

export async function updateEvent(weddingId, eventId, data) {
  const privateRef = doc(eventsRef(weddingId), eventId);
  const currentSnapshot = await getDoc(privateRef);
  if (!currentSnapshot.exists()) throw new Error('Event not found');

  await updateDoc(privateRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  const nextEvent = { ...currentSnapshot.data(), ...data };
  await mirrorPublicEvent(weddingId, eventId, nextEvent);
}

export async function deleteEvent(weddingId, eventId) {
  const batch = writeBatch(db);
  batch.delete(doc(eventsRef(weddingId), eventId));
  batch.delete(doc(publicEventsRef(weddingId), eventId));
  await batch.commit();
}

export function subscribeToEvents(weddingId, callback) {
  return onSnapshot(eventsRef(weddingId), (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    callback(list);
  });
}

export function subscribeToPublicEvents(weddingId, callback) {
  return onSnapshot(publicEventsRef(weddingId), (snap) => {
    const list = snap.docs
      .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    callback(list);
  });
}

export async function getPublicEvents(weddingId) {
  const snapshot = await getDocs(publicEventsRef(weddingId));
  return snapshot.docs
    .map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function syncPublicEvents(weddingId, events) {
  const publicSnapshot = await getDocs(publicEventsRef(weddingId));
  const eventIds = new Set(events.map((event) => event.id));
  const batch = writeBatch(db);
  events.forEach((event) => {
    batch.set(doc(publicEventsRef(weddingId), event.id), toPublicEvent(event));
  });
  publicSnapshot.docs
    .filter((eventDoc) => !eventIds.has(eventDoc.id))
    .forEach((eventDoc) => batch.delete(eventDoc.ref));
  await batch.commit();
}
