// Executors for the write actions the AI assistant can PROPOSE. The model never
// runs these — the backend hands proposed tool calls to the chat UI, which shows
// a confirmation card and, on approval, runs the matching executor here through
// the app's normal auth-scoped service functions.
//
// Tool arguments use human NAMES (guest name, event name, table name). We resolve
// those to IDs against the live `guests` / `events` the chat already subscribes to,
// so the model never has to know internal IDs and can't invent them.

import { addGuest, updateGuest, deleteGuest } from './guestService';
import { updateEvent, applyInvitedEventUpdates } from './eventService';
import { getSeating, saveSeating } from './seatingService';
import { resolveGuestInviteUpdates, guestInvitedToEvent } from '../utils/eventInvites';

const norm = (value) => String(value ?? '').trim().toLowerCase();

const guestFullName = (g) => [g?.firstName, g?.lastName].filter(Boolean).join(' ').trim();

class ActionError extends Error {}

// ─── Resolvers ───────────────────────────────────────────────────────────────
function resolveGuest(name, guests = []) {
  const query = norm(name);
  if (!query) throw new ActionError('No guest name was given.');

  const exact = guests.filter((g) => norm(guestFullName(g)) === query);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new ActionError(
      `More than one guest is named "${name}". Please be more specific.`
    );
  }

  // Fall back to first-name / last-name / contains matches when unambiguous.
  const partial = guests.filter((g) => {
    const full = norm(guestFullName(g));
    return (
      norm(g.firstName) === query ||
      norm(g.lastName) === query ||
      full.includes(query)
    );
  });
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const names = partial.slice(0, 6).map(guestFullName).join(', ');
    throw new ActionError(
      `"${name}" matches several guests (${names}). Please use their full name.`
    );
  }
  throw new ActionError(`I couldn't find a guest named "${name}" on the list.`);
}

function resolveEvent(name, events = []) {
  const query = norm(name);
  if (!query) throw new ActionError('No event name was given.');

  const exact = events.filter((e) => norm(e.name) === query);
  if (exact.length === 1) return exact[0];

  const partial = events.filter(
    (e) => norm(e.name).includes(query) || query.includes(norm(e.name))
  );
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const names = partial.slice(0, 6).map((e) => e.name).join(', ');
    throw new ActionError(
      `"${name}" matches several events (${names}). Please name just one.`
    );
  }
  throw new ActionError(`I couldn't find an event called "${name}".`);
}

function resolveTable(name, tables = []) {
  const query = norm(name);
  if (!query) throw new ActionError('No table name was given.');

  const exact = tables.filter((t) => norm(t.name) === query);
  if (exact.length === 1) return exact[0];

  // Allow "table 4" -> a table named "Table 4", or a bare number.
  const numMatch = query.match(/(\d+)/);
  if (numMatch) {
    const num = numMatch[1];
    const byNum = tables.filter((t) => (norm(t.name).match(/(\d+)/) || [])[1] === num);
    if (byNum.length === 1) return byNum[0];
  }

  const partial = tables.filter((t) => norm(t.name).includes(query));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const names = partial.slice(0, 6).map((t) => t.name).join(', ');
    throw new ActionError(`"${name}" matches several tables (${names}).`);
  }
  throw new ActionError(`I couldn't find a table called "${name}" for that event.`);
}

