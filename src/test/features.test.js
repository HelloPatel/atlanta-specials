import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('CommandPalette logic', () => {
  const COMMANDS = [
    { id: 'dashboard', label: 'Go to Dashboard', keywords: 'home overview' },
    { id: 'guests', label: 'Go to Guest List', keywords: 'people family import' },
    { id: 'events', label: 'Go to Events', keywords: 'mehndi sangeet ceremony reception' },
    { id: 'seating', label: 'Go to Seating Chart', keywords: 'tables arrange drag drop' },
    { id: 'rsvp', label: 'Go to RSVPs', keywords: 'responses invitations' },
  ];

  function filterCommands(query) {
    if (!query) return COMMANDS;
    const q = query.toLowerCase();
    return COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(q) || cmd.keywords.includes(q)
    );
  }

  it('returns all commands with empty query', () => {
    expect(filterCommands('')).toHaveLength(5);
  });

  it('filters by label text', () => {
    const results = filterCommands('dashboard');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('dashboard');
  });

  it('filters by keywords', () => {
    const results = filterCommands('mehndi');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('events');
  });

  it('is case insensitive', () => {
    expect(filterCommands('GUEST')).toHaveLength(1);
    expect(filterCommands('guest')).toHaveLength(1);
  });

  it('returns empty for non-matching query', () => {
    expect(filterCommands('zzzzz')).toHaveLength(0);
  });

  it('matches partial labels', () => {
    const results = filterCommands('seat');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('seating');
  });
});

describe('Fuzzy matching', () => {
  // Reimplement fuzzy match logic for testing
  function fuzzyMatch(query, target) {
    if (!query || !target) return false;
    if (query.length < 3) return false;
    if (target.startsWith(query) || query.startsWith(target)) return true;
    const maxDist = query.length <= 4 ? 1 : 2;
    if (Math.abs(query.length - target.length) > maxDist) return false;
    let prev = Array.from({ length: target.length + 1 }, (_, i) => i);
    for (let i = 1; i <= query.length; i++) {
      const curr = [i];
      for (let j = 1; j <= target.length; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1),
        );
      }
      prev = curr;
    }
    return prev[target.length] <= maxDist;
  }

  it('matches exact names', () => {
    expect(fuzzyMatch('priya', 'priya')).toBe(true);
  });

  it('matches with one typo (short name)', () => {
    expect(fuzzyMatch('prya', 'priya')).toBe(true); // missing i
  });

  it('matches with one typo (longer name)', () => {
    expect(fuzzyMatch('rushii', 'rushi')).toBe(true); // extra i
  });

  it('matches prefix', () => {
    expect(fuzzyMatch('patel', 'patels')).toBe(true);
  });

  it('rejects completely different names', () => {
    expect(fuzzyMatch('kumar', 'patel')).toBe(false);
  });

  it('rejects very short queries (< 3 chars)', () => {
    expect(fuzzyMatch('pa', 'patel')).toBe(false);
  });

  it('handles common Indian name variants', () => {
    expect(fuzzyMatch('priyah', 'priya')).toBe(true); // trailing h
    expect(fuzzyMatch('rushi', 'rushi')).toBe(true);
    expect(fuzzyMatch('brijal', 'brjal')).toBe(true); // missing i
  });

  it('rejects names that differ by more than 2 edits', () => {
    expect(fuzzyMatch('alexander', 'patel')).toBe(false);
  });
});

