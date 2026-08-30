// Each theme pairs a DISPLAY face (headings) with a clean BODY face (paragraphs
// and UI). Type pairing — never setting long-form text in a heavy display serif
// — is the single biggest lever for perceived quality, so every preset ships a
// deliberate two-font system loaded in one request.
export const WEBSITE_THEMES = {
  'classic-rose': {
    key: 'classic-rose',
    name: 'Classic Rose',
    description: 'Botanical framing, a serif monogram, and soft blush romance.',
    layout: 'botanical',
    primary: '#be123c',
    accent: '#e11d48',
    background: '#fff1f2',
    surface: '#ffffff',
    text: '#4c0519',
    muted: '#9f1239',
    fontName: 'Playfair Display',
    fontFamily: '"Playfair Display", Georgia, serif',
    bodyFontName: 'Jost',
    bodyFontFamily: '"Jost", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Jost:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(76, 5, 25, 0.72), rgba(190, 24, 93, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 18%, rgba(253, 164, 175, 0.65), transparent 34%), linear-gradient(135deg, #881337, #4c0519)',
  },
  'royal-gold': {
    key: 'royal-gold',
    name: 'Royal Gold',
    description: 'A dark, luxe hero with a gold script name and a live countdown.',
    layout: 'luxe',
    primary: '#92400e',
    accent: '#d97706',
    background: '#fffbeb',
    surface: '#fffdf7',
    text: '#451a03',
    muted: '#a16207',
    fontName: 'Cormorant Garamond',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    bodyFontName: 'Mulish',
    bodyFontFamily: '"Mulish", system-ui, sans-serif',
    scriptFontName: 'Tangerine',
    scriptFontFamily: '"Tangerine", "Cormorant Garamond", cursive',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Mulish:wght@400;500;600&family=Tangerine:wght@700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(69, 26, 3, 0.76), rgba(146, 64, 14, 0.42))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(251, 191, 36, 0.72), transparent 32%), linear-gradient(135deg, #92400e, #451a03)',
  },
  'garden-green': {
    key: 'garden-green',
    name: 'Garden Green',
    description: 'Airy botanical layout with leafy dividers and a framed portrait.',
    layout: 'botanical',
    primary: '#166534',
    accent: '#059669',
    background: '#f0fdf4',
    surface: '#ffffff',
    text: '#052e16',
    muted: '#15803d',
    fontName: 'Lora',
    fontFamily: '"Lora", Georgia, serif',
    bodyFontName: 'Nunito Sans',
    bodyFontFamily: '"Nunito Sans", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Nunito+Sans:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(5, 46, 22, 0.74), rgba(22, 101, 52, 0.44))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(134, 239, 172, 0.5), transparent 34%), linear-gradient(135deg, #166534, #052e16)',
  },
  'modern-minimal': {
    key: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Editorial magazine layout: top nav, giant ampersand, hairline rules.',
    layout: 'editorial',
    primary: '#1e293b',
    accent: '#0f766e',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    fontName: 'Fraunces',
    fontFamily: '"Fraunces", Georgia, serif',
    bodyFontName: 'Inter',
    bodyFontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(51, 65, 85, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(148, 163, 184, 0.34), transparent 34%), linear-gradient(135deg, #334155, #0f172a)',
  },
  'marigold-mandap': {
    key: 'marigold-mandap',
    name: 'Marigold Mandap',
    description: 'Editorial layout with vibrant marigold warmth and a bold display serif.',
    layout: 'editorial',
    primary: '#c2410c',
    accent: '#ea580c',
    background: '#fff7ed',
    surface: '#fffbf5',
    text: '#431407',
    muted: '#9a3412',
    fontName: 'Yeseva One',
    fontFamily: '"Yeseva One", Georgia, serif',
    bodyFontName: 'Mulish',
    bodyFontFamily: '"Mulish", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Yeseva+One&family=Mulish:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(67, 20, 7, 0.76), rgba(194, 65, 12, 0.42))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(251, 146, 60, 0.7), transparent 34%), linear-gradient(135deg, #c2410c, #431407)',
  },
  'midnight-sangeet': {
    key: 'midnight-sangeet',
    name: 'Midnight Sangeet',
    description: 'Dark evening luxe: violet-navy hero, gold script, countdown centerpiece.',
    layout: 'luxe',
    primary: '#312e81',
    accent: '#7c3aed',
    background: '#eef2ff',
    surface: '#ffffff',
    text: '#1e1b4b',
    muted: '#4338ca',
    fontName: 'DM Serif Display',
    fontFamily: '"DM Serif Display", Georgia, serif',
    bodyFontName: 'Jost',
    bodyFontFamily: '"Jost", system-ui, sans-serif',
    scriptFontName: 'Tangerine',
    scriptFontFamily: '"Tangerine", "DM Serif Display", cursive',
    fontUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Jost:wght@400;500;600&family=Tangerine:wght@700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(30, 27, 75, 0.82), rgba(49, 46, 129, 0.48))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(167, 139, 250, 0.55), transparent 34%), linear-gradient(135deg, #312e81, #1e1b4b)',
  },
};

