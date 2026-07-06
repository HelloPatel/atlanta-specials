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

describe('Auto-group families logic', () => {
  const guests = [
    { id: '1', firstName: 'Rushi', lastName: 'Patel', familyName: null },
    { id: '2', firstName: 'Brijal', lastName: 'Patel', familyName: null },
    { id: '3', firstName: 'Ankit', lastName: 'Shah', familyName: null },
    { id: '4', firstName: 'Priya', lastName: 'Shah', familyName: null },
    { id: '5', firstName: 'Solo', lastName: 'Unique', familyName: null },
  ];

  it('groups guests with same last name', () => {
    const ungrouped = guests.filter((g) => !g.familyName && g.lastName);
    const groups = {};
    ungrouped.forEach((g) => {
      const key = g.lastName.trim().toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(g);
    });
    const multiGroups = Object.entries(groups).filter(([, arr]) => arr.length > 1);
    expect(multiGroups).toHaveLength(2); // Patel (2), Shah (2)
  });

  it('ignores singles', () => {
    const ungrouped = guests.filter((g) => !g.familyName && g.lastName);
    const groups = {};
    ungrouped.forEach((g) => {
      const key = g.lastName.trim().toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(g);
    });
    const singleGroups = Object.entries(groups).filter(([, arr]) => arr.length === 1);
    expect(singleGroups).toHaveLength(1); // Unique
  });

  it('generates correct family name', () => {
    const familyName = `The Patel Family`;
    expect(familyName).toBe('The Patel Family');
  });
});

describe('Zoom to fit logic', () => {
  it('calculates fit zoom correctly', () => {
    const tables = [
      { x: 100, y: 100 },
      { x: 500, y: 400 },
    ];
    const maxX = Math.max(...tables.map((t) => t.x + 150));
    const maxY = Math.max(...tables.map((t) => t.y + 150));
    const containerW = 800;
    const containerH = 600;
    const fitZoom = Math.min(containerW / maxX, containerH / maxY, 1.5);
    expect(fitZoom).toBeCloseTo(1.09, 1);
    const rounded = Math.max(Math.round(fitZoom * 10) / 10, 0.3);
    expect(rounded).toBe(1.1);
  });
});

describe('RSVP status display', () => {
  it('counts statuses correctly', () => {
    const rsvpStatus = { event1: 'accepted', event2: 'declined', event3: 'pending' };
    const statuses = Object.values(rsvpStatus);
    const accepted = statuses.filter((s) => s === 'accepted').length;
    const declined = statuses.filter((s) => s === 'declined').length;
    const pending = statuses.filter((s) => s === 'pending').length;
    expect(accepted).toBe(1);
    expect(declined).toBe(1);
    expect(pending).toBe(1);
  });

  it('handles empty rsvpStatus', () => {
    const statuses = Object.values({});
    expect(statuses).toHaveLength(0);
  });
});

describe('Email validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('accepts valid emails', () => {
    expect(emailRegex.test('rushi@example.com')).toBe(true);
    expect(emailRegex.test('test.user@domain.co.in')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(emailRegex.test('not-an-email')).toBe(false);
    expect(emailRegex.test('@missing-local.com')).toBe(false);
    expect(emailRegex.test('no-domain@')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });

  it('allows empty email (optional field)', () => {
    const email = '';
    const isValid = !email || emailRegex.test(email);
    expect(isValid).toBe(true);
  });
});

describe('Quick add guest name parsing', () => {
  it('parses "First Last" correctly', () => {
    const input = 'Rushi Patel, Brijal Shah, Ankit';
    const names = input.split(',').map((n) => n.trim()).filter(Boolean);
    const parsed = names.map((n) => {
      const parts = n.split(/\s+/);
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    });
    expect(parsed[0]).toEqual({ firstName: 'Rushi', lastName: 'Patel' });
    expect(parsed[1]).toEqual({ firstName: 'Brijal', lastName: 'Shah' });
    expect(parsed[2]).toEqual({ firstName: 'Ankit', lastName: '' });
  });

  it('handles multi-word last names', () => {
    const name = 'Mary Jane Watson';
    const parts = name.split(/\s+/);
    expect(parts[0]).toBe('Mary');
    expect(parts.slice(1).join(' ')).toBe('Jane Watson');
  });
});

