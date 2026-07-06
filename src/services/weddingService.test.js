import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore before importing
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('../../firebase', () => ({ db: {} }));
vi.mock('../../config/constants', () => ({
  COLLECTIONS: { WEDDINGS: 'weddings' },
}));

import { getDocs } from 'firebase/firestore';
import { resolveWeddingId, getWeddingBySlug } from './weddingService';

describe('weddingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveWeddingId', () => {
    it('returns param directly if it has no hyphens (doc ID)', async () => {
      const result = await resolveWeddingId('abc123xyz456');
      expect(result).toBe('abc123xyz456');
    });

    it('looks up slug when param contains hyphens', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'doc-id-123', data: () => ({ slug: 'rushi-and-priya' }) }],
      });

      const result = await resolveWeddingId('rushi-and-priya');
      expect(result).toBe('doc-id-123');
    });

    it('returns null when slug is not found', async () => {
      getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await resolveWeddingId('nonexistent-slug');
      expect(result).toBeNull();
    });
  });

  describe('getWeddingBySlug', () => {
    it('returns wedding object when slug exists', async () => {
      getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'w1', data: () => ({ slug: 'rushi-and-priya', coupleName1: 'Rushi' }) }],
      });

      const result = await getWeddingBySlug('rushi-and-priya');
      expect(result).toEqual({ id: 'w1', slug: 'rushi-and-priya', coupleName1: 'Rushi' });
    });

    it('returns null when slug does not exist', async () => {
      getDocs.mockResolvedValue({ empty: true, docs: [] });

      const result = await getWeddingBySlug('does-not-exist');
      expect(result).toBeNull();
    });
  });
});