describe('Onboarding localStorage', () => {
  const STORAGE_KEY = 'phera-onboarding-complete';

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with onboarding not complete', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('marks onboarding complete', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('reset clears the key', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(STORAGE_KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('Days until wedding calculation', () => {
  it('calculates positive days for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const days = Math.ceil((futureDate - new Date()) / (1000 * 60 * 60 * 24));
    expect(days).toBe(30);
  });

  it('returns negative for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const days = Math.ceil((pastDate - new Date()) / (1000 * 60 * 60 * 24));
    expect(days).toBeLessThanOrEqual(0);
  });

  it('returns null equivalent for no date', () => {
    const weddingDate = null;
    const days = weddingDate ? Math.ceil((new Date(weddingDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    expect(days).toBeNull();
  });
});

describe('Seating export data builder', () => {
  const tables = [
    { id: 't1', name: 'Table 1', assignedGuests: ['g1', 'g2'] },
    { id: 't2', name: 'Table 2', assignedGuests: ['g3'] },
  ];
  const guests = [
    { id: 'g1', firstName: 'Rushi', lastName: 'Patel', familyName: 'Patel Family', side: 'groom' },
    { id: 'g2', firstName: 'Brijal', lastName: 'Shah', familyName: 'Shah Family', side: 'bride' },
    { id: 'g3', firstName: 'Ankit', lastName: 'Desai', familyName: 'Desai Family', side: 'groom' },
    { id: 'g4', firstName: 'Unassigned', lastName: 'Guest', familyName: '', side: 'bride' },
  ];

  function buildExportRows(tables, guests, unassigned) {
    const rows = [];
    tables.forEach((table) => {
      (table.assignedGuests || []).forEach((gId) => {
        const g = guests.find((gu) => gu.id === gId);
        if (!g) return;
        rows.push({ Table: table.name, FirstName: g.firstName, LastName: g.lastName, Family: g.familyName || '', Side: g.side || '' });
      });
    });
    unassigned.forEach((g) => {
      rows.push({ Table: '(Unassigned)', FirstName: g.firstName, LastName: g.lastName, Family: g.familyName || '', Side: g.side || '' });
    });
    return rows;
  }

  it('includes all seated guests with table names', () => {
    const rows = buildExportRows(tables, guests, []);
    expect(rows).toHaveLength(3);
    expect(rows[0].Table).toBe('Table 1');
    expect(rows[0].FirstName).toBe('Rushi');
  });

  it('appends unassigned guests', () => {
    const unassigned = [guests[3]];
    const rows = buildExportRows(tables, guests, unassigned);
    expect(rows).toHaveLength(4);
    expect(rows[3].Table).toBe('(Unassigned)');
  });

  it('handles empty tables', () => {
    const emptyTables = [{ id: 't1', name: 'Empty Table', assignedGuests: [] }];
    const rows = buildExportRows(emptyTables, guests, []);
    expect(rows).toHaveLength(0);
  });
});

describe('Capacity ring calculation', () => {
  function capacityArc(assigned, capacity) {
    const ratio = Math.min(assigned / capacity, 1);
    const circumference = 94.25; // 2 * PI * 15
    return parseFloat((ratio * circumference).toFixed(1));
  }

  it('returns 0 for empty table', () => {
    expect(capacityArc(0, 10)).toBe(0);
  });

  it('returns full arc for full table', () => {
    expect(capacityArc(10, 10)).toBe(94.3); // 94.25 rounded to 1 decimal
  });

  it('returns half arc for half-full', () => {
    expect(capacityArc(5, 10)).toBe(47.1);
  });

  it('caps at full for over-capacity', () => {
    expect(capacityArc(12, 10)).toBe(94.3);
  });
});

describe('WhatsApp share message builder', () => {
  function buildShareMessage(tableName, eventName, url) {
    return `🪑 I'm at ${tableName}${eventName ? ` for ${eventName}` : ''}! Find your table too: ${url}`;
  }

  it('includes table name and event', () => {
    const msg = buildShareMessage('Table 5', 'Reception', 'https://example.com/find');
    expect(msg).toContain('Table 5');
    expect(msg).toContain('for Reception');
    expect(msg).toContain('https://example.com/find');
  });

  it('omits event when empty', () => {
    const msg = buildShareMessage('Head Table', '', 'https://example.com/find');
    expect(msg).not.toContain('for ');
    expect(msg).toContain('Head Table');
  });
});

describe('Duplicate guest detection', () => {
  function findDuplicatesInList(guests) {
    const seen = new Map();
    const dupes = [];
    guests.forEach((g) => {
      const key = `${(g.firstName || '').toLowerCase().trim()}_${(g.lastName || '').toLowerCase().trim()}`;
      if (seen.has(key)) {
        dupes.push({ original: seen.get(key), duplicate: g });
      } else {
        seen.set(key, g);
      }
    });
    return dupes;
  }

  it('detects exact name duplicates', () => {
    const guests = [
      { id: '1', firstName: 'Rushi', lastName: 'Patel' },
      { id: '2', firstName: 'Brijal', lastName: 'Shah' },
      { id: '3', firstName: 'Rushi', lastName: 'Patel' },
    ];
    const dupes = findDuplicatesInList(guests);
    expect(dupes).toHaveLength(1);
    expect(dupes[0].original.id).toBe('1');
    expect(dupes[0].duplicate.id).toBe('3');
  });

  it('is case-insensitive', () => {
    const guests = [
      { id: '1', firstName: 'RUSHI', lastName: 'PATEL' },
      { id: '2', firstName: 'rushi', lastName: 'patel' },
    ];
    expect(findDuplicatesInList(guests)).toHaveLength(1);
  });

  it('returns empty for no duplicates', () => {
    const guests = [
      { id: '1', firstName: 'Rushi', lastName: 'Patel' },
      { id: '2', firstName: 'Brijal', lastName: 'Shah' },
    ];
    expect(findDuplicatesInList(guests)).toHaveLength(0);
  });

  it('handles multiple duplicates', () => {
    const guests = [
      { id: '1', firstName: 'Rushi', lastName: 'Patel' },
      { id: '2', firstName: 'Rushi', lastName: 'Patel' },
      { id: '3', firstName: 'Brijal', lastName: 'Shah' },
      { id: '4', firstName: 'Brijal', lastName: 'Shah' },
    ];
    expect(findDuplicatesInList(guests)).toHaveLength(2);
  });
});

describe('RSVP translations', () => {
  const TRANSLATIONS = {
    en: { findFamily: 'Find your family', search: 'Search', submit: 'Submit RSVP' },
    hi: { findFamily: 'अपना परिवार खोजें', search: 'खोजें', submit: 'RSVP जमा करें' },
    gu: { findFamily: 'તમારું કુટુંબ શોધો', search: 'શોધો', submit: 'RSVP સબમિટ કરો' },
  };

  it('returns English translations by default', () => {
    const t = TRANSLATIONS['en'];
    expect(t.findFamily).toBe('Find your family');
    expect(t.submit).toBe('Submit RSVP');
  });

  it('returns Hindi translations', () => {
    const t = TRANSLATIONS['hi'];
    expect(t.findFamily).toBe('अपना परिवार खोजें');
  });

  it('returns Gujarati translations', () => {
    const t = TRANSLATIONS['gu'];
    expect(t.search).toBe('શોધો');
  });
});

describe('Guest list sorting', () => {
  const guests = [
    { id: '1', firstName: 'Zara', lastName: 'Williams', side: 'bride', familyName: 'Williams' },
    { id: '2', firstName: 'Ankit', lastName: 'Patel', side: 'groom', familyName: 'Patel' },
    { id: '3', firstName: 'Maya', lastName: 'Shah', side: 'bride', familyName: 'Shah' },
  ];

  function sortGuests(list, field, dir) {
    return [...list].sort((a, b) => {
      const aVal = (a[field] || '').toString().toLowerCase();
      const bVal = (b[field] || '').toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return dir === 'asc' ? cmp : -cmp;
    });
  }

  it('sorts by firstName ascending', () => {
    const sorted = sortGuests(guests, 'firstName', 'asc');
    expect(sorted[0].firstName).toBe('Ankit');
    expect(sorted[2].firstName).toBe('Zara');
  });

  it('sorts by firstName descending', () => {
    const sorted = sortGuests(guests, 'firstName', 'desc');
    expect(sorted[0].firstName).toBe('Zara');
    expect(sorted[2].firstName).toBe('Ankit');
  });

  it('sorts by side', () => {
    const sorted = sortGuests(guests, 'side', 'asc');
    expect(sorted[0].side).toBe('bride');
    expect(sorted[2].side).toBe('groom');
  });

  it('sorts by familyName', () => {
    const sorted = sortGuests(guests, 'familyName', 'asc');
    expect(sorted[0].familyName).toBe('Patel');
    expect(sorted[2].familyName).toBe('Williams');
  });
});

describe('Pagination logic', () => {
  const PAGE_SIZE = 50;

  it('calculates total pages correctly', () => {
    expect(Math.ceil(120 / PAGE_SIZE)).toBe(3);
    expect(Math.ceil(50 / PAGE_SIZE)).toBe(1);
    expect(Math.ceil(51 / PAGE_SIZE)).toBe(2);
  });

  it('slices correctly for first page', () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    const page0 = items.slice(0 * PAGE_SIZE, (0 + 1) * PAGE_SIZE);
    expect(page0).toHaveLength(50);
    expect(page0[0]).toBe(0);
    expect(page0[49]).toBe(49);
  });

  it('slices correctly for last page', () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    const page2 = items.slice(2 * PAGE_SIZE, (2 + 1) * PAGE_SIZE);
    expect(page2).toHaveLength(20);
    expect(page2[0]).toBe(100);
  });
});

