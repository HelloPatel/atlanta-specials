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

import { getRsvpLink, getWhatsAppRsvpLink, getHouseholdRsvpLink, submitRsvpResponse } from './rsvpService';
import { addDoc } from 'firebase/firestore';

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

    it('has no emoji in the message (brand convention)', () => {
      const link = getWhatsAppRsvpLink('abc123', 'Test', 'test-slug');
      const decoded = decodeURIComponent(link);
      expect(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(decoded)).toBe(false);
    });

    it('personalizes the destination and recipient when opts provided', () => {
      const link = getWhatsAppRsvpLink('abc123', 'Test', 'test-slug', {
        guestId: 'g99', firstName: 'Asha', phone: '+1 (404) 555-1234',
      });
      expect(link).toContain('wa.me/14045551234');
      expect(link).toContain(encodeURIComponent('g=g99'));
      expect(link).toContain(encodeURIComponent('Hi Asha,'));
    });
  });

  describe('getHouseholdRsvpLink', () => {
    it('appends the guest id as a query param', () => {
      const link = getHouseholdRsvpLink('abc123', 'g42', 'test-slug');
      expect(link).toContain('/rsvp/test-slug?g=g42');
    });

    it('returns the base link when guestId is missing', () => {
      const link = getHouseholdRsvpLink('abc123', null, 'test-slug');
      expect(link).toContain('/rsvp/test-slug');
      expect(link).not.toContain('?g=');
    });
  });

  describe('submitRsvpResponse', () => {
    beforeEach(() => {
      vi.mocked(addDoc).mockReset();
      vi.mocked(addDoc).mockResolvedValue({ id: 'resp-1' });
    });

    it('truncates oversized free-text fields to their caps', async () => {
      await submitRsvpResponse('w1', {
        respondentName: 'a'.repeat(500),
        message: 'm'.repeat(5000),
        phone: '9'.repeat(200),
      });
      const payload = vi.mocked(addDoc).mock.calls[0][1];
      expect(payload.respondentName).toHaveLength(200);
      expect(payload.message).toHaveLength(2000);
      expect(payload.phone).toHaveLength(50);
    });

    it('defaults dietary and method for empty input', async () => {
      await submitRsvpResponse('w1', {});
      const payload = vi.mocked(addDoc).mock.calls[0][1];
      expect(payload.dietary).toBe('vegetarian');
      expect(payload.method).toBe('web');
      expect(payload.message).toBe('');
    });

    it('coerces non-string free-text fields to empty strings', async () => {
      await submitRsvpResponse('w1', { message: { evil: true }, respondentName: 42 });
      const payload = vi.mocked(addDoc).mock.calls[0][1];
      expect(payload.message).toBe('');
      expect(payload.respondentName).toBe('');
    });
  });
});
