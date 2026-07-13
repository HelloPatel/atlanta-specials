import {
  collection,
  doc,
  getDoc,
  getDocs,
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
  const batch = writeBatch(db);
  batch.set(docRef, privateEvent);
  batch.set(doc(publicEventsRef(weddingId), docRef.id), toPublicEvent(privateEvent));
  await batch.commit();
  return docRef.id;
}

export async function updateEvent(weddingId, eventId, data) {
  const privateRef = doc(eventsRef(weddingId), eventId);
  const currentSnapshot = await getDoc(privateRef);
  if (!currentSnapshot.exists()) throw new Error('Event not found');

  const nextEvent = { ...currentSnapshot.data(), ...data };
  const batch = writeBatch(db);
  batch.update(privateRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(publicEventsRef(weddingId), eventId), toPublicEvent(nextEvent));
  await batch.commit();
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
