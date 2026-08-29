import { describe, it, expect } from 'vitest';
import {
  guestInvitedToEvent,
  invitedEventNamesForGuest,
  parseInvitedEventNames,
  resolveInvitedEventUpdates,
} from './eventInvites';

const events = [
  { id: 'e1', name: 'Ceremony', inviteAll: true, guestIds: [] },
  { id: 'e2', name: 'Reception', inviteAll: false, guestIds: ['g1'] },
  { id: 'e3', name: 'Mehndi', inviteAll: false, guestIds: [] },
];

describe('guestInvitedToEvent', () => {
  it('returns true for invite-all events regardless of guestIds', () => {
    expect(guestInvitedToEvent(events[0], 'anyone')).toBe(true);
  });
  it('returns true only for listed guests on restricted events', () => {
    expect(guestInvitedToEvent(events[1], 'g1')).toBe(true);
    expect(guestInvitedToEvent(events[1], 'g2')).toBe(false);
  });
});

describe('invitedEventNamesForGuest', () => {
  it('includes invite-all and explicitly-listed events', () => {
    const names = invitedEventNamesForGuest({ id: 'g1' }, events);
    expect(names).toEqual(['Ceremony', 'Reception']);
  });
  it('lists only invite-all events for an unlisted guest', () => {
    expect(invitedEventNamesForGuest({ id: 'g9' }, events)).toEqual(['Ceremony']);
  });
});

describe('parseInvitedEventNames', () => {
  it('splits on commas and semicolons and dedupes', () => {
    expect(parseInvitedEventNames('Reception, Mehndi; Reception')).toEqual([
      'Reception',
      'Mehndi',
    ]);
  });
  it('handles empty input', () => {
    expect(parseInvitedEventNames('')).toEqual([]);
    expect(parseInvitedEventNames(null)).toEqual([]);
  });
});

describe('resolveInvitedEventUpdates', () => {
  it('adds guests to matching restricted events, case-insensitively', () => {
    const updates = resolveInvitedEventUpdates(events, [
      { guestId: 'g2', eventNames: ['reception', 'MEHNDI'] },
    ]);
    const byId = Object.fromEntries(updates.map((u) => [u.eventId, u.guestIds]));
    expect(byId.e2.sort()).toEqual(['g1', 'g2']);
    expect(byId.e3).toEqual(['g2']);
    expect(byId.e1).toBeUndefined(); // invite-all is skipped
  });

  it('skips invite-all events and unknown names', () => {
    const updates = resolveInvitedEventUpdates(events, [
      { guestId: 'g5', eventNames: ['Ceremony', 'Nonexistent'] },
    ]);
    expect(updates).toEqual([]);
  });

  it('returns nothing when the guest is already invited', () => {
    const updates = resolveInvitedEventUpdates(events, [
      { guestId: 'g1', eventNames: ['Reception'] },
    ]);
    expect(updates).toEqual([]);
  });

  it('merges multiple guests into one event update', () => {
    const updates = resolveInvitedEventUpdates(events, [
      { guestId: 'g2', eventNames: ['Mehndi'] },
      { guestId: 'g3', eventNames: ['Mehndi'] },
    ]);
    expect(updates).toHaveLength(1);
    expect(updates[0].eventId).toBe('e3');
    expect(updates[0].guestIds.sort()).toEqual(['g2', 'g3']);
  });
});
