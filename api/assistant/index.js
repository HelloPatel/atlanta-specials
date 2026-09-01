'use strict';

const { importX509, jwtVerify, decodeProtectedHeader } = require('jose');

// ─── Firebase ID-token verification ──────────────────────────────────────────
// Firebase ID tokens are RS256 JWTs signed by Google. We verify them against
// Google's public signing certificates so the endpoint can only be used by
// signed-in users of this Firebase project. No firebase-admin / service account
// needed. We use the X.509 cert endpoint (the canonical Firebase method) and
// import a single key by `kid`, which avoids a jose JWKSet-parsing edge case
// ("Unsupported alg value for a JSON Web Key Set") seen on some runtimes.
const FIREBASE_X509_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let _certCache = { certs: null, exp: 0 };
async function getFirebaseCerts() {
  const now = Date.now();
  if (_certCache.certs && now < _certCache.exp) return _certCache.certs;
  const resp = await fetch(FIREBASE_X509_URL);
  if (!resp.ok) throw new Error(`cert fetch HTTP ${resp.status}`);
  const certs = await resp.json();
  const cc = resp.headers.get('cache-control') || '';
  const m = cc.match(/max-age=(\d+)/);
  const ttl = m ? parseInt(m[1], 10) * 1000 : 3600 * 1000;
  _certCache = { certs, exp: now + ttl };
  return certs;
}

async function verifyFirebaseToken(authHeader, projectId, log) {
  // If no project id is configured, skip verification (local/dev/unconfigured).
  if (!projectId) {
    log('FIREBASE_PROJECT_ID not set — skipping token verification.');
    return { ok: true, uid: null };
  }
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false };
  try {
    const { kid } = decodeProtectedHeader(token);
    const certs = await getFirebaseCerts();
    const pem = kid && certs[kid];
    if (!pem) throw new Error('no matching signing cert for token kid');
    const key = await importX509(pem, 'RS256');
    const { payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    return { ok: true, uid: payload.sub || payload.user_id || null, token };
  } catch (err) {
    log('Firebase token verification failed:', err.message);
    return { ok: false, err: err && err.message, code: err && err.code };
  }
}

// ─── Per-user weekly rate limit (Firestore REST) ─────────────────────────────
// Each signed-in user gets a fixed number of assistant messages per ISO week.
// The counter lives at /users/{uid}/assistantUsage/{weekId}, which Firestore
// rules only let that same user read/write — so counters never cross users.
// We use the caller's own ID token (no service account), matching the rest of
// the app's trust model.
const WEEKLY_LIMIT = 200;

