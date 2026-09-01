import { auth } from '../firebase';
import { guestInvitedToEvent } from '../utils/eventInvites';
import { computeBudgetSummary, formatCurrency } from './budgetService';

// ─── Grounding: compile a compact, trustworthy summary of the active wedding ─
// The assistant is grounded ONLY on this text, so it never invents data. We keep
// it short (counts + a small sample) to stay well within token limits.

function rsvpFor(guest, eventId) {
  return (guest?.rsvpStatus || {})[eventId] || 'pending';
}

function fullName(guest) {
  return [guest?.firstName, guest?.lastName].filter(Boolean).join(' ').trim();
}

/**
 * Build the wedding-context string passed to the assistant function.
 * @param {object} wedding    active wedding doc
 * @param {object} data       { guests, events, budgetItems, budgetTarget }
 * @returns {string}
 */
export function buildWeddingContext(wedding, data = {}) {
  const guests = Array.isArray(data.guests) ? data.guests : [];
  const events = Array.isArray(data.events) ? data.events : [];
  const budgetItems = Array.isArray(data.budgetItems) ? data.budgetItems : [];
  const budgetTarget = data.budgetTarget || 0;

  const lines = [];

  const coupleName =
    wedding?.coupleName || wedding?.name || wedding?.title || 'This wedding';
  lines.push(`Wedding: ${coupleName}`);
  if (wedding?.date) lines.push(`Wedding date: ${wedding.date}`);
  if (wedding?.venue) lines.push(`Primary venue: ${wedding.venue}`);

  // Guests -----------------------------------------------------------------
  const headcount = guests.reduce(
    (sum, g) => sum + 1 + (g.plusOne ? 1 : 0),
    0
  );
  lines.push('');
  lines.push(
    `Guests: ${guests.length} guest record(s), ~${headcount} total headcount (incl. plus-ones).`
  );

  // Events + per-event invite/RSVP tallies --------------------------------
  if (events.length) {
    lines.push('');
    lines.push('Events:');
    const sorted = [...events].sort((a, b) =>
      String(a.date || '').localeCompare(String(b.date || ''))
    );
    for (const ev of sorted) {
      const invited = guests.filter((g) => guestInvitedToEvent(ev, g.id));
      const accepted = invited.filter((g) => rsvpFor(g, ev.id) === 'accepted').length;
      const declined = invited.filter((g) => rsvpFor(g, ev.id) === 'declined').length;
      const pending = invited.length - accepted - declined;
      const when = [ev.date, ev.startTime].filter(Boolean).join(' ');
      const parts = [
        `- ${ev.name || 'Untitled event'}`,
        when ? `(${when})` : '',
        ev.venue ? `@ ${ev.venue}` : '',
        `— ${invited.length} invited, ${accepted} accepted, ${declined} declined, ${pending} pending`,
      ].filter(Boolean);
      lines.push(parts.join(' '));
    }
  } else {
    lines.push('');
    lines.push('Events: none created yet.');
  }

  // Budget -----------------------------------------------------------------
  if (budgetItems.length || budgetTarget) {
    const s = computeBudgetSummary(budgetItems, budgetTarget);
    lines.push('');
    lines.push('Budget:');
    if (s.target) lines.push(`- Target: ${formatCurrency(s.target)}`);
    lines.push(`- Estimated total: ${formatCurrency(s.totalEstimated)}`);
    lines.push(`- Actual/committed: ${formatCurrency(s.totalActual)}`);
    lines.push(`- Paid: ${formatCurrency(s.totalPaid)}`);
    lines.push(`- Outstanding balance: ${formatCurrency(s.totalBalance)}`);
    lines.push(`- Line items: ${s.itemCount} (${s.overBudgetCount} over their estimate)`);
    const cats = Object.entries(s.byCategory || {})
      .map(([cat, v]) => `${cat}: ${formatCurrency(v.actual || v.estimated || 0)}`)
      .slice(0, 8);
    if (cats.length) lines.push(`- By category: ${cats.join('; ')}`);
  } else {
    lines.push('');
    lines.push('Budget: no budget items yet.');
  }

  // A tiny guest sample helps answer "who is invited to X" style questions
  // without shipping the entire directory.
  if (guests.length) {
    const sample = guests
      .slice(0, 25)
      .map((g) => {
        const name = fullName(g) || 'Unnamed guest';
        const evNames = events
          .filter((ev) => guestInvitedToEvent(ev, g.id))
          .map((ev) => ev.name)
          .filter(Boolean);
        return evNames.length ? `${name} → ${evNames.join(', ')}` : name;
      })
      .join('; ');
    lines.push('');
    lines.push(
      `Guest sample (first ${Math.min(25, guests.length)} of ${guests.length}): ${sample}`
    );
  }

  return lines.join('\n');
}

// ─── Transport: POST the conversation to the serverless function ─────────────

/**
 * Send the conversation to the assistant API.
 * @param {object} params { messages, context }
 * @returns {Promise<{ reply: string, configured: boolean }>}
 */
export async function sendAssistantMessage({ messages, context }) {
  let token = null;
  try {
    token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  } catch {
    token = null;
  }

  let resp;
  try {
    resp = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Firebase-Token': token, Authorization: 'Bearer ' + token } : {}),
      },
      body: JSON.stringify({ messages, context }),
    });
  } catch {
    throw new Error(
      'Could not reach the assistant. If you are running locally, the AI API only runs on the deployed site.'
    );
  }

  // In local dev the SWA fallback serves index.html for /api/* — detect that.
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'The assistant API is not available here. It runs on the deployed site (Azure Static Web Apps).'
    );
  }

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data.error || 'The assistant is temporarily unavailable. Please try again.');
  }

  return { reply: data.reply || '', configured: data.configured !== false };
}
