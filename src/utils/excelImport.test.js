import { describe, it, expect } from 'vitest';
import { autoMapColumns, mapRowsToGuests, findDuplicates } from './excelImport';

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
      expect(guests[2].side).toBe('bride'); // default to bride
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
      expect(guests[4].dietary).toBe('vegetarian'); // default
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

    it('handles missing row values gracefully', () => {
      const rows = [{}];
      const mapping = { 'First Name': 'firstName', 'Last Name': 'lastName' };
      const guests = mapRowsToGuests(rows, mapping);
      expect(guests[0].firstName).toBe('');
      expect(guests[0].lastName).toBe('');
    });
  });

  describe('findDuplicates', () => {
    const existing = [
      { id: 'e1', firstName: 'Rushi', lastName: 'Patel', email: 'rushi@test.com', phone: '5551234' },
      { id: 'e2', firstName: 'Priya', lastName: 'Shah', email: 'priya@test.com' },
    ];

    it('detects duplicate by name match', () => {
      const incoming = [{ firstName: 'Rushi', lastName: 'Patel' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
      expect(dupes[0].existing.id).toBe('e1');
      expect(dupes[0].index).toBe(0);
    });

    it('detects duplicate by email match', () => {
      const incoming = [{ firstName: 'Different', lastName: 'Name', email: 'rushi@test.com' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
      expect(dupes[0].existing.id).toBe('e1');
    });

    it('detects duplicate by phone match', () => {
      const incoming = [{ firstName: 'Someone', lastName: 'Else', phone: '5551234' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
    });

    it('is case-insensitive for name matching', () => {
      const incoming = [{ firstName: 'RUSHI', lastName: 'patel' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(1);
    });

    it('returns empty array when no duplicates', () => {
      const incoming = [{ firstName: 'NewPerson', lastName: 'NewFamily' }];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(0);
    });

    it('handles multiple duplicates', () => {
      const incoming = [
        { firstName: 'Rushi', lastName: 'Patel' },
        { firstName: 'Priya', lastName: 'Shah' },
        { firstName: 'New', lastName: 'Guest' },
      ];
      const dupes = findDuplicates(existing, incoming);
      expect(dupes).toHaveLength(2);
    });
  });
});
