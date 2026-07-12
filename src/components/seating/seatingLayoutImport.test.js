import { describe, expect, it } from 'vitest';
import {
  createQuickTableConfigs,
  parseDelimitedLine,
  parseSeatingText,
  parseSpreadsheetRows,
  rowToSeatingItem,
} from './seatingLayoutImport';

describe('seating layout import', () => {
  describe('rowToSeatingItem', () => {
    it.each([
      ['Round', 'round'],
      ['circle', 'round'],
      ['Estate Table', 'rectangle'],
      ['long-estate', 'rectangle'],
      ['u_shape', 'u-shape'],
      ['Head Table', 'head-table'],
      ['standing', 'cocktail'],
      ['custom', 'custom'],
      ['unknown shape', 'round'],
    ])('normalizes %s to %s', (input, expected) => {
      expect(rowToSeatingItem({ name: 'Table A', shape: input }).shape).toBe(expected);
    });

    it.each([
      ['Dance Floor', 'dance-floor'],
      ['DJ Booth', 'dj'],
      ['Mandap', 'stage'],
      ['Gift Table', 'gifts'],
      ['Photo Booth', 'photo'],
      ['Doors', 'entrance'],
    ])('recognizes %s as the %s zone', (input, expected) => {
      expect(rowToSeatingItem({ name: input, shape: input })).toMatchObject({
        __zone: true,
        type: expected,
      });
    });

    it('rejects blank names', () => {
      expect(rowToSeatingItem({ name: '   ', shape: 'round' })).toBeNull();
    });

    it('uses strict numeric parsing and keeps zero coordinates', () => {
      expect(rowToSeatingItem({
        name: 'Table 1',
        shape: 'round',
        x: 0,
        y: '25',
        width: '120px',
        height: -10,
      })).toMatchObject({
        x: 0,
        y: 25,
        width: undefined,
        height: undefined,
      });
    });

    it('clamps capacity to supported limits', () => {
      expect(rowToSeatingItem({ name: 'Small', capacity: 0 }).capacity).toBe(1);
      expect(rowToSeatingItem({ name: 'Large', capacity: 999 }).capacity).toBe(50);
    });
  });

  describe('parseDelimitedLine', () => {
    it('parses quoted commas and escaped quotes', () => {
      expect(parseDelimitedLine('"Patel, Family","Round","10","He said ""hi"""'))
        .toEqual(['Patel, Family', 'Round', '10', 'He said "hi"']);
    });

    it('parses tab-delimited rows', () => {
      expect(parseDelimitedLine('Table 1\tround\t10\t100\t200'))
        .toEqual(['Table 1', 'round', '10', '100', '200']);
    });
  });

  describe('parseSpreadsheetRows', () => {
    it('detects reordered headers without confusing width aliases', () => {
      const result = parseSpreadsheetRows([
        ['Capacity', 'Table Name', 'Y Position', 'Type', 'Width', 'X Position', 'Height'],
        [12, 'Family Table', 250, 'Estate', 180, 100, 80],
      ]);
      expect(result[0]).toMatchObject({
        name: 'Family Table',
        shape: 'rectangle',
        capacity: 12,
        x: 100,
        y: 250,
        width: 180,
        height: 80,
      });
    });

    it('supports positional rows without headers', () => {
      expect(parseSpreadsheetRows([
        ['Table 1', 'round', 10, 20, 30, 120, 120],
      ])[0]).toMatchObject({ name: 'Table 1', x: 20, y: 30 });
    });

    it('ignores blank rows and rows without names', () => {
      expect(parseSpreadsheetRows([
        ['Name', 'Type'],
        [],
        ['', 'round'],
        ['Table 1', 'round'],
      ])).toHaveLength(1);
    });

    it('handles a BOM in the first header', () => {
      expect(parseSpreadsheetRows([
        ['\uFEFFName', 'Type', 'Seats'],
        ['Table 1', 'round', 8],
      ])[0].capacity).toBe(8);
    });

    it('returns an empty list for missing data', () => {
      expect(parseSpreadsheetRows()).toEqual([]);
      expect(parseSpreadsheetRows([[], ['', null]])).toEqual([]);
    });
  });

  describe('parseSeatingText', () => {
    it('parses headers, comments, CRLF, and quoted table names', () => {
      const result = parseSeatingText(
        '# Reception layout\r\nName, Type, Seats, X, Y\r\n"Patel, Family", Estate Table, 12, 40, 80\r\n',
      );
      expect(result).toEqual([
        expect.objectContaining({
          name: 'Patel, Family',
          shape: 'rectangle',
          capacity: 12,
          x: 40,
          y: 80,
        }),
      ]);
    });

    it('does not partially accept malformed numbers', () => {
      const result = parseSeatingText('Table 1, round, 10 guests, 20px, 30');
      expect(result[0]).toMatchObject({
        capacity: 10,
        x: undefined,
        y: 30,
      });
    });
  });

  describe('createQuickTableConfigs', () => {
    it('continues numbering after existing tables', () => {
      expect(createQuickTableConfigs({
        count: 2,
        shape: 'estate',
        capacity: 8,
        existingCount: 4,
      })).toEqual([
        { name: 'Table 5', shape: 'rectangle', capacity: 8 },
        { name: 'Table 6', shape: 'rectangle', capacity: 8 },
      ]);
    });

    it('clamps count and capacity to safe limits', () => {
      const result = createQuickTableConfigs({ count: 500, capacity: 1000, shape: 'round' });
      expect(result).toHaveLength(100);
      expect(result.every((table) => table.capacity === 50)).toBe(true);
    });

    it('uses safe defaults for invalid values', () => {
      expect(createQuickTableConfigs({ count: 'bad', capacity: 'bad', shape: 'bad' }))
        .toEqual([{ name: 'Table 1', shape: 'round', capacity: 10 }]);
    });
  });
});