// Layouts drive genuinely different structure (hero + section styling), not
// just a palette swap. Each theme opts into one.
export const WEBSITE_LAYOUTS = ['editorial', 'botanical', 'luxe'];

export const WEBSITE_HERO_PATTERNS = ['none', 'mandala', 'floral', 'geometric', 'paisley'];

export function getThemeConfig(themeKey) {
  return WEBSITE_THEMES[themeKey] || WEBSITE_THEMES['classic-rose'];
}

// Convert a #rrggbb hex to an rgba() string. Falls back to translucent white for
// malformed input so callers can safely build gradients/overlays.
export function hexToRgba(hex, alpha) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return `rgba(255, 255, 255, ${alpha})`;
  const normalized = hex.slice(1);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Resolve the final theme object (base preset + any custom color overrides) for a
// normalized website config. Single source of truth shared by the public website
// preview and the public RSVP page so both stay visually in sync.
export function resolveWebsiteTheme(config = {}) {
  const baseTheme = getThemeConfig(config.websiteTheme);
  const custom = config.websiteCustomColors || {};
  return {
    ...baseTheme,
    primary: custom.primary || baseTheme.primary,
    accent: custom.accent || baseTheme.accent,
    background: custom.background || baseTheme.background,
    heroOverlay: custom.primary
      ? `linear-gradient(135deg, ${hexToRgba(baseTheme.text, 0.74)}, ${hexToRgba(custom.primary, 0.5)})`
      : baseTheme.heroOverlay,
    heroBackground: custom.primary
      ? `radial-gradient(circle at 78% 16%, ${hexToRgba(custom.accent || baseTheme.accent, 0.5)}, transparent 34%), linear-gradient(135deg, ${custom.primary}, ${baseTheme.text})`
      : baseTheme.heroBackground,
  };
}

export function getCoupleDisplayName(wedding) {
  return wedding?.coupleName || [wedding?.coupleName1, wedding?.coupleName2].filter(Boolean).join(' & ') || 'Our Wedding';
}

// Split a couple into two display names so layouts can stack them around a
// large ampersand / monogram. Falls back gracefully to a single name.
export function getCoupleNames(wedding) {
  const first = (wedding?.coupleName1 || '').trim();
  const second = (wedding?.coupleName2 || '').trim();
  if (first || second) {
    return { first: first || second, second: first ? second : '' };
  }
  const combined = (wedding?.coupleName || '').trim();
  if (!combined) return { first: 'Our', second: 'Wedding' };
  const parts = combined.split(/\s+(?:&|and|\+|x)\s+/i);
  if (parts.length >= 2) {
    return { first: parts[0].trim(), second: parts.slice(1).join(' & ').trim() };
  }
  return { first: combined, second: '' };
}

// Two-letter monogram (first initial of each partner) for botanical/luxe crests.
export function getCoupleInitials(wedding) {
  const { first, second } = getCoupleNames(wedding);
  const a = (first || '').charAt(0).toUpperCase();
  const b = (second || '').charAt(0).toUpperCase();
  return (a + b) || 'W';
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
