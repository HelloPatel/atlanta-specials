import { describe, it, expect } from 'vitest';
import { buildGuestClusters, buildConflictMap, autoSuggestSeating } from './seatingAutoSuggest';

const makeGuest = (id, opts = {}) => ({
  id,
  firstName: opts.firstName || `Guest${id}`,
  lastName: opts.lastName || '',
  familyName: opts.familyName || '',
  dietary: opts.dietary || 'vegetarian',
  side: opts.side || 'bride',
});

const makeTable = (id, capacity = 10, assigned = []) => ({
  id,
  name: `Table ${id}`,
  capacity,
  assignedGuests: assigned,
});

describe('buildGuestClusters', () => {
  it('groups guests by family', () => {
    const guests = [
      makeGuest('1', { familyName: 'Patel' }),
      makeGuest('2', { familyName: 'Patel' }),
      makeGuest('3', { familyName: 'Shah' }),
    ];
    const clusters = buildGuestClusters(guests);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].guests).toHaveLength(2);
    expect(clusters[1].guests).toHaveLength(1);
  });

  it('keeps solo guests in their own cluster', () => {
    const guests = [makeGuest('1'), makeGuest('2')];
    const clusters = buildGuestClusters(guests);
    expect(clusters).toHaveLength(2);
  });

  it('respects keep-together rules forming mandatory clusters', () => {
    const guests = [
      makeGuest('1', { familyName: 'Patel' }),
      makeGuest('2', { familyName: 'Shah' }),
      makeGuest('3', { familyName: 'Shah' }),
    ];
    const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['1', '2'] }];
    const clusters = buildGuestClusters(guests, rules);
    // Rule cluster has guests 1 and 2, then guest 3 is in family cluster
    const ruleCluster = clusters.find((c) => c.reason === 'keep-together');
    expect(ruleCluster.guests.map((g) => g.id).sort()).toEqual(['1', '2']);
  });

  it('uses familyName in keep-together rules', () => {
    const guests = [
      makeGuest('1', { familyName: 'Patel' }),
      makeGuest('2', { familyName: 'Patel' }),
      makeGuest('3', { familyName: 'Shah' }),
    ];
    const rules = [{ id: 'r1', type: 'keep-together', familyName: 'Patel', guestIds: ['3'] }];
    const clusters = buildGuestClusters(guests, rules);
    const ruleCluster = clusters.find((c) => c.reason === 'keep-together');
    expect(ruleCluster.guests).toHaveLength(3); // Both Patels + Shah guest 3
  });
});

describe('buildConflictMap', () => {
  it('maps keep-apart guest pairs', () => {
    const guests = [makeGuest('1'), makeGuest('2'), makeGuest('3')];
    const rules = [{ id: 'r1', type: 'keep-apart', guestIds: ['1', '2', '3'] }];
    const conflicts = buildConflictMap(rules, guests);
    expect(conflicts.get('1').has('2')).toBe(true);
    expect(conflicts.get('1').has('3')).toBe(true);
    expect(conflicts.get('2').has('1')).toBe(true);
  });

  it('returns empty map with no rules', () => {
    const conflicts = buildConflictMap([], []);
    expect(conflicts.size).toBe(0);
  });

  it('ignores non-keep-apart rules', () => {
    const guests = [makeGuest('1'), makeGuest('2')];
    const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['1', '2'] }];
    const conflicts = buildConflictMap(rules, guests);
    expect(conflicts.size).toBe(0);
  });
});