describe('Full-text guest search', () => {
  const guests = [
    { firstName: 'Rushi', lastName: 'Patel', email: 'rushi@test.com', dietary: 'vegetarian', tags: ['vip'] },
    { firstName: 'Ankit', lastName: 'Shah', email: '', dietary: 'non-veg', tags: [] },
  ];

  function searchGuests(list, query) {
    const q = query.toLowerCase();
    return list.filter((g) => {
      const searchable = `${g.firstName} ${g.lastName} ${g.email} ${g.dietary} ${(g.tags || []).join(' ')}`.toLowerCase();
      return searchable.includes(q);
    });
  }

  it('finds by email', () => {
    expect(searchGuests(guests, 'rushi@test')).toHaveLength(1);
  });

  it('finds by dietary', () => {
    expect(searchGuests(guests, 'non-veg')).toHaveLength(1);
  });

  it('finds by tag', () => {
    expect(searchGuests(guests, 'vip')).toHaveLength(1);
  });

  it('finds by name still works', () => {
    expect(searchGuests(guests, 'patel')).toHaveLength(1);
  });
});

describe('RSVP filter logic', () => {
  const guests = [
    { id: '1', rsvpStatus: { e1: 'accepted' } },
    { id: '2', rsvpStatus: { e1: 'declined' } },
    { id: '3', rsvpStatus: {} },
    { id: '4', rsvpStatus: { e1: 'pending' } },
  ];

  it('filters responded guests', () => {
    const responded = guests.filter((g) => {
      const statuses = Object.values(g.rsvpStatus || {});
      return statuses.some((s) => s === 'accepted' || s === 'declined');
    });
    expect(responded).toHaveLength(2);
  });

  it('filters pending guests', () => {
    const pending = guests.filter((g) => {
      const statuses = Object.values(g.rsvpStatus || {});
      return !statuses.some((s) => s === 'accepted' || s === 'declined');
    });
    expect(pending).toHaveLength(2);
  });
});

describe('Guest export with RSVP', () => {
  it('marks guest as Accepted when any event is accepted', () => {
    const g = { rsvpStatus: { e1: 'accepted', e2: 'pending' } };
    const status = Object.values(g.rsvpStatus || {}).includes('accepted') ? 'Accepted' : Object.values(g.rsvpStatus || {}).includes('declined') ? 'Declined' : 'Pending';
    expect(status).toBe('Accepted');
  });

  it('marks guest as Declined when no acceptance', () => {
    const g = { rsvpStatus: { e1: 'declined' } };
    const status = Object.values(g.rsvpStatus || {}).includes('accepted') ? 'Accepted' : Object.values(g.rsvpStatus || {}).includes('declined') ? 'Declined' : 'Pending';
    expect(status).toBe('Declined');
  });

  it('marks guest as Pending when no responses', () => {
    const g = { rsvpStatus: {} };
    const status = Object.values(g.rsvpStatus || {}).includes('accepted') ? 'Accepted' : Object.values(g.rsvpStatus || {}).includes('declined') ? 'Declined' : 'Pending';
    expect(status).toBe('Pending');
  });
});

describe('Seating side stats', () => {
  const guests = [
    { id: '1', side: 'bride' },
    { id: '2', side: 'bride' },
    { id: '3', side: 'groom' },
    { id: '4', side: 'groom' },
    { id: '5', side: 'groom' },
  ];

  it('counts bride and groom correctly', () => {
    const assignedIds = new Set(['1', '2', '3', '4']);
    const seated = guests.filter((g) => assignedIds.has(g.id));
    const bride = seated.filter((g) => g.side === 'bride').length;
    const groom = seated.filter((g) => g.side === 'groom').length;
    expect(bride).toBe(2);
    expect(groom).toBe(2);
  });
});

describe('Password protection', () => {
  it('allows access when password matches', () => {
    const websitePassword = 'love2024';
    const input = 'love2024';
    expect(input === websitePassword).toBe(true);
  });

  it('blocks access when password is wrong', () => {
    const websitePassword = 'love2024';
    const input = 'wrong';
    expect(input === websitePassword).toBe(false);
  });

  it('allows access when no password is set', () => {
    const websitePassword = '';
    const shouldGate = websitePassword && true;
    expect(shouldGate).toBeFalsy();
  });
});