describe('Event reorder logic', () => {
  it('swaps order fields correctly', () => {
    const events = [
      { id: 'e1', name: 'Mehndi', order: 0 },
      { id: 'e2', name: 'Sangeet', order: 1 },
      { id: 'e3', name: 'Reception', order: 2 },
    ];
    const idx = 0;
    const direction = 1;
    const newIdx = idx + direction;
    const updates = [
      { id: events[idx].id, order: newIdx },
      { id: events[newIdx].id, order: idx },
    ];
    expect(updates[0]).toEqual({ id: 'e1', order: 1 });
    expect(updates[1]).toEqual({ id: 'e2', order: 0 });
  });
});

describe('Command palette guest search', () => {
  const guests = [
    { id: '1', firstName: 'Rushi', lastName: 'Patel' },
    { id: '2', firstName: 'Brijal', lastName: 'Patel' },
    { id: '3', firstName: 'Ankit', lastName: 'Shah' },
  ];

  it('filters guests by @ prefix query', () => {
    const query = '@patel';
    const guestQuery = query.slice(1).toLowerCase().trim();
    const results = guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestQuery));
    expect(results).toHaveLength(2);
    expect(results[0].firstName).toBe('Rushi');
  });

  it('returns empty for non-matching @ query', () => {
    const query = '@xyz';
    const guestQuery = query.slice(1).toLowerCase().trim();
    const results = guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestQuery));
    expect(results).toHaveLength(0);
  });

  it('does not search guests without @ prefix', () => {
    const query = 'patel';
    const isGuestSearch = query.startsWith('@');
    expect(isGuestSearch).toBe(false);
  });
});

describe('Dark mode detection', () => {
  it('defaults to false when matchMedia is unavailable', () => {
    const darkMode = undefined?.matches || false;
    expect(darkMode).toBe(false);
  });
});
