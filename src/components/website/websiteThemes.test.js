import { describe, it, expect } from 'vitest';
import {
  WEBSITE_THEMES,
  getThemeConfig,
  getCoupleDisplayName,
  createDefaultWebsiteConfig,
  normalizeWebsiteConfig,
  sanitizeWebsiteConfig,
} from './websiteThemes';

describe('websiteThemes', () => {
  describe('WEBSITE_THEMES', () => {
    it('has exactly 6 themes', () => {
      expect(Object.keys(WEBSITE_THEMES)).toHaveLength(6);
    });

    it('contains the expected theme keys', () => {
      expect(Object.keys(WEBSITE_THEMES)).toEqual(
        expect.arrayContaining(['classic-rose', 'royal-gold', 'garden-green', 'modern-minimal'])
      );
    });

    it('does not include removed themes', () => {
      expect(WEBSITE_THEMES['maroon-gold']).toBeUndefined();
      expect(WEBSITE_THEMES['saffron-celebration']).toBeUndefined();
      expect(WEBSITE_THEMES['midnight-peacock']).toBeUndefined();
      expect(WEBSITE_THEMES['ivory-blush']).toBeUndefined();
    });

    it('each theme has required color properties', () => {
      Object.values(WEBSITE_THEMES).forEach((theme) => {
        expect(theme.primary).toBeDefined();
        expect(theme.accent).toBeDefined();
        expect(theme.background).toBeDefined();
        expect(theme.text).toBeDefined();
        expect(theme.fontFamily).toBeDefined();
        expect(theme.fontUrl).toBeDefined();
        expect(theme.heroOverlay).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.key).toBeDefined();
      });
    });
  });

  describe('getThemeConfig', () => {
    it('returns the correct theme by key', () => {
      const theme = getThemeConfig('royal-gold');
      expect(theme.name).toBe('Royal Gold');
      expect(theme.primary).toBe('#92400e');
    });

    it('falls back to classic-rose for unknown key', () => {
      const theme = getThemeConfig('nonexistent');
      expect(theme.key).toBe('classic-rose');
    });

    it('falls back to classic-rose for undefined', () => {
      const theme = getThemeConfig(undefined);
      expect(theme.key).toBe('classic-rose');
    });
  });

  describe('getCoupleDisplayName', () => {
    it('uses coupleName if available', () => {
      expect(getCoupleDisplayName({ coupleName: 'R & P' })).toBe('R & P');
    });

    it('joins coupleName1 and coupleName2', () => {
      expect(getCoupleDisplayName({ coupleName1: 'Rushi', coupleName2: 'Priya' })).toBe('Rushi & Priya');
    });

    it('handles only coupleName1', () => {
      expect(getCoupleDisplayName({ coupleName1: 'Rushi' })).toBe('Rushi');
    });

    it('returns default for null wedding', () => {
      expect(getCoupleDisplayName(null)).toBe('Our Wedding');
    });

    it('returns default for empty object', () => {
      expect(getCoupleDisplayName({})).toBe('Our Wedding');
    });
  });

  describe('createDefaultWebsiteConfig', () => {
    it('creates config with defaults', () => {
      const config = createDefaultWebsiteConfig();
      expect(config.websiteTheme).toBe('classic-rose');
      expect(config.websitePublished).toBe(false);
      expect(config.websiteEventIds).toEqual([]);
      expect(config.websiteHero.date).toBe('');
      expect(config.websiteHero.pattern).toBe('none');
      expect(config.websiteGallery.images).toEqual([]);
      expect(config.websiteRsvp.buttonText).toBe('RSVP Now');
    });

    it('accepts event IDs', () => {
      const config = createDefaultWebsiteConfig(['evt1', 'evt2']);
      expect(config.websiteEventIds).toEqual(['evt1', 'evt2']);
    });
  });

  describe('normalizeWebsiteConfig', () => {
    it('fills in missing fields with defaults', () => {
      const result = normalizeWebsiteConfig({}, []);
      expect(result.websiteTheme).toBe('classic-rose');
      expect(result.websiteHero.date).toBe('');
      expect(result.websiteStory.enabled).toBe(false);
      expect(result.websiteHotels.items).toEqual([]);
    });

    it('preserves existing values', () => {
      const wedding = {
        websiteTheme: 'royal-gold',
        websiteHero: { date: '2025-12-14', tagline: 'Love wins', pattern: 'paisley' },
        websiteStory: { enabled: true, text: 'Our story...' },
        websiteRsvp: { enabled: true, buttonText: 'Reply Today' },
        websiteCustomColors: { primary: '#112233', accent: '#445566', background: '#778899' },
      };
      const result = normalizeWebsiteConfig(wedding, []);
      expect(result.websiteTheme).toBe('royal-gold');
      expect(result.websiteHero.date).toBe('2025-12-14');
      expect(result.websiteHero.tagline).toBe('Love wins');
       expect(result.websiteHero.pattern).toBe('paisley');
      expect(result.websiteStory.text).toBe('Our story...');
      expect(result.websiteRsvp).toEqual({ enabled: true, buttonText: 'Reply Today' });
      expect(result.websiteCustomColors).toEqual({
        primary: '#112233',
        accent: '#445566',
        background: '#778899',
      });
    });

    it('uses weddingDate as hero date fallback', () => {
      const result = normalizeWebsiteConfig({ weddingDate: '2025-06-01' }, []);
      expect(result.websiteHero.date).toBe('2025-06-01');
    });

    it('normalizes hotel items', () => {
      const wedding = {
        websiteHotels: {
          enabled: true,
          items: [{ name: 'Hilton', address: '123 St' }],
        },
      };
      const result = normalizeWebsiteConfig(wedding, []);
      expect(result.websiteHotels.enabled).toBe(true);
      expect(result.websiteHotels.items[0]).toEqual({
        name: 'Hilton',
        address: '123 St',
        link: '',
        groupRateCode: '',
      });
    });

    it('handles null hotel items gracefully', () => {
      const wedding = { websiteHotels: { enabled: true, items: null } };
      const result = normalizeWebsiteConfig(wedding, []);
      expect(result.websiteHotels.items).toEqual([]);
    });

    it('limits gallery images and normalizes invalid pattern values', () => {
      const wedding = {
        websiteHero: { pattern: 'unknown' },
        websiteGallery: {
          enabled: true,
          images: Array.from({ length: 15 }, (_, index) => `data:image/jpeg;base64,${index}`),
        },
      };
      const result = normalizeWebsiteConfig(wedding, []);
      expect(result.websiteHero.pattern).toBe('none');
      expect(result.websiteGallery.enabled).toBe(true);
      expect(result.websiteGallery.images).toHaveLength(12);
    });
  });

  describe('sanitizeWebsiteConfig', () => {
    it('sanitizes new website builder fields', () => {
      const result = sanitizeWebsiteConfig({
        websiteHero: { pattern: 'mandala' },
        websiteGallery: {
          enabled: true,
          images: ['data:image/jpeg;base64,1', '', null, 'data:image/jpeg;base64,2'],
        },
        websiteRsvp: { enabled: true, buttonText: '  Save My Seat  ' },
        websiteCustomColors: {
          primary: '#123456',
          accent: 'not-a-color',
          background: '#abcdef',
        },
      });

      expect(result.websiteHero.pattern).toBe('mandala');
      expect(result.websiteGallery).toEqual({
        enabled: true,
        images: ['data:image/jpeg;base64,1', 'data:image/jpeg;base64,2'],
      });
      expect(result.websiteRsvp).toEqual({ enabled: true, buttonText: 'Save My Seat' });
      expect(result.websiteCustomColors).toEqual({
        primary: '#123456',
        accent: '',
        background: '#abcdef',
      });
    });
  });
});
