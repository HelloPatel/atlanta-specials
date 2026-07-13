export const WEBSITE_THEMES = {
  'classic-rose': {
    key: 'classic-rose',
    name: 'Classic Rose',
    description: 'Soft florals, romantic blush, and timeless elegance.',
    primary: '#be123c',
    accent: '#fda4af',
    background: '#fff1f2',
    surface: '#ffffff',
    text: '#4c0519',
    muted: '#9f1239',
    fontName: 'Playfair Display',
    fontFamily: '"Playfair Display", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(76, 5, 25, 0.72), rgba(190, 24, 93, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 18%, rgba(253, 164, 175, 0.65), transparent 34%), linear-gradient(135deg, #881337, #4c0519)',
  },
  'royal-gold': {
    key: 'royal-gold',
    name: 'Royal Gold',
    description: 'Warm gold accents with a luxurious celebration feel.',
    primary: '#92400e',
    accent: '#fbbf24',
    background: '#fffbeb',
    surface: '#fffdf7',
    text: '#451a03',
    muted: '#a16207',
    fontName: 'Cormorant Garamond',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(69, 26, 3, 0.76), rgba(146, 64, 14, 0.42))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(251, 191, 36, 0.72), transparent 32%), linear-gradient(135deg, #92400e, #451a03)',
  },
  'garden-green': {
    key: 'garden-green',
    name: 'Garden Green',
    description: 'Fresh botanical tones with an airy outdoor vibe.',
    primary: '#166534',
    accent: '#86efac',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#052e16',
    muted: '#15803d',
    fontName: 'Lora',
    fontFamily: '"Lora", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(5, 46, 22, 0.74), rgba(22, 101, 52, 0.44))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(134, 239, 172, 0.5), transparent 34%), linear-gradient(135deg, #166534, #052e16)',
  },
  'modern-minimal': {
    key: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean slate neutrals with a refined editorial look.',
    primary: '#1e293b',
    accent: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    fontName: 'Inter',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(51, 65, 85, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(148, 163, 184, 0.34), transparent 34%), linear-gradient(135deg, #334155, #0f172a)',
  },
  'marigold-mandap': {
    key: 'marigold-mandap',
    name: 'Marigold Mandap',
    description: 'Vibrant marigold orange with traditional Indian warmth.',
    primary: '#c2410c',
    accent: '#fb923c',
    background: '#fff7ed',
    surface: '#fffbf5',
    text: '#431407',
    muted: '#9a3412',
    fontName: 'Yeseva One',
    fontFamily: '"Yeseva One", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Yeseva+One&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(67, 20, 7, 0.76), rgba(194, 65, 12, 0.42))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(251, 146, 60, 0.7), transparent 34%), linear-gradient(135deg, #c2410c, #431407)',
  },
  'midnight-sangeet': {
    key: 'midnight-sangeet',
    name: 'Midnight Sangeet',
    description: 'Deep navy and violet for an elegant evening celebration.',
    primary: '#312e81',
    accent: '#a78bfa',
    background: '#eef2ff',
    surface: '#ffffff',
    text: '#1e1b4b',
    muted: '#4338ca',
    fontName: 'DM Serif Display',
    fontFamily: '"DM Serif Display", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(30, 27, 75, 0.82), rgba(49, 46, 129, 0.48))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(167, 139, 250, 0.55), transparent 34%), linear-gradient(135deg, #312e81, #1e1b4b)',
  },
};

export const WEBSITE_HERO_PATTERNS = ['none', 'mandala', 'floral', 'geometric', 'paisley'];

export function getThemeConfig(themeKey) {
  return WEBSITE_THEMES[themeKey] || WEBSITE_THEMES['classic-rose'];
}

export function getCoupleDisplayName(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Our Wedding';
}

export function createDefaultWebsiteConfig(eventIds = []) {
  return {
    websiteTheme: 'classic-rose',
    websiteHero: {
      date: '',
      tagline: '',
      backgroundImage: '',
      pattern: 'none',
    },
    websiteStory: {
      enabled: false,
      text: '',
    },
    websiteGallery: {
      enabled: false,
      images: [],
    },
    websiteHotels: {
      enabled: false,
      items: [],
    },
    websiteRegistry: {
      enabled: false,
      items: [],
    },
    websiteRsvp: {
      enabled: false,
      buttonText: 'RSVP Now',
    },
    websiteCustomColors: {
      primary: '',
      accent: '',
      background: '',
    },
    websiteFooter: "We can't wait to celebrate with you!",
    websitePublished: false,
    websiteEventIds: eventIds,
  };
}

function normalizeHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '';
}

function normalizeHeroPattern(value) {
  return WEBSITE_HERO_PATTERNS.includes(value) ? value : 'none';
}

