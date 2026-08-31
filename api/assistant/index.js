'use strict';

const { createRemoteJWKSet, jwtVerify } = require('jose');

// ─── Firebase ID-token verification ──────────────────────────────────────────
// Firebase ID tokens are RS256 JWTs signed by Google. We verify them against
// Google's public JWKS so the endpoint can only be used by signed-in users of
// this Firebase project. No firebase-admin / service account needed.
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyFirebaseToken(authHeader, projectId, log) {
  // If no project id is configured, skip verification (local/dev/unconfigured).
  if (!projectId) {
    log('FIREBASE_PROJECT_ID not set — skipping token verification.');
    return { ok: true, uid: null };
  }
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false };
  try {
    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return { ok: true, uid: payload.sub || payload.user_id || null };
  } catch (err) {
    log('Firebase token verification failed:', err.message);
    return { ok: false };
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
