import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

function photoGroupsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PHOTO_GROUPS);
}

function groupDocRef(weddingId, groupId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.PHOTO_GROUPS, groupId);
}

export function parseMembers(membersInput) {
  if (Array.isArray(membersInput)) {
    return membersInput.map((member) => `${member}`.trim()).filter(Boolean);
  }

  return `${membersInput || ''}`
    .split(/[\n,]+/)
    .map((member) => member.trim())
    .filter(Boolean);
}

async function getOrderedGroups(weddingId) {
  const snap = await getDocs(query(photoGroupsRef(weddingId)));
  return snap.docs
    .map((groupDoc) => ({ id: groupDoc.id, ...groupDoc.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function addGroup(weddingId, group) {
  const existingGroups = await getOrderedGroups(weddingId);
  const members = parseMembers(group.members ?? group.membersText);

  const docRef = await addDoc(photoGroupsRef(weddingId), {
    name: group.name?.trim() || 'Untitled group',
    members,
    order: group.order ?? existingGroups.length,
    status: group.status || 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

// Parse raw CSV text into rows of cells, honoring quoted fields, escaped
// quotes ("") and embedded newlines. Fully-empty rows are dropped.
function parseCsvRows(text) {
  const source = `${text || ''}`.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field);
  rows.push(row);

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

// Turn CSV text into a list of { name, members }.
// Column 1 is the group name; every remaining column is a member.
// An optional header row (first cell is name/group/group name) is skipped.
export function parseGroupsCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  let start = 0;
  const firstCell = (rows[0][0] || '').trim().toLowerCase();
  if (['name', 'group', 'group name', 'groupname'].includes(firstCell)) {
    start = 1;
  }

  const groups = [];
  for (let i = start; i < rows.length; i += 1) {
    const cells = rows[i];
    const name = (cells[0] || '').trim();
    if (!name) continue;

    const members = cells
      .slice(1)
      .map((cell) => cell.trim())
      .filter(Boolean);

    groups.push({ name, members });
  }

  return groups;
}

// Bulk-add groups (e.g. from a CSV import). Groups are appended after any
// existing groups, keeping their order. Returns the number added.
export async function importGroups(weddingId, incomingGroups) {
  const cleaned = (incomingGroups || [])
    .map((group) => ({
      name: `${group?.name || ''}`.trim(),
      members: parseMembers(group?.members ?? group?.membersText),
    }))
    .filter((group) => group.name);

  if (cleaned.length === 0) return 0;

  const existingGroups = await getOrderedGroups(weddingId);
  const startOrder = existingGroups.length;
  const batch = writeBatch(db);

  cleaned.forEach((group, index) => {
    const newRef = doc(photoGroupsRef(weddingId));
    batch.set(newRef, {
      name: group.name,
      members: group.members,
      order: startOrder + index,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return cleaned.length;
}

export async function updateGroup(weddingId, groupId, data) {
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(data, 'members') || Object.prototype.hasOwnProperty.call(data, 'membersText')) {
    payload.members = parseMembers(data.members ?? data.membersText);
  }

  if (typeof data.name === 'string') {
    payload.name = data.name.trim();
  }

  delete payload.membersText;

  await updateDoc(groupDocRef(weddingId, groupId), payload);
}

export async function deleteGroup(weddingId, groupId) {
  await deleteDoc(groupDocRef(weddingId, groupId));

  const groups = await getOrderedGroups(weddingId);
  await reorderGroups(weddingId, groups);
}

export async function reorderGroups(weddingId, groups) {
  const batch = writeBatch(db);

  groups.forEach((group, index) => {
    batch.update(groupDocRef(weddingId, group.id), {
      order: index,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function setCurrentGroup(weddingId, groupId) {
  const groups = await getOrderedGroups(weddingId);
  const batch = writeBatch(db);

  groups.forEach((group) => {
    const nextStatus = group.id === groupId
      ? 'current'
      : group.status === 'completed'
        ? 'completed'
        : 'pending';

    batch.update(groupDocRef(weddingId, group.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function markCompleted(weddingId, groupId, nextGroupId = null) {
  const groups = await getOrderedGroups(weddingId);
  const batch = writeBatch(db);

  groups.forEach((group) => {
    let nextStatus = group.status || 'pending';

    if (group.id === groupId) {
      nextStatus = 'completed';
    } else if (group.id === nextGroupId) {
      nextStatus = 'current';
    } else if (group.status !== 'completed') {
      nextStatus = 'pending';
    }

    batch.update(groupDocRef(weddingId, group.id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// Reset the whole queue back to the start: every group becomes 'pending',
// clearing any current/completed status so the event can run again.
export async function resetQueue(weddingId) {
  const groups = await getOrderedGroups(weddingId);
  if (groups.length === 0) return;

  const batch = writeBatch(db);
  groups.forEach((group) => {
    batch.update(groupDocRef(weddingId, group.id), {
      status: 'pending',
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// Start the queue: promote the first not-yet-completed group to 'current'.
// No-op if a group is already current or nothing is waiting.
export async function startQueue(weddingId) {
  const groups = await getOrderedGroups(weddingId);
  if (groups.some((group) => group.status === 'current')) return;

  const firstPending = groups.find((group) => group.status !== 'completed');
  if (!firstPending) return;

  await setCurrentGroup(weddingId, firstPending.id);
}

// Stop the queue: send the current group back to 'pending' so nothing is live.
export async function stopQueue(weddingId) {
  const groups = await getOrderedGroups(weddingId);
  const current = groups.find((group) => group.status === 'current');
  if (!current) return;

  await updateDoc(groupDocRef(weddingId, current.id), {
    status: 'pending',
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToGroups(weddingId, callback) {
  return onSnapshot(
    photoGroupsRef(weddingId),
    (snap) => {
      const groups = snap.docs
        .map((groupDoc) => ({ id: groupDoc.id, ...groupDoc.data() }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      callback(groups);
    },
    (error) => {
      console.error('Failed to read photo groups (queue may be unavailable):', error);
      callback([]);
    }
  );
}

export function getPhotoQueueLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/photos/${identifier}`;
}

export function getPhotoDisplayLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/photos/${identifier}/display`;
}
