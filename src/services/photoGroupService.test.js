import { describe, it, expect, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  deleteDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  writeBatch: vi.fn(),
}));
vi.mock('../../firebase', () => ({ db: {} }));
vi.mock('../../config/constants', () => ({
  COLLECTIONS: { WEDDINGS: 'weddings', PHOTO_GROUPS: 'photoGroups' },
}));

import { parseMembers, getPhotoQueueLink, getPhotoDisplayLink } from './photoGroupService';

describe('photoGroupService', () => {
  describe('parseMembers', () => {
    it('parses comma-separated string', () => {
      expect(parseMembers('Raj, Meena, Vik')).toEqual(['Raj', 'Meena', 'Vik']);
    });

    it('parses newline-separated string', () => {
      expect(parseMembers('Raj\nMeena\nVik')).toEqual(['Raj', 'Meena', 'Vik']);
    });

    it('handles mixed separators', () => {
      expect(parseMembers('Raj, Meena\nVik')).toEqual(['Raj', 'Meena', 'Vik']);
    });

    it('trims whitespace', () => {
      expect(parseMembers('  Raj  ,  Meena  ')).toEqual(['Raj', 'Meena']);
    });

    it('filters empty entries', () => {
      expect(parseMembers('Raj,,, Meena,,')).toEqual(['Raj', 'Meena']);
    });

    it('handles empty string', () => {
      expect(parseMembers('')).toEqual([]);
    });

    it('handles null/undefined', () => {
      expect(parseMembers(null)).toEqual([]);
      expect(parseMembers(undefined)).toEqual([]);
    });

    it('handles array input', () => {
      expect(parseMembers(['Raj', 'Meena'])).toEqual(['Raj', 'Meena']);
    });

    it('trims array members', () => {
      expect(parseMembers(['  Raj  ', '  Meena  '])).toEqual(['Raj', 'Meena']);
    });

    it('filters empty array members', () => {
      expect(parseMembers(['Raj', '', '  ', 'Meena'])).toEqual(['Raj', 'Meena']);
    });
  });

  describe('getPhotoQueueLink', () => {
    it('generates correct queue URL', () => {
      const link = getPhotoQueueLink('wedding123');
      expect(link).toContain('/photos/wedding123');
    });
  });

  describe('getPhotoDisplayLink', () => {
    it('generates correct display URL', () => {
      const link = getPhotoDisplayLink('wedding123');
      expect(link).toContain('/photos/wedding123/display');
    });
  });
});