// ─── Human-readable summaries for the confirmation card ─────────────────────────
// Returns { label, destructive, error }. `error` is set when the action can't be
// resolved against the current data, so the card can show why instead of a button.
export function describeAction(name, args = {}, ctx = {}) {
  const { guests = [], events = [] } = ctx;
  try {
    switch (name) {
      case 'add_guest': {
        const full = [args.firstName, args.lastName].filter(Boolean).join(' ').trim();
        if (!full) throw new ActionError('A first name is required to add a guest.');
        const bits = [];
        if (args.side) bits.push(`${args.side} side`);
        if (args.relation) bits.push(args.relation);
        if (args.plusOne) bits.push(args.plusOneName ? `+1 (${args.plusOneName})` : '+1');
        const invited = (args.invitedEvents || [])
          .map((n) => resolveEvent(n, events).name);
        const invitePart = invited.length ? `, invite to ${invited.join(', ')}` : '';
        const meta = bits.length ? ` (${bits.join(', ')})` : '';
        return { label: `Add guest ${full}${meta}${invitePart}` };
      }
      case 'update_guest': {
        const guest = resolveGuest(args.guestName, guests);
        const fields = describeGuestChanges(args);
        if (!fields.length) throw new ActionError('No details to update were given.');
        return { label: `Update ${guestFullName(guest)}: ${fields.join(', ')}` };
      }
      case 'set_guest_rsvp': {
        const guest = resolveGuest(args.guestName, guests);
        const event = resolveEvent(args.eventName, events);
        const status = normalizeStatus(args.status);
        const verb = status === 'pending' ? 'not responded' : status;
        return { label: `Mark ${guestFullName(guest)} as ${verb} for ${event.name}` };
      }
      case 'set_guest_invite': {
        const guest = resolveGuest(args.guestName, guests);
        const event = resolveEvent(args.eventName, events);
        if (event.inviteAll) {
          throw new ActionError(
            `"${event.name}" invites everyone, so invites can't be changed per guest here. Turn off "invite all" on the Events page first.`
          );
        }
        return {
          label: args.invited
            ? `Invite ${guestFullName(guest)} to ${event.name}`
            : `Remove ${guestFullName(guest)}'s invite to ${event.name}`,
        };
      }
      case 'assign_guest_table': {
        const guest = resolveGuest(args.guestName, guests);
        const event = resolveEvent(args.eventName, events);
        return {
          label: `Seat ${guestFullName(guest)} at ${args.tableName} for ${event.name}`,
          // Table existence is checked at execute time (seating is loaded then).
        };
      }
      case 'delete_guest': {
        const guest = resolveGuest(args.guestName, guests);
        return { label: `Delete guest ${guestFullName(guest)}`, destructive: true };
      }
      default:
        return { label: name, error: `Unknown action "${name}".` };
    }
  } catch (err) {
    return {
      label: fallbackLabel(name, args),
      destructive: name === 'delete_guest',
      error: err instanceof ActionError ? err.message : 'This action could not be prepared.',
    };
  }
}

function describeGuestChanges(args) {
  const map = {
    email: 'email',
    phone: 'phone',
    side: 'side',
    relation: 'relation',
    dietary: 'dietary',
    dietaryNotes: 'dietary notes',
    notes: 'notes',
    plusOne: 'plus-one',
    plusOneName: 'plus-one name',
  };
  const out = [];
  for (const key of Object.keys(map)) {
    if (args[key] === undefined) continue;
    if (key === 'plusOne') out.push(args.plusOne ? 'plus-one on' : 'plus-one off');
    else out.push(`${map[key]} \u2192 ${args[key]}`);
  }
  return out;
}

function fallbackLabel(name, args) {
  const who = args.guestName || [args.firstName, args.lastName].filter(Boolean).join(' ');
  return who ? `${name.replace(/_/g, ' ')}: ${who}` : name.replace(/_/g, ' ');
}

function normalizeStatus(status) {
  const s = norm(status);
  if (['accepted', 'yes', 'attending', 'accept'].includes(s)) return 'accepted';
  if (['declined', 'no', 'not attending', 'decline'].includes(s)) return 'declined';
  if (['pending', 'no response', 'none', 'unknown'].includes(s)) return 'pending';
  throw new ActionError(`"${status}" isn't a valid RSVP status.`);
}

