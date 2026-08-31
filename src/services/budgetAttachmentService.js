import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

// Receipts and contracts attached to a single budget line item. Files live in
// Cloud Storage under the wedding; lightweight metadata is mirrored onto the
// budget item doc (an `attachments` array) so the UI can list them without
// touching Storage. Firestore's updateDoc merges field-by-field, so the array
// survives ordinary edits made through budgetService.updateBudgetItem.

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

function budgetItemDoc(weddingId, itemId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.BUDGET, itemId);
}

// Keep the stored file name predictable but collision-free.
function safeName(name) {
  return String(name || 'file')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code === 'storage/unauthorized') {
    return "You don't have permission to upload files here, or file storage isn't set up yet.";
  }
  if (code === 'storage/canceled') return 'Upload canceled.';
  if (code === 'storage/quota-exceeded') return 'Storage is full — free up space and try again.';
  if (code.startsWith('storage/')) {
    return "File uploads aren't available right now. If this keeps happening, storage may need to be turned on.";
  }
  return err?.message || 'Could not upload the file.';
}

/**
 * Upload one file and attach it to a budget item.
 * @param onProgress optional (0–100) callback for the progress bar.
 * Returns the stored attachment metadata.
 */
export function uploadBudgetAttachment(weddingId, itemId, file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!weddingId || !itemId) {
      reject(new Error('Save the item before attaching files.'));
      return;
    }
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      reject(new Error('That file is over 10 MB. Try a smaller one.'));
      return;
    }
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Please attach a PDF, image, document, or spreadsheet.'));
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `weddings/${weddingId}/budget/${itemId}/${id}-${safeName(file.name)}`;
    const objectRef = storageRef(storage, path);
    const task = uploadBytesResumable(objectRef, file, {
      contentType: file.type || 'application/octet-stream',
    });

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err) => reject(new Error(friendlyError(err))),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          const meta = {
            id,
            name: file.name || 'file',
            size: file.size,
            type: file.type || '',
            path,
            url,
            uploadedAt: Date.now(),
          };
          const ref = budgetItemDoc(weddingId, itemId);
          const snap = await getDoc(ref);
          const existing = (snap.exists() && snap.data().attachments) || [];
          await updateDoc(ref, {
            attachments: [...existing, meta],
            updatedAt: serverTimestamp(),
          });
          resolve(meta);
        } catch (err) {
          reject(new Error(friendlyError(err)));
        }
      },
    );
  });
}

/**
 * Remove an attachment: delete the stored file (best effort) and drop its
 * metadata from the budget item.
 */
export async function removeBudgetAttachment(weddingId, itemId, attachment) {
  if (!weddingId || !itemId || !attachment) return;
  try {
    await deleteObject(storageRef(storage, attachment.path));
  } catch (err) {
    // A missing object shouldn't block cleaning up the metadata.
    if (err?.code !== 'storage/object-not-found') {
      console.error('[budgetAttachmentService] deleteObject failed:', err);
    }
  }
  const ref = budgetItemDoc(weddingId, itemId);
  const snap = await getDoc(ref);
  const existing = (snap.exists() && snap.data().attachments) || [];
  await updateDoc(ref, {
    attachments: existing.filter((a) => a.id !== attachment.id),
    updatedAt: serverTimestamp(),
  });
}