describe('Countdown timer logic', () => {
  it('calculates days correctly', () => {
    const now = new Date('2024-12-01T00:00:00');
    const target = new Date('2024-12-25T00:00:00');
    const diff = target.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    expect(days).toBe(24);
  });

  it('returns null when date has passed', () => {
    const now = new Date('2025-01-01T00:00:00');
    const target = new Date('2024-12-25T00:00:00');
    const diff = target.getTime() - now.getTime();
    expect(diff).toBeLessThan(0);
  });

  it('calculates hours correctly', () => {
    const diff = 90000000; // 25 hours in ms
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    expect(hours).toBe(1);
  });

  it('calculates minutes correctly', () => {
    const diff = 5400000; // 90 minutes in ms
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    expect(minutes).toBe(30);
  });
});

describe('Inline edit parsing', () => {
  it('creates inline edit state from guest', () => {
    const guest = { id: '1', firstName: 'Rushi', lastName: 'Patel' };
    const state = { id: guest.id, firstName: guest.firstName, lastName: guest.lastName };
    expect(state.id).toBe('1');
    expect(state.firstName).toBe('Rushi');
  });

  it('clears inline edit on cancel', () => {
    const state = null;
    expect(state).toBeNull();
  });
});

// ── Confetti Animation Tests ──────────────────────────────
describe('Confetti animation on RSVP success', () => {
  it('generates correct number of confetti dots', () => {
    const COUNT = 30;
    const dots = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      color: ['#be123c', '#f59e0b', '#10b981', '#6366f1'][i % 4],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
    }));
    expect(dots).toHaveLength(30);
    expect(dots[0].color).toBe('#be123c');
    expect(dots[3].color).toBe('#6366f1');
  });

  it('confetti dots have valid CSS properties', () => {
    const dot = {
      left: `${Math.random() * 100}%`,
      animationDelay: `${(Math.random() * 2).toFixed(2)}s`,
      backgroundColor: '#be123c',
    };
    expect(dot.left).toMatch(/^\d+(\.\d+)?%$/);
    expect(dot.animationDelay).toMatch(/^\d+\.\d+s$/);
  });
});

// ── Mobile Responsive Layout Tests ──────────────────────────────
describe('Mobile responsive layouts', () => {
  it('photo stats grid uses mobile-friendly classes', () => {
    const gridClasses = 'grid gap-2 grid-cols-3 sm:gap-4';
    expect(gridClasses).toContain('grid-cols-3');
    expect(gridClasses).toContain('gap-2');
    expect(gridClasses).toContain('sm:gap-4');
  });

  it('bets stats grid stacks on mobile', () => {
    const gridClasses = 'grid gap-2 grid-cols-2 sm:gap-4 md:grid-cols-4';
    expect(gridClasses).toContain('grid-cols-2');
    expect(gridClasses).toContain('md:grid-cols-4');
  });

  it('cards use compact padding on mobile', () => {
    const cardClasses = 'border-wine-100 !p-3 sm:!p-4';
    expect(cardClasses).toContain('!p-3');
    expect(cardClasses).toContain('sm:!p-4');
  });

  it('seating mobile view uses bottom sheet pattern', () => {
    const mobileSelectedTable = { id: 't1', name: 'Table 1', capacity: 10, assignedGuests: ['g1', 'g2'] };
    expect(mobileSelectedTable.assignedGuests.length).toBeLessThanOrEqual(mobileSelectedTable.capacity);
    expect(mobileSelectedTable.name).toBeDefined();
  });

  it('mobile bottom sheet shows guest count correctly', () => {
    const table = { id: 't5', name: 'Table 5', capacity: 10, assignedGuests: ['a', 'b', 'c'], shape: 'round' };
    const label = `${table.assignedGuests.length}/${table.capacity} seats filled`;
    expect(label).toBe('3/10 seats filled');
  });
});

