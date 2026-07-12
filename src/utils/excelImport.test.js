import { describe, it, expect } from 'vitest';
import {
  analyzeGuestImport,
  autoMapColumns,
  findDuplicates,
  mapRowsToGuests,
  parseRawGuestData,
  validateColumnMapping,
} from './excelImport';

describe('excelImport', () => {
  describe('autoMapColumns', () => {
    it('maps standard headers', () => {
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Family', 'Side', 'Dietary'];
      const mapping = autoMapColumns(headers);
      expect(mapping['First Name']).toBe('firstName');
      expect(mapping['Last Name']).toBe('lastName');
      expect(mapping['Email']).toBe('email');
      expect(mapping['Phone']).toBe('phone');
      expect(mapping['Family']).toBe('familyName');
      expect(mapping['Side']).toBe('side');
      expect(mapping['Dietary']).toBe('dietary');
    });

    describe('parseRawGuestData', () => {
      it('skips blank rows before the header and removes a BOM', () => {
        const result = parseRawGuestData([
          [],
          ['', ''],
          ['\uFEFFFirst Name', 'Last Name'],
          ['Asha', 'Patel'],
        ]);
        expect(result.headers).toEqual(['First Name', 'Last Name']);
        expect(result.rows).toEqual([{ 'First Name': 'Asha', 'Last Name': 'Patel' }]);
      });

      it('makes blank and duplicate headers safe and unique', () => {
        const result = parseRawGuestData([
          ['Name', 'Name', ''],
          ['Asha Patel', 'Ignored', 'Bride'],
        ]);
        expect(result.headers).toEqual(['Name', 'Name (2)', 'Column 3']);
        expect(result.rows[0]['Name (2)']).toBe('Ignored');
      });

      it('rejects empty files and header-only files', () => {
        expect(() => parseRawGuestData([])).toThrow('empty');
        expect(() => parseRawGuestData([['Name', 'Email']])).toThrow('at least one guest row');
      });
    });

    it('maps case-insensitively', () => {
      const headers = ['FIRST NAME', 'last name', 'EMAIL'];
      const mapping = autoMapColumns(headers);
      expect(mapping['FIRST NAME']).toBe('firstName');
      expect(mapping['last name']).toBe('lastName');
      expect(mapping['EMAIL']).toBe('email');
    });

    it('maps alternative header names', () => {
      const headers = ['firstname', 'lastname', 'mobile', 'relationship', 'diet'];
      const mapping = autoMapColumns(headers);
      expect(mapping['firstname']).toBe('firstName');
      expect(mapping['lastname']).toBe('lastName');
      expect(mapping['mobile']).toBe('phone');
      expect(mapping['relationship']).toBe('relation');
      expect(mapping['diet']).toBe('dietary');
    });

    it('maps "name" to _fullName for splitting', () => {
      const mapping = autoMapColumns(['Name']);
      expect(mapping['Name']).toBe('_fullName');
    });

    it('skips unrecognized headers', () => {
      const mapping = autoMapColumns(['Random Header', 'Another Col']);
      expect(Object.keys(mapping)).toHaveLength(0);
    });
  });

  describe('mapRowsToGuests', () => {
    it('maps basic fields', () => {
      const rows = [{ 'First Name': 'Rushi', 'Last Name': 'Patel', 'Email': 'r@test.com' }];
      const mapping = { 'First Name': 'firstName', 'Last Name': 'lastName', 'Email': 'email' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0]).toEqual({ firstName: 'Rushi', lastName: 'Patel', email: 'r@test.com' });
    });

    it('splits full name into first and last', () => {
      const rows = [{ 'Name': 'Rushi Patel' }];
      const mapping = { 'Name': '_fullName' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].firstName).toBe('Rushi');
      expect(guests[0].lastName).toBe('Patel');
    });

    it('handles multi-word last names', () => {
      const rows = [{ 'Name': 'Rushi Kumar Patel' }];
      const mapping = { 'Name': '_fullName' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].firstName).toBe('Rushi');
      expect(guests[0].lastName).toBe('Kumar Patel');
    });

    it('normalizes side field to bride/groom', () => {
      const rows = [{ 'Side': 'Groom side' }, { 'Side': 'Bride' }, { 'Side': 'other' }];
      const mapping = { 'Side': 'side' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].side).toBe('groom');
      expect(guests[1].side).toBe('bride');
      expect(guests[2].side).toBe('');
    });

    it('normalizes dietary field', () => {
      const rows = [
        { 'Diet': 'Jain' },
        { 'Diet': 'Vegan' },
        { 'Diet': 'Non-veg' },
        { 'Diet': 'Vegetarian' },
        { 'Diet': '' },
      ];
      const mapping = { 'Diet': 'dietary' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].dietary).toBe('jain');
      expect(guests[1].dietary).toBe('vegan');
      expect(guests[2].dietary).toBe('non-veg');
      expect(guests[3].dietary).toBe('vegetarian');
      expect(guests[4].dietary).toBe('');
    });

    it('parses tags from comma/semicolon separated string', () => {
      const rows = [{ 'Tags': 'VIP, Elderly; Wheelchair' }];
      const mapping = { 'Tags': '_tags' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].tags).toEqual(['VIP', 'Elderly', 'Wheelchair']);
    });

    it('handles empty tag string', () => {
      const rows = [{ 'Tags': '' }];
      const mapping = { 'Tags': '_tags' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].tags).toEqual([]);
    });

    it('does not let full name overwrite explicitly mapped names', () => {
      const rows = [{ Name: 'Asha Patel', First: 'Ashaben', Last: 'Patel-Shah' }];
      const guests = mapRowsToGuests(rows, {
        Name: '_fullName',
        First: 'firstName',
        Last: 'lastName',
      });
      expect(guests[0]).toMatchObject({ firstName: 'Ashaben', lastName: 'Patel-Shah' });
    });

    it('normalizes plus-one values and deduplicates tags', () => {
      const guests = mapRowsToGuests(
        [{ Plus: 'YES', Tags: 'VIP, VIP; Elderly' }],
        { Plus: 'plusOne', Tags: '_tags' },
      );
      expect(guests[0].plusOne).toBe(true);
      expect(guests[0].tags).toEqual(['VIP', 'Elderly']);
    });

    it('handles missing row values gracefully', () => {
      const rows = [{}];
      const mapping = { 'First Name': 'firstName', 'Last Name': 'lastName' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].firstName).toBe('');
      expect(guests[0].lastName).toBe('');
    });

    describe('validateColumnMapping', () => {
      it('requires a usable name column', () => {
        expect(validateColumnMapping({ Email: 'email' })).toContain(
          'Map a First Name or Full Name column before continuing.',
        );
      });

      it('rejects duplicate target fields', () => {
        expect(validateColumnMapping({ First: 'firstName', Preferred: 'firstName' })[0])
          .toContain('only be mapped once');
      });

      it('accepts a full-name mapping', () => {
        expect(validateColumnMapping({ Name: '_fullName', Email: 'email' })).toEqual([]);
      });
    });

    describe('analyzeGuestImport', () => {
      it('separates invalid and duplicate rows while preserving source indexes', () => {
        const analysis = analyzeGuestImport(
          [
            { Name: '' },
            { Name: 'Asha Patel', Email: 'asha@example.com' },
            { Name: 'Dev Shah', Email: 'dev@example.com' },
            { Name: 'Asha Duplicate', Email: 'ASHA@example.com' },
          ],
          { Name: '_fullName', Email: 'email' },
          [],
        );
        expect(analysis.invalidRows).toEqual([
          { index: 0, reasons: ['Missing first or full name'] },
        ]);
        expect(analysis.duplicates).toHaveLength(1);
        expect(analysis.duplicates[0].index).toBe(3);
      });
    });
  });

  describe('findDuplicates', () => {
    const existing = [
      { id: 'e1', firstName: 'Rushi', lastName: 'Patel', familyName: 'Patel Family', email: 'rushi@test.com', phone: '5551234' },
      { id: 'e2', firstName: 'Priya', lastName: 'Shah', familyName: 'Shah Family', email: 'priya@test.com' },
    ];

    it('detects duplicate by name match within the same family', () => {
      const incoming = [{ firstName: 'Rushi', lastName: 'Patel', familyName: 'Patel Family' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
      expect(dupes[0].existing.id).toBe('e1');
      expect(dupes[0].index).toBe(0);
    });

    it('does NOT flag the same name in a different family', () => {
      const incoming = [{ firstName: 'Rushi', lastName: 'Patel', familyName: 'Mehta Family' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(0);
    });

    it('does NOT flag a name match when family is missing', () => {
      const incoming = [{ firstName: 'Rushi', lastName: 'Patel' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(0);
    });

    it('detects duplicate by email match', () => {
      const incoming = [{ firstName: 'Different', lastName: 'Name', email: 'rushi@test.com' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
      expect(dupes[0].existing.id).toBe('e1');
    });

    it('detects duplicate by phone match', () => {
      const incoming = [{ firstName: 'Someone', lastName: 'Else', phone: '(555) 1234' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
    });

    it('is case-insensitive for name and family matching', () => {
      const incoming = [{ firstName: 'RUSHI', lastName: 'patel', familyName: 'PATEL FAMILY' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
    });

    it('returns empty array when no duplicates', () => {
      const incoming = [{ firstName: 'NewPerson', lastName: 'NewFamily', familyName: 'New Family' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(0);
    });

    it('handles multiple duplicates', () => {
      const incoming = [
        { firstName: 'Rushi', lastName: 'Patel', familyName: 'Patel Family' },
        { firstName: 'Priya', lastName: 'Shah', familyName: 'Shah Family' },
        { firstName: 'New', lastName: 'Guest', familyName: 'Other Family' },
      ];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(2);
    });

    it('flags a repeated name within the same import batch (same family)', () => {
      const incoming = [
        { firstName: 'Amit', lastName: 'Patel', familyName: 'The Patel Family' },
        { firstName: 'Amit', lastName: 'Patel', familyName: 'The Patel Family' },
      ];
      const dupes = findDuplicates([], incoming);
      expect(dupes).toHaveLength(1);
      expect(dupes[0].index).toBe(1);
      expect(dupes[0].existing.firstName).toBe('Amit');
    });

    it('does NOT flag a repeated name across families within a batch', () => {
      const incoming = [
        { firstName: 'Amit', lastName: 'Patel', familyName: 'The Patel Family' },
        { firstName: 'Amit', lastName: 'Shah', familyName: 'The Shah Family' },
      ];
      const dupes = findDuplicates([], incoming);
      expect(dupes).toHaveLength(0);
    });
  });
});
