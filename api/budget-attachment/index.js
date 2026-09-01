'use strict';

const { createRemoteJWKSet, jwtVerify } = require('jose');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} = require('@azure/storage-blob');

// ─── Firebase ID-token verification ──────────────────────────────────────────
// Same trust model as the assistant function: Firebase ID tokens are RS256 JWTs
// signed by Google; we verify them against Google's public JWKS. No
// firebase-admin / service account needed.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyFirebaseToken(authHeader, projectId, log) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!projectId) {
    // Unconfigured (local/dev): allow through but with no identity.
    log('FIREBASE_PROJECT_ID not set — skipping token verification.');
    return { ok: true, uid: null, email: null, token };
  }
  if (!token) return { ok: false };
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return {
      ok: true,
      uid: payload.sub || payload.user_id || null,
      email: payload.email || null,
      token,
    };
  } catch (err) {
    log('Firebase token verification failed:', err.message);
    return { ok: false };
  }
}

// ─── Wedding authorization via Firestore REST ────────────────────────────────
// Read the wedding doc with the caller's own ID token. Firestore security rules
// only return it to the owner or a collaborator, so a successful read already
// proves access. We then confirm editor (write) rights from the doc fields.
async function authorizeEditor(projectId, weddingId, auth, log) {
  if (!projectId) return { ok: true }; // dev/unconfigured
  if (!auth.token) return { ok: false, status: 401 };
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/weddings/${encodeURIComponent(weddingId)}`;
  let resp;
  try {
    resp = await fetch(url, { headers: { Authorization: `Bearer ${auth.token}` } });
  } catch (err) {
    log('Firestore authz fetch failed:', err.message);
    return { ok: false, status: 502 };
  }
  if (resp.status === 403 || resp.status === 404) return { ok: false, status: 403 };
  if (!resp.ok) return { ok: false, status: 502 };

  const data = await resp.json().catch(() => null);
  const fields = data && data.fields;
  if (!fields) return { ok: false, status: 403 };

  const ownerId = fields.ownerId && fields.ownerId.stringValue;
  const collabs =
    (fields.collaboratorEmails &&
      fields.collaboratorEmails.arrayValue &&
      fields.collaboratorEmails.arrayValue.values) ||
    [];
  const collabEmails = collabs.map((v) => v.stringValue).filter(Boolean);

  const isEditor =
    (auth.uid && ownerId === auth.uid) ||
    (auth.email && collabEmails.includes(auth.email));
  return isEditor ? { ok: true } : { ok: false, status: 403 };
}

// ─── Azure Blob helpers ──────────────────────────────────────────────────────
function getBlobService() {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) return null;
  return BlobServiceClient.fromConnectionString(conn);
}

function containerName() {
  return process.env.AZURE_STORAGE_CONTAINER || 'budget-attachments';
}

function safeName(name) {
  return String(name || 'file').replace(/[^\w.\-]+/g, '_').slice(0, 120);
}

// A blob path is only ever accepted for the wedding the caller is authorized
// for, so guard against traversal / cross-wedding access.
function pathBelongsToWedding(blobPath, weddingId) {
  return typeof blobPath === 'string' && blobPath.startsWith(`weddings/${weddingId}/budget/`);
}

const MAX_BYTES = 10 * 1024 * 1024;

module.exports = async function (context, req) {
  const log = (...args) => context.log(...args);
  const respond = (status, body) => {
    context.res = { status, headers: { 'Content-Type': 'application/json' }, body };
  };

  if (!req.body || typeof req.body !== 'object') {
    return respond(400, { error: 'Invalid request body.' });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const auth = await verifyFirebaseToken(
    req.headers && (req.headers.authorization || req.headers.Authorization),
    projectId,
    log
  );
  if (!auth.ok) return respond(401, { error: 'Not authorized. Please sign in again.' });

  const service = getBlobService();
  if (!service) {
    // Graceful degradation — the app keeps working, uploads just aren't wired up.
    return respond(200, {
      configured: false,
      error:
        "File storage isn't switched on yet. An admin needs to add " +
        'AZURE_STORAGE_CONNECTION_STRING in the app configuration.',
    });
  }

  const { action, weddingId } = req.body;
  if (!weddingId || typeof weddingId !== 'string') {
    return respond(400, { error: 'Missing weddingId.' });
  }

  const access = await authorizeEditor(projectId, weddingId, auth, log);
  if (!access.ok) {
    return respond(access.status || 403, { error: 'You do not have access to this wedding.' });
  }

  const container = service.getContainerClient(containerName());

  try {
    if (action === 'upload') {
      const { itemId, fileName, contentType, dataBase64 } = req.body;
      if (!itemId || !fileName || !dataBase64) {
        return respond(400, { error: 'Missing file details.' });
      }
      const buffer = Buffer.from(dataBase64, 'base64');
      if (!buffer.length) return respond(400, { error: 'Empty file.' });
      if (buffer.length > MAX_BYTES) {
        return respond(413, { error: 'That file is over 10 MB. Try a smaller one.' });
      }

      await container.createIfNotExists();
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const blobPath = `weddings/${weddingId}/budget/${itemId}/${id}-${safeName(fileName)}`;
      const blockBlob = container.getBlockBlobClient(blobPath);
      await blockBlob.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' },
      });

      return respond(200, {
        configured: true,
        attachment: {
          id,
          name: fileName,
          size: buffer.length,
          type: contentType || '',
          blobPath,
          uploadedAt: Date.now(),
        },
      });
    }

    if (action === 'read-url') {
      const { blobPath } = req.body;
      if (!pathBelongsToWedding(blobPath, weddingId)) {
        return respond(400, { error: 'Invalid file reference.' });
      }
      const cred = service.credential;
      if (!(cred instanceof StorageSharedKeyCredential)) {
        return respond(500, { error: 'Storage is misconfigured (no account key).' });
      }
      const now = new Date();
      const sas = generateBlobSASQueryParameters(
        {
          containerName: containerName(),
          blobName: blobPath,
          permissions: BlobSASPermissions.parse('r'),
          startsOn: new Date(now.getTime() - 60 * 1000),
          expiresOn: new Date(now.getTime() + 10 * 60 * 1000),
        },
        cred
      ).toString();
      const blob = container.getBlockBlobClient(blobPath);
      return respond(200, { configured: true, url: `${blob.url}?${sas}` });
    }

    if (action === 'delete') {
      const { blobPath } = req.body;
      if (!pathBelongsToWedding(blobPath, weddingId)) {
        return respond(400, { error: 'Invalid file reference.' });
      }
      await container.getBlockBlobClient(blobPath).deleteIfExists();
      return respond(200, { configured: true, deleted: true });
    }

    return respond(400, { error: 'Unknown action.' });
  } catch (err) {
    log('Blob operation failed:', err && err.message);
    return respond(500, { error: 'Something went wrong with file storage. Please try again.' });
  }
};