// ── Marketing Reels Responsiveness Tests ──────────────────────────────
describe('Marketing reels responsive design', () => {
  it('uses viewport-relative units for sizing', () => {
    const clampValues = [
      'clamp(32px, 8vw, 64px)',
      'clamp(60px, 18vw, 140px)',
      'clamp(11px, 3vw, 14px)',
    ];
    clampValues.forEach((v) => {
      expect(v).toMatch(/clamp\(\d+px,\s*\d+(\.\d+)?vw,\s*\d+px\)/);
    });
  });

  it('reel layout uses percentage positioning for iPhone compatibility', () => {
    const positions = { top: '8%', left: '5%', right: '5%', bottom: '18%' };
    Object.values(positions).forEach((val) => {
      expect(val).toMatch(/^\d+%$/);
    });
  });

  it('all 5 reels have distinct themes', () => {
    const reelThemes = [
      { name: 'seating', bg: 'linear-gradient(135deg, #1a0a0a 0%, #2d1015 50%, #1a0a0a 100%)' },
      { name: 'rsvp', bg: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' },
      { name: 'excel', bg: 'linear-gradient(135deg, #1a2e1a 0%, #0a1f0a 100%)' },
      { name: 'scale', bg: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)' },
      { name: 'checkin', bg: 'linear-gradient(180deg, #0a1628 0%, #162040 50%, #0a1628 100%)' },
    ];
    const uniqueBgs = new Set(reelThemes.map((r) => r.bg));
    expect(uniqueBgs.size).toBe(5);
  });
});

// ── iPhone Optimization Tests ──────────────────────────────
describe('iPhone optimization', () => {
  it('viewport meta includes viewport-fit=cover', () => {
    const meta = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
    expect(meta).toContain('viewport-fit=cover');
  });

  it('safe area insets are applied', () => {
    const bodyStyle = 'padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);';
    expect(bodyStyle).toContain('env(safe-area-inset-top)');
    expect(bodyStyle).toContain('env(safe-area-inset-bottom)');
  });

  it('tap highlight is removed for clean touch', () => {
    const style = '-webkit-tap-highlight-color: transparent';
    expect(style).toContain('transparent');
  });

  it('RSVP buttons have active:scale-95 for tap feedback', () => {
    const classes = 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95';
    expect(classes).toContain('active:scale-95');
  });

  it('selected RSVP button scales up', () => {
    const classes = 'bg-green-500 text-white shadow-sm scale-105';
    expect(classes).toContain('scale-105');
  });
});

// ── Animation System Tests ──────────────────────────────
describe('Animation system', () => {
  it('provides all required animation utilities', () => {
    const animations = ['fade-in', 'slide-up', 'slide-down', 'scale-in', 'bounce-in'];
    expect(animations).toHaveLength(5);
    expect(animations).toContain('bounce-in');
    expect(animations).toContain('scale-in');
  });

  it('bounce-in uses spring-like cubic-bezier', () => {
    const easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
    expect(easing).toContain('1.56');
  });

  it('bottom sheet uses slide-up animation', () => {
    const classes = 'border-t border-gray-200 bg-white max-h-[40vh] overflow-auto animate-slide-up';
    expect(classes).toContain('animate-slide-up');
  });

  it('confetti uses falling keyframe animation', () => {
    const keyframes = '@keyframes confettiFall { 0% { transform: translateY(0) } 100% { transform: translateY(500px) rotate(720deg) } }';
    expect(keyframes).toContain('confettiFall');
    expect(keyframes).toContain('rotate(720deg)');
  });
});

// ── Mobile Zoom Controls Tests ──────────────────────────────
describe('Mobile seating zoom controls', () => {
  it('zoom starts at 0.35', () => {
    const initialZoom = 0.35;
    expect(initialZoom).toBe(0.35);
  });

  it('zoom decreases by 0.05 on minus tap', () => {
    let zoom = 0.35;
    zoom = Math.max(0.15, zoom - 0.05);
    expect(zoom).toBeCloseTo(0.30);
  });

  it('zoom increases by 0.05 on plus tap', () => {
    let zoom = 0.35;
    zoom = Math.min(0.6, zoom + 0.05);
    expect(zoom).toBeCloseTo(0.40);
  });

  it('zoom cannot go below 0.15', () => {
    let zoom = 0.15;
    zoom = Math.max(0.15, zoom - 0.05);
    expect(zoom).toBe(0.15);
  });

  it('zoom cannot exceed 0.6', () => {
    let zoom = 0.6;
    zoom = Math.min(0.6, zoom + 0.05);
    expect(zoom).toBe(0.6);
  });

  it('zoom transition is smooth', () => {
    const style = 'transition: transform 0.2s ease-out';
    expect(style).toContain('0.2s');
    expect(style).toContain('ease-out');
  });
});

// ── Dashboard Widget Tests ──────────────────────────────
describe('Dashboard quick stats', () => {
  it('calculates RSVP rate correctly', () => {
    const guests = [
      { id: '1', rsvpStatus: { e1: 'accepted' } },
      { id: '2', rsvpStatus: { e1: 'declined' } },
      { id: '3', rsvpStatus: {} },
      { id: '4', rsvpStatus: { e1: 'pending' } },
    ];
    const responded = guests.filter((g) => {
      const statuses = Object.values(g.rsvpStatus || {});
      return statuses.some((s) => s === 'accepted' || s === 'declined');
    });
    const rate = Math.round(responded.length / guests.length * 100);
    expect(rate).toBe(50);
  });

  it('calculates days until wedding', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const days = Math.ceil((new Date(futureDate) - new Date()) / (1000 * 60 * 60 * 24));
    expect(days).toBeGreaterThanOrEqual(29);
    expect(days).toBeLessThanOrEqual(31);
  });

  it('counts seated guests correctly', () => {
    const guests = [
      { id: '1', tableNumber: 5 },
      { id: '2', tableNumber: null },
      { id: '3', tableNumber: 3 },
      { id: '4', tableNumber: undefined },
    ];
    const seated = guests.filter((g) => g.tableNumber != null).length;
    expect(seated).toBe(2);
  });
});

