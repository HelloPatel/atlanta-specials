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

  // ── Compact coded RSVP roster ──────────────────────────────────────────
  // We ship the WHOLE roster (not a sample) so the assistant can answer any
  // "who is invited / who accepted / who hasn't RSVP'd to X" question, but we
  // encode it tightly to stay cheap: events are numbered E1..En and statuses
  // are single letters (a=accepted, d=declined, p=pending). Each guest is one
  // line listing only the events they're invited to. This is placed LAST and
  // is the largest, most stable block, which also helps prompt caching.
  if (guests.length && events.length) {
    const evList = [...events].sort((a, b) =>
      String(a.date || '').localeCompare(String(b.date || ''))
    );
    const codeFor = new Map(evList.map((ev, i) => [ev.id, `E${i + 1}`]));

    lines.push('');
    lines.push('RSVP roster (source of truth for guest-level RSVP questions).');
    lines.push(
      'Event codes: ' +
        evList.map((ev, i) => `E${i + 1}=${ev.name || 'Untitled'}`).join(' ')
    );
    lines.push('Status letters: a=accepted, d=declined, p=pending (p = has NOT responded).');
    lines.push('Format: Full Name | <event><status>,...  (only events the guest is invited to)');

    const roster = [];
    for (const g of guests) {
      const name = fullName(g) || 'Unnamed guest';
      const codes = [];
      for (const ev of evList) {
        if (!guestInvitedToEvent(ev, g.id)) continue;
        const st = rsvpFor(g, ev.id);
        const letter = st === 'accepted' ? 'a' : st === 'declined' ? 'd' : 'p';
        codes.push(`${codeFor.get(ev.id)}${letter}`);
      }
      if (g.plusOne) codes.push('+1');
      roster.push(`${name} | ${codes.join(',') || '(no events)'}`);
    }
    lines.push(...roster);
  } else if (guests.length) {
    // No events yet — just list names so "who is on the guest list" works.
    lines.push('');
    lines.push('Guest list (no events created yet):');
    lines.push(guests.map((g) => fullName(g) || 'Unnamed guest').join(', '));
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

  return {
    reply: data.reply || '',
    actions: Array.isArray(data.actions) ? data.actions : [],
    configured: data.configured !== false,
  };
}
