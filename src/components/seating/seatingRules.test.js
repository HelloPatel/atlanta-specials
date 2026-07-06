import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateSeatingRules, getGuestDisplayName, buildRuleDescription } from './seatingRules';

describe('seatingRules', () => {
  const makeGuest = (id, opts = {}) => ({
    id,
    firstName: opts.firstName || 'Guest',
    lastName: opts.lastName || id,
    familyName: opts.familyName || '',
    dietary: opts.dietary || 'vegetarian',
    ...opts,
  });

  const makeTable = (id, opts = {}) => ({
    id,
    name: opts.name || `Table ${id}`,
    capacity: opts.capacity || 10,
    assignedGuests: opts.assignedGuests || [],
    ...opts,
  });

  describe('getGuestDisplayName', () => {
    it('returns full name when both first and last exist', () => {
      expect(getGuestDisplayName({ firstName: 'Rushi', lastName: 'Patel' }))
        .toBe('Rushi Patel');
    });

    it('returns first name only when last is missing', () => {
      expect(getGuestDisplayName({ firstName: 'Rushi' })).toBe('Rushi');
    });

    it('falls back to familyName', () => {
      expect(getGuestDisplayName({ familyName: 'Patel Family' })).toBe('Patel Family');
    });

    it('returns "Unknown guest" for null', () => {
      expect(getGuestDisplayName(null)).toBe('Unknown guest');
    });

    it('returns "Unknown guest" for empty object', () => {
      expect(getGuestDisplayName({})).toBe('Unknown guest');
    });
  });

  describe('buildRuleDescription', () => {
    const guests = [
      makeGuest('g1', { firstName: 'Raj', lastName: 'Shah' }),
      makeGuest('g2', { firstName: 'Meena', lastName: 'Shah' }),
    ];

    it('describes keep-together rule', () => {
      const rule = { type: 'keep-together', guestIds: ['g1', 'g2'] };
      const desc = buildRuleDescription(rule, guests);
      expect(desc).toContain('Raj Shah');
      expect(desc).toContain('Meena Shah');
    });

    it('describes keep-apart rule', () => {
      const rule = { type: 'keep-apart', guestIds: ['g1', 'g2'] };
      const desc = buildRuleDescription(rule, guests);
      expect(desc).toContain('away from');
    });

    it('describes dietary-group rule', () => {
      const rule = { type: 'dietary-group' };
      const desc = buildRuleDescription(rule, guests);
      expect(desc).toContain('vegetarian');
    });

    it('uses custom description when provided', () => {
      const rule = { type: 'keep-together', description: 'Custom rule!' };
      expect(buildRuleDescription(rule, guests)).toBe('Custom rule!');
    });

    it('describes family-based rule', () => {
      const rule = { type: 'keep-together', familyName: 'Shah', guestIds: ['g1'] };
      const desc = buildRuleDescription(rule, guests);
      expect(desc).toContain('Shah family');
    });
  });

  describe('evaluateSeatingRules', () => {
    describe('no rules', () => {
      it('returns zero violations when no rules exist', () => {
        const result = evaluateSeatingRules([], [], []);
        expect(result.violationCount).toBe(0);
        expect(result.violations).toEqual([]);
        expect(result.tableWarnings).toEqual({});
      });
    });

    describe('keep-together rule', () => {
      const guests = [
        makeGuest('g1', { firstName: 'Raj', familyName: 'Shah' }),
        makeGuest('g2', { firstName: 'Meena', familyName: 'Shah' }),
        makeGuest('g3', { firstName: 'Vik', familyName: 'Patel' }),
      ];

      it('no violation when all guests are at same table', () => {
        const tables = [makeTable('t1', { assignedGuests: ['g1', 'g2'] })];
        const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });

      it('violation when guests are split across tables', () => {
        const tables = [
          makeTable('t1', { assignedGuests: ['g1'] }),
          makeTable('t2', { assignedGuests: ['g2'] }),
        ];
        const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(1);
        expect(result.violations[0].ruleType).toBe('keep-together');
        expect(result.violations[0].tableIds).toContain('t1');
        expect(result.violations[0].tableIds).toContain('t2');
      });

      it('violation when some guests are unseated', () => {
        const tables = [makeTable('t1', { assignedGuests: ['g1'] })];
        const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(1);
        expect(result.violations[0].message).toContain('still need seats');
      });

      it('no violation when none are seated yet', () => {
        const tables = [makeTable('t1', { assignedGuests: [] })];
        const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });
    });

    describe('keep-apart rule', () => {
      const guests = [
        makeGuest('g1', { firstName: 'Raj' }),
        makeGuest('g2', { firstName: 'Suresh' }),
      ];

      it('no violation when guests are at different tables', () => {
        const tables = [
          makeTable('t1', { assignedGuests: ['g1'] }),
          makeTable('t2', { assignedGuests: ['g2'] }),
        ];
        const rules = [{ id: 'r1', type: 'keep-apart', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });

      it('violation when guests are at same table', () => {
        const tables = [makeTable('t1', { assignedGuests: ['g1', 'g2'] })];
        const rules = [{ id: 'r1', type: 'keep-apart', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(1);
        expect(result.violations[0].tableIds).toContain('t1');
      });

      it('no violation when only one guest is seated', () => {
        const tables = [makeTable('t1', { assignedGuests: ['g1'] })];
        const rules = [{ id: 'r1', type: 'keep-apart', guestIds: ['g1', 'g2'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });
    });

    describe('dietary-group rule', () => {
      it('violation when veg and non-veg guests share a table', () => {
        const guests = [
          makeGuest('g1', { dietary: 'vegetarian' }),
          makeGuest('g2', { dietary: 'non-veg' }),
        ];
        const tables = [makeTable('t1', { assignedGuests: ['g1', 'g2'] })];
        const rules = [{ id: 'r1', type: 'dietary-group' }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(1);
        expect(result.violations[0].message).toContain('mix');
      });

      it('no violation when all guests are veg', () => {
        const guests = [
          makeGuest('g1', { dietary: 'vegetarian' }),
          makeGuest('g2', { dietary: 'jain' }),
          makeGuest('g3', { dietary: 'vegan' }),
        ];
        const tables = [makeTable('t1', { assignedGuests: ['g1', 'g2', 'g3'] })];
        const rules = [{ id: 'r1', type: 'dietary-group' }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });

      it('no violation on empty table', () => {
        const tables = [makeTable('t1', { assignedGuests: [] })];
        const rules = [{ id: 'r1', type: 'dietary-group' }];
        const result = evaluateSeatingRules(rules, [], tables);
        expect(result.violationCount).toBe(0);
      });

      it('classifies jain as veg (no conflict with vegetarian)', () => {
        const guests = [
          makeGuest('g1', { dietary: 'jain' }),
          makeGuest('g2', { dietary: 'vegetarian' }),
        ];
        const tables = [makeTable('t1', { assignedGuests: ['g1', 'g2'] })];
        const rules = [{ id: 'r1', type: 'dietary-group' }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });
    });

    describe('tableWarnings map', () => {
      it('maps violations to correct table IDs', () => {
        const guests = [
          makeGuest('g1', { dietary: 'vegetarian' }),
          makeGuest('g2', { dietary: 'non-veg' }),
          makeGuest('g3', { dietary: 'vegetarian' }),
        ];
        const tables = [
          makeTable('t1', { assignedGuests: ['g1', 'g2'] }),
          makeTable('t2', { assignedGuests: ['g3'] }),
        ];
        const rules = [{ id: 'r1', type: 'dietary-group' }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.tableWarnings['t1']).toHaveLength(1);
        expect(result.tableWarnings['t2']).toBeUndefined();
        expect(result.tablesWithWarnings).toBe(1);
      });
    });

    describe('edge cases', () => {
      it('handles null/undefined rules gracefully', () => {
        const result = evaluateSeatingRules([null, undefined, { type: null }], [], []);
        expect(result.violationCount).toBe(0);
      });

      it('handles rule with less than 2 guests', () => {
        const guests = [makeGuest('g1')];
        const tables = [makeTable('t1', { assignedGuests: ['g1'] })];
        const rules = [{ id: 'r1', type: 'keep-together', guestIds: ['g1'] }];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(0);
      });

      it('handles multiple rules simultaneously', () => {
        const guests = [
          makeGuest('g1', { dietary: 'vegetarian' }),
          makeGuest('g2', { dietary: 'non-veg' }),
          makeGuest('g3', { dietary: 'vegetarian' }),
        ];
        const tables = [
          makeTable('t1', { assignedGuests: ['g1', 'g2'] }),
          makeTable('t2', { assignedGuests: ['g3'] }),
        ];
        const rules = [
          { id: 'r1', type: 'dietary-group' },
          { id: 'r2', type: 'keep-together', guestIds: ['g1', 'g3'] },
        ];
        const result = evaluateSeatingRules(rules, tables, guests);
        expect(result.violationCount).toBe(2); // dietary + split
      });
    });
  });
});