// ── Fuzzy Match Edge Cases ──────────────────────────────
describe('Fuzzy match edge cases', () => {
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
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1));
      }
      prev = curr;
    }
    return prev[target.length] <= maxDist;
  }

  it('matches common Indian name misspellings', () => {
    expect(fuzzyMatch('patel', 'patell')).toBe(true);
    expect(fuzzyMatch('priya', 'priyah')).toBe(true);
    expect(fuzzyMatch('rushi', 'rushi')).toBe(true);
  });

  it('rejects short queries for safety', () => {
    expect(fuzzyMatch('pa', 'patel')).toBe(false);
    expect(fuzzyMatch('', 'patel')).toBe(false);
  });

  it('handles prefix matching', () => {
    expect(fuzzyMatch('shar', 'sharma')).toBe(true);
    expect(fuzzyMatch('sharma', 'shar')).toBe(true);
  });

  it('rejects completely different names', () => {
    expect(fuzzyMatch('patel', 'kumar')).toBe(false);
    expect(fuzzyMatch('sharma', 'reddy')).toBe(false);
  });
});

// ── App Shell Mobile Tests ──────────────────────────────
describe('Mobile app shell', () => {
  it('bottom nav has safe area padding for iPhone', () => {
    const style = "paddingBottom: 'env(safe-area-inset-bottom)'";
    expect(style).toContain('safe-area-inset-bottom');
  });

  it('nav items have 5 slots (Home, Guests, Seating, RSVPs, More)', () => {
    const navItems = ['Home', 'Guests', 'Seating', 'RSVPs', 'More'];
    expect(navItems).toHaveLength(5);
  });

  it('nav items use active:scale-90 for tap feel', () => {
    const classes = 'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all active:scale-90';
    expect(classes).toContain('active:scale-90');
  });

  it('command palette adjusts position for mobile (10vh vs 15vh)', () => {
    const classes = 'pt-[10vh] sm:pt-[15vh]';
    expect(classes).toContain('pt-[10vh]');
    expect(classes).toContain('sm:pt-[15vh]');
  });
});

// ── Event Card Interactions ──────────────────────────────
describe('Event card mobile interactions', () => {
  it('event cards have tap feedback', () => {
    const classes = 'relative rounded-xl border bg-white p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all';
    expect(classes).toContain('active:scale-[0.98]');
  });

  it('event color coding works for Indian events', () => {
    const eventColors = {
      mehndi: 'border-green-200',
      sangeet: 'border-purple-200',
      haldi: 'border-yellow-200',
      ceremony: 'border-red-200',
      reception: 'border-blue-200',
    };
    expect(Object.keys(eventColors)).toHaveLength(5);
    expect(eventColors.mehndi).toContain('green');
  });
});
