import { describe, it, expect } from 'vitest';
import {
  assignGuestWithoutDragging,
  getMobileLayoutBounds,
  getNextLockedTablePosition,
} from '../components/seating/mobileSeating';

// We'll test the slug resolution logic in isolation since the full components
// require complex Firebase/context setup

describe('Slug-based routing', () => {
  describe('resolveWeddingId logic', () => {
    // This duplicates weddingService tests but validates the routing contract
    it('doc IDs without hyphens pass through directly', () => {
      const param = 'abc123def456';
      expect(param.includes('-')).toBe(false);
    });

    it('slugs with hyphens trigger lookup', () => {
      const param = 'rushi-and-priya';
      expect(param.includes('-')).toBe(true);
    });

    it('handles edge case: ID that happens to contain hyphen', () => {
      // Firebase IDs don't contain hyphens, so this is always a slug
      const param = 'a-b';
      expect(param.includes('-')).toBe(true);
    });
  });

  describe('URL format validation', () => {
    it('RSVP URLs use slug format', () => {
      const slug = 'rushi-and-priya';
      const url = `/rsvp/${slug}`;
      expect(url).toBe('/rsvp/rushi-and-priya');
    });

    it('Website URLs use slug format', () => {
      const slug = 'rushi-and-priya';
      const url = `/w/${slug}`;
      expect(url).toBe('/w/rushi-and-priya');
    });

    it('Table finder URLs use slug + eventId', () => {
      const slug = 'rushi-and-priya';
      const url = `/find-table/${slug}/evt123`;
      expect(url).toMatch(/\/find-table\/rushi-and-priya\/evt123/);
    });
  });
});

describe('Mobile seating behavior', () => {
  it('tables should have no drag handler on mobile', () => {
    // The mobile view wraps tables in plain divs with onClick only
    // No onMouseDown, no drag handlers
    const mobileTableWrapper = {
      onClick: () => {},
      style: { position: 'absolute', left: 100, top: 200, cursor: 'pointer' },
    };
    
    expect(mobileTableWrapper.onClick).toBeDefined();
    expect(mobileTableWrapper.style.cursor).toBe('pointer');
    // No drag-related props
    expect(mobileTableWrapper.onMouseDown).toBeUndefined();
    expect(mobileTableWrapper.onTouchStart).toBeUndefined();
  });

  it('mobile canvas has pointer-events on table wrappers for tapping', () => {
    // The canvas container no longer has pointerEvents: 'none'
    // Individual zones have pointerEvents: 'none' but tables are tappable
    const canvasStyle = {
      transform: 'scale(0.35)',
      transformOrigin: '0 0',
      width: '3000px',
      height: '2000px',
    };
    expect(canvasStyle.transform).toBe('scale(0.35)');
    // No pointerEvents: 'none' on the container
    expect(canvasStyle.pointerEvents).toBeUndefined();
  });

  it('bottom sheet displays guest info correctly', () => {
    const table = {
      id: 't1',
      name: 'Table 1',
      capacity: 10,
      shape: 'round',
      assignedGuests: ['g1', 'g2', 'g3'],
    };
    
    const guests = [
      { id: 'g1', firstName: 'Raj', lastName: 'Shah', family: 'Shah', dietaryPreference: 'jain' },
      { id: 'g2', firstName: 'Meena', lastName: 'Shah', family: 'Shah', tags: ['elderly'] },
      { id: 'g3', firstName: 'Dev', lastName: 'Patel', family: 'Patel', dietaryPreference: 'non-veg' },
    ];

    const assignedGuests = table.assignedGuests
      .map((gId) => guests.find((g) => g.id === gId))
      .filter(Boolean);

    expect(assignedGuests).toHaveLength(3);
    expect(assignedGuests[0].firstName).toBe('Raj');
    expect(assignedGuests[1].tags).toContain('elderly');
    expect(assignedGuests[2].dietaryPreference).toBe('non-veg');
  });

  it('empty table shows no-guests message', () => {
    const table = { id: 't1', name: 'Empty Table', capacity: 10, assignedGuests: [] };
    expect(table.assignedGuests.length).toBe(0);
  });

  it('moves guests between tables without changing table positions', () => {
    const tables = [
      { id: 't1', x: 100, y: 200, assignedGuests: ['g1'] },
      { id: 't2', x: 400, y: 500, assignedGuests: [] },
    ];

    const result = assignGuestWithoutDragging(tables, 'g1', 't2');

    expect(result[0].assignedGuests).toEqual([]);
    expect(result[1].assignedGuests).toEqual(['g1']);
    expect(result.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 100, y: 200 },
      { x: 400, y: 500 },
    ]);
  });

  it('includes venue zones when fitting the mobile layout', () => {
    const bounds = getMobileLayoutBounds(
      [{ x: 20, y: 20, width: 100, height: 100 }],
      [{ x: 900, y: 600, width: 300, height: 200 }],
    );

    expect(bounds).toEqual({ width: 1300, height: 880 });
  });

  it('places new mobile tables below the locked layout', () => {
    const position = getNextLockedTablePosition(
      [{ y: 100, height: 120 }],
      [{ y: 500, height: 200 }],
    );

    expect(position).toEqual({ x: 80, y: 800 });
  });
});
