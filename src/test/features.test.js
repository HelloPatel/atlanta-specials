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
