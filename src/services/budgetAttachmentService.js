import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

// Receipts and contracts attached to a single budget line item. Files live in
// Azure Blob Storage (written by the /api/budget-attachment function, which
// authorizes the caller against the wedding). Lightweight metadata is mirrored
// onto the budget item doc as an `attachments` array so the UI can list files
// without a round-trip. Firestore's updateDoc merges field-by-field, so the
// array survives ordinary edits made through budgetService.updateBudgetItem.

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

async function authToken() {
  try {
    return auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch {
    return null;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// Upload via XHR so we can report progress (fetch can't observe upload bytes).
function postWithProgress(path, token, payload, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      const ct = xhr.getResponseHeader('content-type') || '';
      if (!ct.includes('application/json')) {
        reject(new Error('File uploads run on the deployed site (Azure), not local dev.'));
        return;
      }
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { data = {}; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.error || 'Upload failed. Please try again.'));
    };
    xhr.onerror = () => reject(new Error('Could not reach file storage. Please try again.'));
    xhr.send(JSON.stringify(payload));
  });
}

/**
 * Upload one file and attach it to a budget item.
 * @param onProgress optional (0–100) callback for the progress bar.
 * Returns the stored attachment metadata.
 */
export async function uploadBudgetAttachment(weddingId, itemId, file, onProgress) {
  if (!weddingId || !itemId) throw new Error('Save the item before attaching files.');
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error('That file is over 10 MB. Try a smaller one.');
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please attach a PDF, image, document, or spreadsheet.');
  }

  const token = await authToken();
  const dataBase64 = await fileToBase64(file);
  const data = await postWithProgress(
    '/api/budget-attachment',
    token,
    {
      action: 'upload',
      weddingId,
      itemId,
      fileName: file.name || 'file',
      contentType: file.type || 'application/octet-stream',
      dataBase64,
    },
    onProgress
  );

  if (data.configured === false) {
    throw new Error(data.error || "File storage isn't set up yet.");
  }
  const meta = data.attachment;
  if (!meta) throw new Error('Upload did not complete. Please try again.');

  const ref = budgetItemDoc(weddingId, itemId);
  const snap = await getDoc(ref);
  const existing = (snap.exists() && snap.data().attachments) || [];
  await updateDoc(ref, {
    attachments: [...existing, meta],
    updatedAt: serverTimestamp(),
  });
  return meta;
}

/** Get a short-lived, direct download URL for an attachment. */
export async function getAttachmentDownloadUrl(weddingId, attachment) {
  const token = await authToken();
  const resp = await fetch('/api/budget-attachment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action: 'read-url', weddingId, blobPath: attachment.blobPath }),
  });
  const ct = resp.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('Downloads run on the deployed site (Azure), not local dev.');
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.url) throw new Error(data.error || 'Could not open that file.');
  return data.url;
}

/**
 * Remove an attachment: delete the stored file (best effort) and drop its
 * metadata from the budget item.
 */
export async function removeBudgetAttachment(weddingId, itemId, attachment) {
  if (!weddingId || !itemId || !attachment) return;
  const token = await authToken();
  try {
    await fetch('/api/budget-attachment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: 'delete', weddingId, blobPath: attachment.blobPath }),
    });
  } catch {
    // Even if the blob delete request fails, still clean up the metadata below.
  }

  const ref = budgetItemDoc(weddingId, itemId);
  const snap = await getDoc(ref);
  const existing = (snap.exists() && snap.data().attachments) || [];
  await updateDoc(ref, {
    attachments: existing.filter((a) => a.id !== attachment.id),
    updatedAt: serverTimestamp(),
  });
}
