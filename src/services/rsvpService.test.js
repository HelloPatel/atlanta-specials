import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../../firebase', () => ({ db: {} }));
vi.mock('../../config/constants', () => ({
  COLLECTIONS: { WEDDINGS: 'weddings', GUESTS: 'guests', EVENTS: 'events' },
}));

import { getRsvpLink, getWhatsAppRsvpLink } from './rsvpService';

describe('rsvpService', () => {
  describe('getRsvpLink', () => {
    it('uses slug when provided', () => {
      const link = getRsvpLink('abc123', 'rushi-and-priya');
      expect(link).toContain('/rsvp/rushi-and-priya');
      expect(link).not.toContain('abc123');
    });

    it('falls back to weddingId when slug is not provided', () => {
      const link = getRsvpLink('abc123');
      expect(link).toContain('/rsvp/abc123');
    });

    it('falls back to weddingId when slug is empty string', () => {
      const link = getRsvpLink('abc123', '');
      expect(link).toContain('/rsvp/abc123');
    });

    it('uses current origin', () => {
      const link = getRsvpLink('abc123', 'test-slug');
      expect(link).toMatch(/^https?:\/\/.+\/rsvp\/test-slug$/);
    });
  });

  describe('getWhatsAppRsvpLink', () => {
    it('includes couple name in message', () => {
      const link = getWhatsAppRsvpLink('abc123', 'Rushi & Priya', 'rushi-and-priya');
      expect(link).toContain('wa.me');
      expect(link).toContain(encodeURIComponent('Rushi & Priya'));
    });

    it('includes the RSVP URL in the WhatsApp message', () => {
      const link = getWhatsAppRsvpLink('abc123', 'Test', 'test-slug');
      expect(link).toContain(encodeURIComponent('/rsvp/test-slug'));
    });
  });
});
