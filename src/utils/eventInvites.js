// Pure helpers that connect guests <-> events through the single source of
// truth on each event: `event.inviteAll` (everyone is invited) and
// `event.guestIds` (explicit guest list). Everything else in the app —
// RSVP, the public website, dashboards, counts — reads from these two fields,
// so keeping them correct keeps the whole app connected.

const norm = (value) => String(value ?? '').trim().toLowerCase();

/** Is this guest invited to this event? */
export function guestInvitedToEvent(event, guestId) {
  if (!event || !guestId) return false;
  if (event.inviteAll) return true;
  return (event.guestIds || []).includes(guestId);
}

/** All events a guest is invited to (includes invite-all events). */
export function invitedEventsForGuest(guest, events = []) {
  if (!guest) return [];
  return events.filter((event) => guestInvitedToEvent(event, guest.id));
}

/** Event names a guest is invited to, for display / CSV export. */
export function invitedEventNamesForGuest(guest, events = []) {
  return invitedEventsForGuest(guest, events)
    .map((event) => event.name)
    .filter(Boolean);
}

/** Parse a comma/semicolon separated CSV cell into unique event names. */
export function parseInvitedEventNames(raw) {
  return [
    ...new Set(
      String(raw ?? '')
        .split(/[,;]/)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * Given the full events list and a batch of { guestId, eventNames } entries,
 * compute the minimal set of event updates so those guests become invited to
 * the named events. Invite-all events are skipped (already invited) and
 * unknown names are ignored. Matching is case-insensitive on the event name.
 *
 * Returns [{ eventId, guestIds }] only for events whose guest list changed.
 */
export function resolveInvitedEventUpdates(events = [], entries = []) {
  const byName = new Map();
  events.forEach((event) => {
    if (event?.name) byName.set(norm(event.name), event);
  });

  const working = new Map(); // eventId -> Set<guestId>
  const touched = new Set(); // eventIds that actually changed

  entries.forEach(({ guestId, eventNames }) => {
    if (!guestId) return;
    (eventNames || []).forEach((name) => {
      const event = byName.get(norm(name));
      if (!event || event.inviteAll) return;
      if (!working.has(event.id)) working.set(event.id, new Set(event.guestIds || []));
      const set = working.get(event.id);
      if (!set.has(guestId)) {
        set.add(guestId);
        touched.add(event.id);
      }
    });
  });

  return [...touched].map((eventId) => ({
    eventId,
    guestIds: [...working.get(eventId)],
  }));
}
