import { describe, it, expect } from 'vitest';
import { buildWeddingContext } from './assistantService';

const wedding = { id: 'w1', coupleName: 'Asha & Ravi', date: '2025-11-20', venue: 'Grand Hall' };

const events = [
  { id: 'e1', name: 'Mehndi', date: '2025-11-18', inviteAll: false, guestIds: ['g1', 'g2'] },
  { id: 'e2', name: 'Reception', date: '2025-11-20', inviteAll: true, guestIds: [] },
];

const guests = [
  { id: 'g1', firstName: 'Asha', lastName: 'P', plusOne: true, rsvpStatus: { e1: 'accepted', e2: 'accepted' } },
  { id: 'g2', firstName: 'Ravi', lastName: 'K', plusOne: false, rsvpStatus: { e1: 'declined' } },
  { id: 'g3', firstName: 'Neha', lastName: 'S', plusOne: false, rsvpStatus: {} },
];

const budgetItems = [
  { category: 'Venue', estimated: 10000, actual: 12000, paid: 6000 },
  { category: 'Catering', estimated: 8000, actual: 7500, paid: 0 },
];

describe('buildWeddingContext', () => {
  it('includes the couple name, date and venue', () => {
    const text = buildWeddingContext(wedding, {});
    expect(text).toContain('Asha & Ravi');
    expect(text).toContain('2025-11-20');
    expect(text).toContain('Grand Hall');
  });

  it('counts guests and headcount including plus-ones', () => {
    const text = buildWeddingContext(wedding, { guests, events });
    expect(text).toContain('3 guest record(s)');
    // 3 guests + 1 plus-one = 4
    expect(text).toContain('~4 total headcount');
  });

  it('tallies invites and RSVPs per event', () => {
    const text = buildWeddingContext(wedding, { guests, events });
    // Mehndi: g1,g2 invited -> 1 accepted, 1 declined, 0 pending
    expect(text).toMatch(/Mehndi.*2 invited, 1 accepted, 1 declined, 0 pending/);
    // Reception: inviteAll -> all 3 invited, g1 accepted, others pending
    expect(text).toMatch(/Reception.*3 invited, 1 accepted, 0 declined, 2 pending/);
  });

  it('summarizes the budget', () => {
    const text = buildWeddingContext(wedding, { budgetItems, budgetTarget: 25000 });
    expect(text).toContain('Budget:');
    expect(text).toContain('Line items: 2');
  });

  it('handles an empty wedding gracefully', () => {
    const text = buildWeddingContext(wedding, {});
    expect(text).toContain('Events: none created yet.');
    expect(text).toContain('Budget: no budget items yet.');
  });

  it('falls back to a generic label when no couple name is set', () => {
    const text = buildWeddingContext({ id: 'x' }, {});
    expect(text).toContain('This wedding');
  });
});
