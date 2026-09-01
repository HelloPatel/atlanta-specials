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
    '- The context includes a full "RSVP roster": one line per guest as',
    '  "Full Name | E1a,E2p,..." where E# maps to the listed event codes and the',
    '  trailing letter is a=accepted, d=declined, p=pending. A guest is invited to',
    '  an event only if that event code appears on their line. "Pending" (p) means',
    '  they have NOT responded yet. You MAY and SHOULD list the actual guest names',
    '  when asked things like "who hasn\'t RSVP\'d to Haldi?", "who declined the',
    '  reception?", or "who is invited to sangeet?" — read them straight from the',
    '  roster and list them. This is the couple\'s own data; do not refuse or defer',
    '  to another page when the roster already contains the answer. For very long',
    '  lists, you may group or note the total, but still list the names.',
    '- You CAN make a focused set of changes for the user through actions: add a',
    '  guest, update a guest\u2019s details, set a guest\u2019s RSVP for an event, invite or',
    '  uninvite a guest to/from an event, assign a guest to a seating table, and',
    '  delete a guest. When the user clearly asks for one of these, call the matching',
    '  tool with names taken from the roster/events. Do NOT ask for internal IDs \u2014',
    '  use the guest and event NAMES. The user sees a confirmation card and must',
    '  approve before anything is written, so it is safe to propose the action; you',
    '  do not need to ask "are you sure" yourself. You may call several tools at once',
    '  when the user asks for multiple changes.',
    '- For changes OUTSIDE that set (events, budget, photos, website, bulk edits),',
    '  explain the exact steps on the matching page (Guests, Events, Seating, RSVP,',
    '  Budget, Photos, Website).',
    '- Never give binding legal, medical, or financial advice; suggest consulting a',
    '  professional when appropriate.',
    '',
    'Current wedding context (source of truth — trust this over any earlier turn):',
    contextText && contextText.trim().length
      ? contextText.trim()
      : '(No wedding context was provided. Answer generally and invite the user to open a wedding.)',
  ].join('\n');
}

// ─── Action tools (function calling) ─────────────────────────────────────────
// The model may PROPOSE these. It never executes them — the API returns the
// tool calls to the client, which shows a confirmation card and runs the change
// via the app's normal (auth-scoped) service functions. Arguments use human
// names (guest/event/table names); the client resolves them to IDs.
const RSVP_STATUSES = ['accepted', 'declined', 'pending'];
const ASSISTANT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'add_guest',
      description:
        "Add a new guest to this wedding's guest list, optionally inviting them to named events.",
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: 'Guest first name.' },
          lastName: { type: 'string', description: 'Guest last name (optional).' },
          side: {
            type: 'string',
            enum: ['bride', 'groom'],
            description: 'Which side the guest belongs to.',
          },
          relation: {
            type: 'string',
            description: 'Relationship, e.g. "cousin", "college friend".',
          },
          invitedEvents: {
            type: 'array',
            items: { type: 'string' },
            description: 'Names of events to invite this guest to (must match existing events).',
          },
          plusOne: { type: 'boolean', description: 'Whether the guest gets a plus-one.' },
          plusOneName: { type: 'string', description: 'Name of the plus-one, if known.' },
          dietary: {
            type: 'string',
            description: 'Dietary preference, e.g. "vegetarian", "vegan", "no restrictions".',
          },
        },
        required: ['firstName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_guest',
      description:
        "Update an existing guest's details. Only the fields you provide are changed.",
      parameters: {
        type: 'object',
        properties: {
          guestName: {
            type: 'string',
            description: 'Full name of the guest to update (as it appears in the roster).',
          },
          email: { type: 'string' },
          phone: { type: 'string' },
          side: { type: 'string', enum: ['bride', 'groom'] },
          relation: { type: 'string' },
          dietary: { type: 'string' },
          dietaryNotes: { type: 'string' },
          notes: { type: 'string' },
          plusOne: { type: 'boolean' },
          plusOneName: { type: 'string' },
        },
        required: ['guestName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_guest_rsvp',
      description: "Set a guest's RSVP status for a specific event.",
      parameters: {
        type: 'object',
        properties: {
          guestName: { type: 'string', description: 'Full name of the guest.' },
          eventName: { type: 'string', description: 'Name of the event.' },
          status: {
            type: 'string',
            enum: RSVP_STATUSES,
            description: 'accepted, declined, or pending (pending = not responded).',
          },
        },
        required: ['guestName', 'eventName', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_guest_invite',
      description: 'Invite or uninvite a guest to/from a specific event.',
      parameters: {
        type: 'object',
        properties: {
          guestName: { type: 'string', description: 'Full name of the guest.' },
          eventName: { type: 'string', description: 'Name of the event.' },
          invited: {
            type: 'boolean',
            description: 'true to invite, false to remove the invite.',
          },
        },
        required: ['guestName', 'eventName', 'invited'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assign_guest_table',
      description: "Assign a guest to a seating table for a specific event's seating chart.",
      parameters: {
        type: 'object',
        properties: {
          guestName: { type: 'string', description: 'Full name of the guest.' },
          eventName: { type: 'string', description: 'Name of the event whose seating to change.' },
          tableName: {
            type: 'string',
            description: 'Name or number of the target table, e.g. "Table 4" or "Family".',
          },
        },
        required: ['guestName', 'eventName', 'tableName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_guest',
      description:
        'Permanently remove a guest from the wedding. Use only when the user clearly asks to delete/remove a guest.',
      parameters: {
        type: 'object',
        properties: {
          guestName: { type: 'string', description: 'Full name of the guest to delete.' },
        },
        required: ['guestName'],
      },
    },
  },
];
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

  if (!req.body || typeof req.body !== 'object') {
    return respond(400, { error: 'Invalid request body.' });
  }

  const history = sanitizeMessages(req.body.messages);
  if (!history.length) {
    return respond(400, { error: 'No messages provided.' });
  }

  // Auth: verify the caller is a signed-in Firebase user (when configured).
  // NOTE: Azure Static Web Apps overwrites the inbound `Authorization` header
  // with its own platform token before forwarding to managed functions, so the
  // client sends the Firebase ID token in a custom header that SWA passes
  // through untouched. We fall back to Authorization for non-SWA hosts.
  const rawToken =
    (req.headers &&
      (req.headers['x-firebase-token'] ||
        req.headers['X-Firebase-Token'] ||
        req.headers.authorization ||
        req.headers.Authorization)) ||
    '';
  const auth = await verifyFirebaseToken(rawToken, process.env.FIREBASE_PROJECT_ID, log);
  if (!auth.ok) {
    return respond(401, { error: 'Not authorized. Please sign in again.' });
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
    tools: ASSISTANT_TOOLS,
    tool_choice: 'auto',
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
    const message = data?.choices?.[0]?.message || {};
    const reply = typeof message.content === 'string' ? message.content.trim() : '';

    // The model may propose one or more write actions. We do NOT execute them
    // here — hand them to the client, which confirms with the user and runs the
    // change through the app's auth-scoped services.
    const actions = [];
    if (Array.isArray(message.tool_calls)) {
      for (const call of message.tool_calls) {
        if (!call || call.type !== 'function' || !call.function) continue;
        let args = {};
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          args = {};
        }
        actions.push({
          id: call.id || `call_${actions.length}`,
          name: call.function.name,
          arguments: args,
        });
      }
    }

    if (!reply && !actions.length) {
      return respond(502, { error: 'The assistant returned an empty response.' });
    }

    return respond(200, {
      configured: true,
      reply,
      actions,
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