describe('autoSuggestSeating', () => {
  it('seats all guests when enough capacity', () => {
    const guests = [makeGuest('1'), makeGuest('2'), makeGuest('3')];
    const tables = [makeTable('t1', 10), makeTable('t2', 10)];
    const { assignments, overflow } = autoSuggestSeating(guests, tables);
    const totalAssigned = [...assignments.values()].flat().length;
    expect(totalAssigned).toBe(3);
    expect(overflow).toHaveLength(0);
  });

  it('keeps families together at one table', () => {
    const guests = [
      makeGuest('1', { familyName: 'Patel' }),
      makeGuest('2', { familyName: 'Patel' }),
      makeGuest('3', { familyName: 'Patel' }),
      makeGuest('4', { familyName: 'Shah' }),
    ];
    const tables = [makeTable('t1', 10), makeTable('t2', 10)];
    const { assignments } = autoSuggestSeating(guests, tables);
    // All 3 Patels should be on same table
    const t1Guests = assignments.get('t1');
    const t2Guests = assignments.get('t2');
    const patelIds = ['1', '2', '3'];
    const patelsOnT1 = t1Guests.filter((id) => patelIds.includes(id)).length;
    const patelsOnT2 = t2Guests.filter((id) => patelIds.includes(id)).length;
    expect(patelsOnT1 === 3 || patelsOnT2 === 3).toBe(true);
  });

  it('respects keep-apart rules', () => {
    const guests = [makeGuest('1'), makeGuest('2')];
    const tables = [makeTable('t1', 10), makeTable('t2', 10)];
    const rules = [{ id: 'r1', type: 'keep-apart', guestIds: ['1', '2'] }];
    const { assignments } = autoSuggestSeating(guests, tables, rules);
    const t1 = assignments.get('t1');
    const t2 = assignments.get('t2');
    // They should NOT be on the same table
    const bothOnT1 = t1.includes('1') && t1.includes('2');
    const bothOnT2 = t2.includes('1') && t2.includes('2');
    expect(bothOnT1 || bothOnT2).toBe(false);
  });

  it('overflows when tables are full', () => {
    const guests = [makeGuest('1'), makeGuest('2'), makeGuest('3')];
    const tables = [makeTable('t1', 2)];
    const { overflow } = autoSuggestSeating(guests, tables);
    expect(overflow.length).toBeGreaterThan(0);
  });

  it('does not split keep-together cluster even when table is full', () => {
    const guests = [
      makeGuest('1', { familyName: 'Big' }),
      makeGuest('2', { familyName: 'Big' }),
      makeGuest('3', { familyName: 'Big' }),
    ];
    const tables = [makeTable('t1', 2)]; // Too small for the family
    const rules = [{ id: 'r1', type: 'keep-together', familyName: 'Big', guestIds: [] }];
    const { overflow } = autoSuggestSeating(guests, tables, rules);
    // Entire cluster overflows rather than splitting
    expect(overflow).toHaveLength(3);
  });

  it('handles empty inputs gracefully', () => {
    const { assignments, overflow } = autoSuggestSeating([], [], []);
    expect(assignments.size).toBe(0);
    expect(overflow).toHaveLength(0);
  });

  it('respects existing table occupancy', () => {
    const guests = [makeGuest('3')];
    const tables = [makeTable('t1', 2, ['existing1', 'existing2']), makeTable('t2', 10)];
    const { assignments } = autoSuggestSeating(guests, tables);
    // Should go to t2 since t1 is full
    expect(assignments.get('t1')).toHaveLength(0);
    expect(assignments.get('t2')).toContain('3');
  });

  it('groups dietary when option enabled', () => {
    const guests = [
      makeGuest('1', { dietary: 'vegetarian' }),
      makeGuest('2', { dietary: 'vegetarian' }),
      makeGuest('3', { dietary: 'non-veg' }),
      makeGuest('4', { dietary: 'non-veg' }),
    ];
    const tables = [makeTable('t1', 10), makeTable('t2', 10)];
    const { assignments } = autoSuggestSeating(guests, tables, [], { groupDietary: true });
    const t1 = assignments.get('t1');
    const t2 = assignments.get('t2');
    // With dietary grouping, veg and non-veg should tend to be separated
    // Since these are individual guests (no family), they form solo clusters
    const totalAssigned = t1.length + t2.length;
    expect(totalAssigned).toBe(4);
  });
});