// ISO-8601 week id like "2026-W35" in UTC. Weeks start Monday.
function isoWeekId(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // Sun=0 -> 7
  date.setUTCDate(date.getUTCDate() + 4 - day); // shift to Thursday of this week
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function usageDocName(projectId, uid, weekId) {
  return (
    `projects/${projectId}/databases/(default)/documents` +
    `/users/${encodeURIComponent(uid)}/assistantUsage/${encodeURIComponent(weekId)}`
  );
}

// Returns { allowed, remaining, limit }. Fails open (allows) on unconfigured
// project, missing uid, or any Firestore error — the cap is a cost guardrail,
// not a security boundary, so it must never block a legitimate user on a blip.
async function checkAndIncrementUsage(projectId, uid, token, log) {
  const limit = WEEKLY_LIMIT;
  if (!projectId || !uid || !token) return { allowed: true, remaining: limit, limit };

  const weekId = isoWeekId();
  const docName = usageDocName(projectId, uid, weekId);
  const base = 'https://firestore.googleapis.com/v1/';
  const authHeaders = { Authorization: 'Bearer ' + token };

  // 1) Read the current week's counter.
  let storedCount = 0;
  let storedWeek = null;
  try {
    const getResp = await fetch(base + docName, { headers: authHeaders });
    if (getResp.ok) {
      const doc = await getResp.json().catch(() => null);
      const fields = doc && doc.fields;
      if (fields) {
        storedWeek = fields.weekId && fields.weekId.stringValue;
        const cv = fields.count && fields.count.integerValue;
        storedCount = cv ? parseInt(cv, 10) || 0 : 0;
      }
    } else if (getResp.status !== 404) {
      log(`Usage read HTTP ${getResp.status} — allowing request.`);
      return { allowed: true, remaining: limit, limit };
    }
  } catch (err) {
    log('Usage read failed — allowing request:', err && err.message);
    return { allowed: true, remaining: limit, limit };
  }

  const sameWeek = storedWeek === weekId;
  const current = sameWeek ? storedCount : 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  // 2) Increment atomically (or reset to 1 on a new week).
  const commitUrl = `${base}projects/${projectId}/databases/(default)/documents:commit`;
  let write;
  if (sameWeek) {
    // Preserve count via updateMask, then atomically +1 with a transform.
    write = {
      update: {
        name: docName,
        fields: { weekId: { stringValue: weekId }, uid: { stringValue: uid } },
      },
      updateMask: { fieldPaths: ['weekId', 'uid'] },
      updateTransforms: [{ fieldPath: 'count', increment: { integerValue: '1' } }],
    };
  } else {
    // New week (or no doc): overwrite and start the count at 1.
    write = {
      update: {
        name: docName,
        fields: {
          weekId: { stringValue: weekId },
          uid: { stringValue: uid },
          count: { integerValue: '1' },
        },
      },
    };
  }

  try {
    const commitResp = await fetch(commitUrl, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: [write] }),
    });
    if (!commitResp.ok) {
      log(`Usage commit HTTP ${commitResp.status} — allowing request.`);
      return { allowed: true, remaining: Math.max(0, limit - current - 1), limit };
    }
    const result = await commitResp.json().catch(() => null);
    const tr = result && result.writeResults && result.writeResults[0]
      && result.writeResults[0].transformResults;
    let newCount = current + 1;
    if (tr && tr[0] && tr[0].integerValue) {
      newCount = parseInt(tr[0].integerValue, 10) || newCount;
    }
    if (newCount > limit) {
      // Raced past the cap between read and commit.
      return { allowed: false, remaining: 0, limit };
    }
    return { allowed: true, remaining: Math.max(0, limit - newCount), limit };
  } catch (err) {
    log('Usage commit failed — allowing request:', err && err.message);
    return { allowed: true, remaining: Math.max(0, limit - current - 1), limit };
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────
function buildSystemPrompt(contextText) {
  return [
    'You are "Phera Assistant", a warm, knowledgeable wedding-planning assistant',
    'built into the Phera wedding planning app. You specialize in multicultural and',
    'Indian weddings (mehndi, haldi, sangeet, ceremony, reception and more), but you',
    'help with any wedding.',
    '',
    'How you help:',
    '- Answer questions about planning, timelines, etiquette, budgeting, guest',
    '  management, seating, catering/dietary needs, and day-of logistics.',
    '- Give concise, practical, friendly answers. Prefer short paragraphs and tight',
    '  bullet lists. Avoid fluff.',
    '- Use ONLY the wedding data provided in the context below. Never invent guest',
    '  names, counts, dates, or amounts. If the data needed is not in the context,',
    '  say what you can see and ask the user to add it on the relevant page.',
    '- You currently cannot make changes to the wedding (add guests, edit events,',
    '  update the budget, etc.). When a user asks you to change something, explain',
    '  the exact steps to do it on the matching page (Guests, Events, Seating, RSVP,',
    '  Budget, Photos, Website). Making changes for the user is coming soon.',
    '- Never give binding legal, medical, or financial advice; suggest consulting a',
    '  professional when appropriate.',
    '',
    'Current wedding context (source of truth — trust this over any earlier turn):',
    contextText && contextText.trim().length
      ? contextText.trim()
      : '(No wedding context was provided. Answer generally and invite the user to open a wedding.)',
  ].join('\n');
}

// ─── LLM provider dispatch (Azure OpenAI or OpenAI) ──────────────────────────
function resolveProvider() {
  const azEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azKey = process.env.AZURE_OPENAI_KEY;
  const azDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (azEndpoint && azKey && azDeployment) {
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    const base = azEndpoint.replace(/\/+$/, '');
    return {
      name: 'azure',
      url: `${base}/openai/deployments/${azDeployment}/chat/completions?api-version=${apiVersion}`,
      headers: { 'Content-Type': 'application/json', 'api-key': azKey },
      model: undefined,
    };
  }
  const oaKey = process.env.OPENAI_API_KEY;
  if (oaKey) {
    return {
      name: 'openai',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oaKey}` },
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }
  return null;
}

// Keep only the fields the LLM needs and cap history length.
function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }));
}

module.exports = async function (context, req) {
  const log = (...args) => context.log(...args);

  const respond = (status, body) => {
    context.res = {
      status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  };

  // Temporary, header-guarded runtime diagnostic. Only responds when the caller
  // sends the exact secret header, so it never leaks to normal users. Remove
  // after the auth issue is confirmed fixed.
  const diagOn =
    req.headers &&
    (req.headers['x-phera-diag'] || req.headers['X-Phera-Diag']) === 'phera-diag-7f3a9c';
  if (diagOn && req.headers['x-phera-diag-info']) {
    return respond(200, {
      node: process.version,
      hasFetch: typeof fetch,
      hasGlobalThisFetch: typeof globalThis.fetch,
      hasCrypto: typeof globalThis.crypto,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || null,
    });
  }

  if (!req.body || typeof req.body !== 'object') {
    return respond(400, { error: 'Invalid request body.' });
  }

  const history = sanitizeMessages(req.body.messages);
  if (!history.length) {
    return respond(400, { error: 'No messages provided.' });
  }

  // Auth: verify the caller is a signed-in Firebase user (when configured).
  const auth = await verifyFirebaseToken(
    req.headers && (req.headers.authorization || req.headers.Authorization),
    process.env.FIREBASE_PROJECT_ID,
    log
  );
  if (!auth.ok) {
    const body = { error: 'Not authorized. Please sign in again.' };
    if (diagOn) {
      body._diag = { node: process.version, hasFetch: typeof fetch, err: auth.err, code: auth.code };
    }
    return respond(401, body);
  }

  const provider = resolveProvider();
  if (!provider) {
    // Graceful degradation: the app works, the assistant just isn't wired up yet.
    return respond(200, {
      configured: false,
      reply:
        "The AI assistant isn't switched on yet. An admin needs to add the AI " +
        'model credentials (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY / ' +
        'AZURE_OPENAI_DEPLOYMENT, or OPENAI_API_KEY) in the app configuration. ' +
        'Once that\u2019s set, I\u2019ll be able to help you plan your wedding.',
    });
  }

  // Per-user weekly cap (cost guardrail). Only counts real, configured attempts.
  const usage = await checkAndIncrementUsage(
    process.env.FIREBASE_PROJECT_ID,
    auth.uid,
    auth.token,
    log
  );
  if (!usage.allowed) {
    return respond(429, {
      configured: true,
      limited: true,
      error:
        `You\u2019ve hit this week\u2019s limit of ${usage.limit} assistant messages. ` +
        'It resets Monday. Until then, you can keep planning on the Guests, ' +
        'Events, Budget, and Seating pages.',
    });
  }

  const contextText = typeof req.body.context === 'string' ? req.body.context : '';
  const messages = [
    { role: 'system', content: buildSystemPrompt(contextText) },
    ...history,
  ];

  const payload = {
    messages,
    temperature: 0.5,
    max_tokens: 800,
    top_p: 0.95,
  };
  if (provider.model) payload.model = provider.model;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const resp = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      log(`LLM error ${resp.status}: ${detail.slice(0, 500)}`);
      return respond(502, {
        error: 'The assistant had trouble responding. Please try again in a moment.',
      });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return respond(502, { error: 'The assistant returned an empty response.' });
    }

    return respond(200, {
      configured: true,
      reply,
      usage: data.usage || null,
      remaining: usage.remaining,
    });
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    log('Assistant request failed:', err && err.message);
    return respond(aborted ? 504 : 500, {
      error: aborted
        ? 'The assistant took too long to respond. Please try again.'
        : 'Something went wrong reaching the assistant. Please try again.',
    });
  }
};
