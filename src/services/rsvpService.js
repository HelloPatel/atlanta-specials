import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';
import { getPublicEvents } from './eventService';

// ─── RSVP Settings (per wedding) ────────────────────────────────────────────

function rsvpSettingsRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, 'settings', 'rsvp');
}

export async function getRsvpSettings(weddingId) {
  const snap = await getDoc(rsvpSettingsRef(weddingId));
  return snap.exists() ? snap.data() : null;
}

export async function saveRsvpSettings(weddingId, settings) {
  const nextSettings = {
    ...settings,
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(rsvpSettingsRef(weddingId), nextSettings, { merge: true });
  batch.set(doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId), {
    rsvpSettings: settings,
  }, { merge: true });
  await batch.commit();
}

export async function publishRsvpSettings(weddingId, settings) {
  await setDoc(doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId), {
    rsvpSettings: settings || null,
  }, { merge: true });
}

export function subscribeToRsvpSettings(weddingId, callback) {
  return onSnapshot(rsvpSettingsRef(weddingId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

// ─── RSVP Responses (public submissions) ────────────────────────────────────

function responsesRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, 'rsvpResponses');
}

export async function submitRsvpResponse(weddingId, response) {
  const cap = (val, max) => (typeof val === 'string' ? val.slice(0, max) : '');
  const docRef = await addDoc(responsesRef(weddingId), {
    guestId: response.guestId || null,
    familyName: cap(response.familyName, 200),
    respondentName: cap(response.respondentName, 200),
    phone: cap(response.phone, 50),
    email: cap(response.email, 200),
    // Per-event responses: { eventId: 'accepted'|'declined' }
    eventResponses: response.eventResponses || {},
    // Family members attending per event: { eventId: [{ name, dietary }] }
    familyMembers: response.familyMembers || {},
    dietary: cap(response.dietary, 100) || 'vegetarian',
    dietaryNotes: cap(response.dietaryNotes, 500),
    message: cap(response.message, 2000),
    needsHotel: response.needsHotel || false,
    travelFrom: cap(response.travelFrom, 200),
    submittedAt: serverTimestamp(),
    method: response.method || 'web', // 'web' | 'whatsapp' | 'manual'
  });
  return docRef.id;
}

export function subscribeToResponses(weddingId, callback) {
  return onSnapshot(responsesRef(weddingId), (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// ─── Public RSVP page data (read without auth) ─────────────────────────────

export async function getPublicWeddingData(weddingId) {
  const weddingSnap = await getDoc(doc(db, COLLECTIONS.PUBLIC_WEDDINGS, weddingId));
  if (!weddingSnap.exists()) return null;

  const wedding = { id: weddingSnap.id, ...weddingSnap.data() };

  // Get events
  const events = await getPublicEvents(weddingId);
  const rsvpSettings = wedding.rsvpSettings || null;

  return { wedding, events, rsvpSettings };
}

// ─── Guest lookup for RSVP (by phone or name) ──────────────────────────────

export async function lookupGuestForRsvp(weddingId, { phone, name }) {
  const guestsRef = collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PUBLIC_GUESTS);
  
  if (phone) {
    const phoneLast4 = phone.replace(/\D/g, '').slice(-4);
    const q = query(guestsRef, where('phoneLast4', '==', phoneLast4));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  }

  // Fallback: get all guests and fuzzy match by name
  if (name) {
    const snap = await getDocs(guestsRef);
    const normalizedName = name.toLowerCase().trim();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((g) => {
        const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
        return fullName.includes(normalizedName) || normalizedName.includes(fullName);
      });
  }

  return [];
}

// ─── RSVP engagement tracking ───────────────────────────────────────────────
// When a guest opens their invitation (via name search or a personalized link),
// we stamp the private guest doc so the couple can see who has actually looked
// at their RSVP — and who still needs a nudge. This is a public, unauthenticated
// write restricted by rules to the rsvpViewedAt/rsvpViewCount keys only.

export async function recordRsvpView(weddingId, guestId) {
  if (!weddingId || !guestId) return;
  try {
    await updateDoc(
      doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS, guestId),
      {
        rsvpViewedAt: serverTimestamp(),
        rsvpViewCount: increment(1),
      },
    );
  } catch (err) {
    // Non-critical: never block the guest's RSVP flow on a tracking write.
    console.warn('Could not record RSVP view:', err?.message || err);
  }
}

// ─── Generate shareable RSVP link ───────────────────────────────────────────

export function getRsvpLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/rsvp/${identifier}`;
}

// Personalized per-household link. When opened, the RSVP page skips the
// name-search step and loads that household directly (see PublicRSVP `?g`).
export function getHouseholdRsvpLink(weddingId, guestId, slug) {
  const base = getRsvpLink(weddingId, slug);
  return guestId ? `${base}?g=${encodeURIComponent(guestId)}` : base;
}

// Build a WhatsApp share link. If `phone` is provided the chat opens with that
// recipient; otherwise it opens the share sheet. `guestId` personalizes the
// destination so the household lands straight on their own invitation.
export function getWhatsAppRsvpLink(weddingId, coupleName, slug, opts = {}) {
  const { guestId, firstName, phone } = opts;
  const rsvpUrl = guestId
    ? getHouseholdRsvpLink(weddingId, guestId, slug)
    : getRsvpLink(weddingId, slug);
  const greeting = firstName ? `Hi ${firstName}, ` : '';
  const message = encodeURIComponent(
    `${greeting}you're invited to ${coupleName}'s wedding. Tap here to see your events and RSVP: ${rsvpUrl}`
  );
  const digits = (phone || '').replace(/\D/g, '');
  return digits
    ? `https://wa.me/${digits}?text=${message}`
    : `https://wa.me/?text=${message}`;
}
