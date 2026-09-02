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

// ─── Custom roles ───────────────────────────────────────────────────────────
// Owners can define named custom roles with per-feature view/edit permissions
// (e.g. "Parents" who can edit Budget but only view Events). A custom role is
// stored on the wedding doc `customRoles` array and assigned to a collaborator
// by setting their `role` to the custom role id (prefixed 'custom_'). Built-in
// roles always take precedence over custom ones during resolution.

export const CUSTOM_ROLE_PREFIX = 'custom_';

export const isCustomRoleId = (role) =>
  typeof role === 'string' && role.startsWith(CUSTOM_ROLE_PREFIX);

// Feature catalog offered in the custom-role builder. Keys MUST match the
// feature gate keys used by WeddingContext (ALL_FEATURES).
export const PERMISSION_FEATURES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'guests', label: 'Guest List' },
  { key: 'events', label: 'Events' },
  { key: 'seating', label: 'Seating' },
  { key: 'rsvp', label: 'RSVPs' },
  { key: 'budget', label: 'Budget' },
  { key: 'photos', label: 'Photo Groups' },
  { key: 'bets', label: 'Games' },
  { key: 'website', label: 'Website' },
  { key: 'print', label: 'Print' },
  { key: 'assistant', label: 'AI Assistant' },
];

function newCustomRoleId() {
  const raw =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${CUSTOM_ROLE_PREFIX}${raw.replace(/-/g, '').slice(0, 12)}`;
}

// Normalize a permissions payload → { view: [], edit: [], viewGuestPII }.
// Edit always implies view so gates stay consistent.
function normalizePermissions({ view = [], edit = [], viewGuestPII = true } = {}) {
  const editList = [...new Set(edit)];
  const viewList = [...new Set([...view, ...edit])];
  return { view: viewList, edit: editList, viewGuestPII: Boolean(viewGuestPII) };
}

export async function createCustomRole(weddingId, { name, view, edit, viewGuestPII }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Give the role a name');

  const weddingRef = doc(db, COLLECTIONS.WEDDINGS, weddingId);
  const snap = await getDoc(weddingRef);
  if (!snap.exists()) throw new Error('Wedding not found');

  const existing = snap.data().customRoles || [];
  if (existing.some((r) => (r.name || '').trim().toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('A custom role with that name already exists');
  }

  const role = {
    id: newCustomRoleId(),
    name: trimmed,
    ...normalizePermissions({ view, edit, viewGuestPII }),
    createdAt: Date.now(),
  };
  await updateDoc(weddingRef, { customRoles: [...existing, role] });
  return role;
}

export async function updateCustomRole(weddingId, roleId, { name, view, edit, viewGuestPII }) {
  const trimmed = (name || '').trim();
  if (!trimmed) throw new Error('Give the role a name');

  const weddingRef = doc(db, COLLECTIONS.WEDDINGS, weddingId);
  const snap = await getDoc(weddingRef);
  if (!snap.exists()) throw new Error('Wedding not found');

  const existing = snap.data().customRoles || [];
  if (
    existing.some(
      (r) => r.id !== roleId && (r.name || '').trim().toLowerCase() === trimmed.toLowerCase()
    )
  ) {
    throw new Error('A custom role with that name already exists');
  }

  const next = existing.map((r) =>
    r.id === roleId
      ? { ...r, name: trimmed, ...normalizePermissions({ view, edit, viewGuestPII }), updatedAt: Date.now() }
      : r
  );
  await updateDoc(weddingRef, { customRoles: next });
}

export async function deleteCustomRole(weddingId, roleId) {
  const weddingRef = doc(db, COLLECTIONS.WEDDINGS, weddingId);
  const snap = await getDoc(weddingRef);
  if (!snap.exists()) return;

  const existing = snap.data().customRoles || [];
  await updateDoc(weddingRef, { customRoles: existing.filter((r) => r.id !== roleId) });

  // Downgrade any collaborators still assigned this custom role to viewer.
  const affected = await getDocs(query(collabRef(weddingId), where('role', '==', roleId)));
  await Promise.all(
    affected.docs.map((d) =>
      updateDoc(doc(collabRef(weddingId), d.id), {
        role: COLLAB_ROLES.VIEWER,
        updatedAt: serverTimestamp(),
      })
    )
  );
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
