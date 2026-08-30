import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

// Roles:
//   'editor'  – full access like owner
//   'viewer'  – read-only across everything
//   'planner' – wedding planner: edit Photo Groups + Games, read-only Events + Seating,
//               no access to guest personal info (Guest List / RSVPs / Print)
//   'dealer'  – edit the Games (bets) page only
export const COLLAB_ROLES = {
  EDITOR: 'editor',
  VIEWER: 'viewer',
  PLANNER: 'planner',
  DEALER: 'dealer',
};

function collabRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, 'collaborators');
}

// ─── Add collaborator by email ──────────────────────────────────────────────

export async function addCollaborator(weddingId, { email, role, name }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email address is required');
  }

  // Check if already added
  const q = query(collabRef(weddingId), where('email', '==', normalizedEmail));
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('This person is already a collaborator');
  }

  // Look up user by email in users collection
  const usersQuery = query(
    collection(db, COLLECTIONS.USERS),
    where('email', '==', normalizedEmail)
  );
  const userSnap = await getDocs(usersQuery);
  const userId = userSnap.empty ? null : userSnap.docs[0].id;

  const docRef = await addDoc(collabRef(weddingId), {
    email: normalizedEmail,
    userId,
    role: role || COLLAB_ROLES.VIEWER,
    name: name || '',
    status: 'active', // could be 'pending' if user doesn't have account yet
    addedAt: serverTimestamp(),
  });

  // Also add this wedding to the collaboratorWeddings array on the wedding doc
  // so we can query it efficiently
  const weddingDoc = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  if (weddingDoc.exists()) {
    const data = weddingDoc.data();
    const collaboratorEmails = data.collaboratorEmails || [];
    const collaboratorUids = data.collaboratorUids || [];
    
    if (!collaboratorEmails.includes(email.toLowerCase())) {
      const updates = {
        collaboratorEmails: [...collaboratorEmails, email.toLowerCase()],
      };
      if (userId && !collaboratorUids.includes(userId)) {
        updates.collaboratorUids = [...collaboratorUids, userId];
      }
      await updateDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId), updates);
    }
  }

  return docRef.id;
}

// ─── Update collaborator role ───────────────────────────────────────────────

export async function updateCollaboratorRole(weddingId, collabId, role) {
  await updateDoc(doc(collabRef(weddingId), collabId), {
    role,
    updatedAt: serverTimestamp(),
  });
}

// ─── Remove collaborator ────────────────────────────────────────────────────

export async function removeCollaborator(weddingId, collabId) {
  const collabSnap = await getDoc(doc(collabRef(weddingId), collabId));
  if (!collabSnap.exists()) return;

  const collabData = collabSnap.data();
  await deleteDoc(doc(collabRef(weddingId), collabId));

  // Remove from wedding doc arrays
  const weddingDoc = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  if (weddingDoc.exists()) {
    const data = weddingDoc.data();
    const updates = {};
    if (collabData.email) {
      updates.collaboratorEmails = (data.collaboratorEmails || []).filter(
        (e) => e !== collabData.email
      );
    }
    if (collabData.userId) {
      updates.collaboratorUids = (data.collaboratorUids || []).filter(
        (u) => u !== collabData.userId
      );
    }
    await updateDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId), updates);
  }
}

// ─── Subscribe to collaborators ─────────────────────────────────────────────

export function subscribeToCollaborators(weddingId, callback) {
  return onSnapshot(
    collabRef(weddingId),
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(list);
    },
    (error) => {
      console.error('[collaborationService] subscribeToCollaborators failed:', error);
      callback([]);
    }
  );
}

// ─── Get user's role for a wedding ──────────────────────────────────────────

export async function getUserRole(weddingId, userEmail, userId) {
  // Check if owner
  const weddingSnap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
  if (!weddingSnap.exists()) return null;
  if (weddingSnap.data().ownerId === userId) return 'owner';

  // Check collaborators (emails are stored lowercased)
  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  const q = query(collabRef(weddingId), where('email', '==', normalizedEmail));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data().role;
}