export function normalizeWebsiteConfig(wedding = {}, eventIds = []) {
  const defaults = createDefaultWebsiteConfig(eventIds);

  return {
    websiteTheme: wedding.websiteTheme || defaults.websiteTheme,
    websiteHero: {
      date: wedding.websiteHero?.date || wedding.weddingDate || defaults.websiteHero.date,
      tagline: wedding.websiteHero?.tagline || defaults.websiteHero.tagline,
      backgroundImage: wedding.websiteHero?.backgroundImage || defaults.websiteHero.backgroundImage,
      pattern: normalizeHeroPattern(wedding.websiteHero?.pattern),
    },
    websiteStory: {
      enabled: Boolean(wedding.websiteStory?.enabled),
      text: wedding.websiteStory?.text || '',
    },
    websiteGallery: {
      enabled: Boolean(wedding.websiteGallery?.enabled),
      images: Array.isArray(wedding.websiteGallery?.images)
        ? wedding.websiteGallery.images.filter((image) => typeof image === 'string' && image).slice(0, 12)
        : [],
    },
    websiteHotels: {
      enabled: Boolean(wedding.websiteHotels?.enabled),
      items: Array.isArray(wedding.websiteHotels?.items)
        ? wedding.websiteHotels.items.map((item) => ({
            name: item?.name || '',
            address: item?.address || '',
            link: item?.link || '',
            groupRateCode: item?.groupRateCode || '',
          }))
        : [],
    },
    websiteRegistry: {
      enabled: Boolean(wedding.websiteRegistry?.enabled),
      items: Array.isArray(wedding.websiteRegistry?.items)
        ? wedding.websiteRegistry.items.map((item) => ({
            name: item?.name || '',
            url: item?.url || '',
          }))
        : [],
    },
    websiteRsvp: {
      enabled: Boolean(wedding.websiteRsvp?.enabled),
      buttonText: wedding.websiteRsvp?.buttonText || 'RSVP Now',
    },
    websiteCustomColors: {
      primary: normalizeHexColor(wedding.websiteCustomColors?.primary),
      accent: normalizeHexColor(wedding.websiteCustomColors?.accent),
      background: normalizeHexColor(wedding.websiteCustomColors?.background),
    },
    websiteFooter: wedding.websiteFooter || defaults.websiteFooter,
    websitePublished: Boolean(wedding.websitePublished),
    websiteEventIds: Array.isArray(wedding.websiteEventIds) ? wedding.websiteEventIds : defaults.websiteEventIds,
  };
}

export function sanitizeWebsiteConfig(config) {
  return {
    websiteTheme: config.websiteTheme || 'classic-rose',
    websiteHero: {
      date: config.websiteHero?.date || '',
      tagline: config.websiteHero?.tagline?.trim() || '',
      backgroundImage: config.websiteHero?.backgroundImage || '',
      pattern: normalizeHeroPattern(config.websiteHero?.pattern),
    },
    websiteStory: {
      enabled: Boolean(config.websiteStory?.enabled),
      text: config.websiteStory?.text?.trim() || '',
    },
    websiteGallery: {
      enabled: Boolean(config.websiteGallery?.enabled),
      images: (config.websiteGallery?.images || [])
        .filter((image) => typeof image === 'string' && image)
        .slice(0, 12),
    },
    websiteHotels: {
      enabled: Boolean(config.websiteHotels?.enabled),
      items: (config.websiteHotels?.items || [])
        .map((item) => ({
          name: item?.name?.trim() || '',
          address: item?.address?.trim() || '',
          link: item?.link?.trim() || '',
          groupRateCode: item?.groupRateCode?.trim() || '',
        }))
        .filter((item) => item.name || item.address || item.link || item.groupRateCode),
    },
    websiteRegistry: {
      enabled: Boolean(config.websiteRegistry?.enabled),
      items: (config.websiteRegistry?.items || [])
        .map((item) => ({
          name: item?.name?.trim() || '',
          url: item?.url?.trim() || '',
        }))
        .filter((item) => item.name || item.url),
    },
    websiteRsvp: {
      enabled: Boolean(config.websiteRsvp?.enabled),
      buttonText: config.websiteRsvp?.buttonText?.trim() || 'RSVP Now',
    },
    websiteCustomColors: {
      primary: normalizeHexColor(config.websiteCustomColors?.primary),
      accent: normalizeHexColor(config.websiteCustomColors?.accent),
      background: normalizeHexColor(config.websiteCustomColors?.background),
    },
    websiteFooter: config.websiteFooter?.trim() || "We can't wait to celebrate with you!",
    websitePublished: Boolean(config.websitePublished),
    websiteEventIds: Array.from(new Set((config.websiteEventIds || []).filter(Boolean))),
  };
}

export function getPublicWeddingWebsiteLink(weddingId, slug) {
  const identifier = slug || weddingId;
  return `${window.location.origin}/w/${identifier}`;
}