// ─── Execution ─────────────────────────────────────────────────────────────────
// Runs the change via the app's services. Returns a short success message.
// Throws on failure (message is shown to the user).
export async function executeAction(name, args = {}, ctx = {}) {
  const { weddingId, guests = [], events = [] } = ctx;
  if (!weddingId) throw new Error('No wedding is open, so I can\u2019t make changes.');

  switch (name) {
    case 'add_guest': {
      const firstName = String(args.firstName || '').trim();
      if (!firstName) throw new Error('A first name is required to add a guest.');
      const invitedEventIds = (args.invitedEvents || []).map(
        (n) => resolveEvent(n, events).id
      );
      const newId = await addGuest(weddingId, {
        firstName,
        lastName: String(args.lastName || '').trim(),
        side: args.side === 'groom' ? 'groom' : args.side === 'bride' ? 'bride' : undefined,
        relation: args.relation,
        plusOne: !!args.plusOne,
        plusOneName: args.plusOneName,
        dietary: args.dietary,
      });
      if (invitedEventIds.length) {
        const updates = resolveGuestInviteUpdates(events, newId, invitedEventIds);
        if (updates.length) await applyInvitedEventUpdates(weddingId, updates);
      }
      return `Added ${[firstName, args.lastName].filter(Boolean).join(' ')}.`;
    }

    case 'update_guest': {
      const guest = resolveGuest(args.guestName, guests);
      const data = {};
      for (const key of ['email', 'phone', 'side', 'relation', 'dietary', 'dietaryNotes', 'notes', 'plusOneName']) {
        if (args[key] !== undefined) data[key] = args[key];
      }
      if (args.plusOne !== undefined) data.plusOne = !!args.plusOne;
      if (data.side && data.side !== 'bride' && data.side !== 'groom') delete data.side;
      if (!Object.keys(data).length) throw new Error('No details to update were given.');
      await updateGuest(weddingId, guest.id, data);
      return `Updated ${guestFullName(guest)}.`;
    }

    case 'set_guest_rsvp': {
      const guest = resolveGuest(args.guestName, guests);
      const event = resolveEvent(args.eventName, events);
      const status = normalizeStatus(args.status);
      const rsvpStatus = { ...(guest.rsvpStatus || {}), [event.id]: status };
      await updateGuest(weddingId, guest.id, { rsvpStatus });
      return `Set ${guestFullName(guest)}'s RSVP for ${event.name} to ${status}.`;
    }

    case 'set_guest_invite': {
      const guest = resolveGuest(args.guestName, guests);
      const event = resolveEvent(args.eventName, events);
      if (event.inviteAll) {
        throw new Error(
          `"${event.name}" invites everyone. Turn off "invite all" on the Events page to change individual invites.`
        );
      }
      const current = event.guestIds || [];
      const has = current.includes(guest.id);
      if (!!args.invited === has) {
        return `${guestFullName(guest)} is already ${has ? 'invited to' : 'not invited to'} ${event.name}.`;
      }
      const guestIds = args.invited
        ? [...current, guest.id]
        : current.filter((id) => id !== guest.id);
      await updateEvent(weddingId, event.id, { guestIds });
      return args.invited
        ? `Invited ${guestFullName(guest)} to ${event.name}.`
        : `Removed ${guestFullName(guest)}'s invite to ${event.name}.`;
    }

    case 'assign_guest_table': {
      const guest = resolveGuest(args.guestName, guests);
      const event = resolveEvent(args.eventName, events);
      if (!guestInvitedToEvent(event, guest.id)) {
        throw new Error(`${guestFullName(guest)} isn't invited to ${event.name}, so they can't be seated there.`);
      }
      const seating = await getSeating(weddingId, event.id);
      const tables = (seating.tables || []).map((t) => ({ ...t, assignedGuests: [...(t.assignedGuests || [])] }));
      if (!tables.length) throw new Error(`There are no tables set up for ${event.name} yet.`);
      const target = resolveTable(args.tableName, tables);
      // Remove from any current table, then add to the target.
      tables.forEach((t) => {
        t.assignedGuests = t.assignedGuests.filter((id) => id !== guest.id);
      });
      target.assignedGuests.push(guest.id);
      await saveSeating(weddingId, event.id, { ...seating, tables });
      const over = target.assignedGuests.length > (target.capacity || 0);
      return `Seated ${guestFullName(guest)} at ${target.name} for ${event.name}.${over ? ' (Note: that table is now over capacity.)' : ''}`;
    }

    case 'delete_guest': {
      const guest = resolveGuest(args.guestName, guests);
      await deleteGuest(weddingId, guest.id);
      return `Deleted ${guestFullName(guest)}.`;
    }

    default:
      throw new Error(`I don't know how to perform "${name}".`);
  }
}
