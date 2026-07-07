import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  COLLECTIONS,
  EVENT_TEMPLATES,
  TABLE_SHAPES,
  TABLE_PRESETS,
  TABLE_DEFAULTS,
  GUEST_TAGS,
  DIETARY_OPTIONS,
  LANGUAGES,
  RSVP_STATUS,
  SIDES,
} from './constants';

describe('constants', () => {
  describe('APP_NAME', () => {
    it('is Phera', () => {
      expect(APP_NAME).toBe('Phera');
    });
  });

  describe('COLLECTIONS', () => {
    it('has all required collection paths', () => {
      expect(COLLECTIONS.USERS).toBe('users');
      expect(COLLECTIONS.WEDDINGS).toBe('weddings');
      expect(COLLECTIONS.EVENTS).toBe('events');
      expect(COLLECTIONS.GUESTS).toBe('guests');
      expect(COLLECTIONS.SEATING).toBe('seating');
      expect(COLLECTIONS.PHOTO_GROUPS).toBe('photoGroups');
      expect(COLLECTIONS.BETS).toBe('bets');
    });
  });

  describe('EVENT_TEMPLATES', () => {
    it('includes core Indian wedding events', () => {
      const names = EVENT_TEMPLATES.map((e) => e.name);
      expect(names).toContain('Mehndi');
      expect(names).toContain('Sangeet');
      expect(names).toContain('Haldi');
      expect(names).toContain('Garba');
      expect(names).toContain('Wedding Ceremony');
      expect(names).toContain('Reception');
    });

    it('each template has a name and dress code', () => {
      EVENT_TEMPLATES.forEach((t) => {
        expect(t.name).toBeTruthy();
        expect(t.defaultDressCode).toBeTruthy();
      });
    });
  });

  describe('TABLE_PRESETS', () => {
    it('has at least 8 presets', () => {
      expect(TABLE_PRESETS.length).toBeGreaterThanOrEqual(8);
    });

    it('each preset has required dimensions', () => {
      TABLE_PRESETS.forEach((preset) => {
        expect(preset.shape).toBeTruthy();
        expect(preset.capacity).toBeGreaterThan(0);
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
      });
    });

    it('includes head table', () => {
      const headTable = TABLE_PRESETS.find((p) => p.shape === 'head-table');
      expect(headTable).toBeDefined();
      expect(headTable.capacity).toBeGreaterThanOrEqual(12);
    });
  });

  describe('TABLE_DEFAULTS', () => {
    it('has defaults for all shapes', () => {
      const shapes = Object.values(TABLE_SHAPES);
      shapes.forEach((shape) => {
        expect(TABLE_DEFAULTS[shape]).toBeDefined();
        expect(TABLE_DEFAULTS[shape].capacity).toBeGreaterThan(0);
      });
    });
  });

  describe('DIETARY_OPTIONS', () => {
    it('includes Indian-specific options', () => {
      const values = DIETARY_OPTIONS.map((d) => d.value);
      expect(values).toContain('vegetarian');
      expect(values).toContain('jain');
      expect(values).toContain('vegan');
      expect(values).toContain('non-veg');
    });

    it('each option has value and label', () => {
      DIETARY_OPTIONS.forEach((opt) => {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
      });
    });
  });

  describe('LANGUAGES', () => {
    it('includes common Indian languages', () => {
      const codes = LANGUAGES.map((l) => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
      expect(codes).toContain('gu');
      expect(codes).toContain('ta');
      expect(codes).toContain('pa');
    });

    it('each language has native label', () => {
      LANGUAGES.forEach((lang) => {
        expect(lang.nativeLabel).toBeTruthy();
      });
    });
  });

  describe('RSVP_STATUS', () => {
    it('has the three statuses', () => {
      expect(RSVP_STATUS.PENDING).toBe('pending');
      expect(RSVP_STATUS.ACCEPTED).toBe('accepted');
      expect(RSVP_STATUS.DECLINED).toBe('declined');
    });
  });

  describe('SIDES', () => {
    it('has bride and groom', () => {
      expect(SIDES).toContain('bride');
      expect(SIDES).toContain('groom');
    });
  });
});
