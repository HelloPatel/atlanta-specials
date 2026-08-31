// Each theme pairs a DISPLAY face (headings) with a clean BODY face (paragraphs
// and UI). Type pairing — never setting long-form text in a heavy display serif
// — is the single biggest lever for perceived quality, so every preset ships a
// deliberate two-font system loaded in one request.
export const WEBSITE_THEMES = {
  'classic-rose': {
    key: 'classic-rose',
    name: 'Classic Rose',
    description: 'An arched invitation window with a serif monogram and soft blush romance.',
    layout: 'arch',
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
    description: 'A bold poster layout with a top menu, oversized names, and giant date numerals.',
    layout: 'poster',
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
    description: 'A dark two-column split: script names and countdown beside an evening photo panel.',
    layout: 'split',
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
  'coastal-voyage': {
    key: 'coastal-voyage',
    name: 'Coastal Voyage',
    description: 'A destination boarding-pass hero — origin, destination and a perforated ticket stub for the big day.',
    layout: 'ticket',
    primary: '#0369a1',
    accent: '#0891b2',
    background: '#f0f9ff',
    surface: '#ffffff',
    text: '#0c4a6e',
    muted: '#0e7490',
    fontName: 'Spectral',
    fontFamily: '"Spectral", Georgia, serif',
    bodyFontName: 'Karla',
    bodyFontFamily: '"Karla", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Spectral:wght@500;600;700&family=Karla:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(12, 74, 110, 0.72), rgba(8, 145, 178, 0.4))',
    heroBackground: 'radial-gradient(circle at 80% 12%, rgba(56, 189, 248, 0.55), transparent 36%), linear-gradient(135deg, #0369a1, #0c4a6e)',
  },
  'neon-nights': {
    key: 'neon-nights',
    name: 'Neon Nights',
    description: 'An electric after-dark hero with a kinetic name marquee and a glass date chip.',
    layout: 'marquee',
    primary: '#6d28d9',
    accent: '#22d3ee',
    background: '#f5f3ff',
    surface: '#ffffff',
    text: '#2e1065',
    muted: '#7c3aed',
    fontName: 'Syne',
    fontFamily: '"Syne", system-ui, sans-serif',
    bodyFontName: 'Space Grotesk',
    bodyFontFamily: '"Space Grotesk", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Grotesk:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(46, 16, 101, 0.85), rgba(109, 40, 217, 0.5))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(34, 211, 238, 0.5), transparent 34%), linear-gradient(135deg, #2e1065, #0f0724)',
  },
  'vintage-postcard': {
    key: 'vintage-postcard',
    name: 'Vintage Postcard',
    description: 'A mailed-from-paradise postcard hero with a postage stamp, postmark and handwritten names.',
    layout: 'stamp',
    primary: '#0f766e',
    accent: '#b45309',
    background: '#fffdf7',
    surface: '#ffffff',
    text: '#44403c',
    muted: '#78716c',
    fontName: 'Cormorant Garamond',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    bodyFontName: 'Courier Prime',
    bodyFontFamily: '"Courier Prime", "Courier New", monospace',
    scriptFontName: 'Caveat',
    scriptFontFamily: '"Caveat", "Cormorant Garamond", cursive',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Courier+Prime:wght@400;700&family=Caveat:wght@600;700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(68, 64, 60, 0.4), rgba(15, 118, 110, 0.28))',
    heroBackground: 'radial-gradient(circle at 82% 18%, rgba(180, 83, 9, 0.28), transparent 40%), linear-gradient(135deg, #fffdf7, #f5efe0)',
  },
  'brutalist-noir': {
    key: 'brutalist-noir',
    name: 'Brutalist Noir',
    description: 'A stark Swiss-grid hero — oversized uppercase names, hairline rules and a single red accent.',
    layout: 'grid',
    primary: '#111827',
    accent: '#dc2626',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#0a0a0a',
    muted: '#525252',
    fontName: 'Archivo Black',
    fontFamily: '"Archivo Black", system-ui, sans-serif',
    bodyFontName: 'Archivo',
    bodyFontFamily: '"Archivo", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(10, 10, 10, 0.78), rgba(17, 24, 39, 0.5))',
    heroBackground: 'linear-gradient(135deg, #111827, #0a0a0a)',
  },
  'aurora-dream': {
    key: 'aurora-dream',
    name: 'Aurora Dream',
    description: 'Floating aurora blobs drift behind a frosted-glass card holding your names and countdown.',
    layout: 'aurora',
    primary: '#4f46e5',
    accent: '#06b6d4',
    background: '#f5f7ff',
    surface: '#ffffff',
    text: '#1e1b4b',
    muted: '#4338ca',
    fontName: 'Quicksand',
    fontFamily: '"Quicksand", system-ui, sans-serif',
    bodyFontName: 'Nunito Sans',
    bodyFontFamily: '"Nunito Sans", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Nunito+Sans:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(30, 27, 75, 0.55), rgba(79, 70, 229, 0.3))',
    heroBackground: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.55), transparent 40%), radial-gradient(circle at 80% 30%, rgba(6, 182, 212, 0.5), transparent 42%), linear-gradient(135deg, #eef2ff, #f5f7ff)',
  },
  'heritage-crest': {
    key: 'heritage-crest',
    name: 'Heritage Crest',
    description: 'A ceremonial monogram seal — laurel crest, joined initials and an engraved date band.',
    layout: 'monogram',
    primary: '#065f46',
    accent: '#b08d57',
    background: '#fbf9f4',
    surface: '#ffffff',
    text: '#064e3b',
    muted: '#047857',
    fontName: 'Cinzel',
    fontFamily: '"Cinzel", Georgia, serif',
    bodyFontName: 'Cormorant Garamond',
    bodyFontFamily: '"Cormorant Garamond", Georgia, serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(6, 78, 59, 0.72), rgba(6, 95, 70, 0.42))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(176, 141, 87, 0.4), transparent 36%), linear-gradient(135deg, #065f46, #064e3b)',
  },
  'cinema-reel': {
    key: 'cinema-reel',
    name: 'Cinema Reel',
    description: 'A now-showing marquee hero with letterbox bars, a feature title card and showtime credits.',
    layout: 'filmstrip',
    primary: '#18181b',
    accent: '#eab308',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#09090b',
    muted: '#52525b',
    fontName: 'Oswald',
    fontFamily: '"Oswald", system-ui, sans-serif',
    bodyFontName: 'Barlow',
    bodyFontFamily: '"Barlow", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(9, 9, 11, 0.82), rgba(24, 24, 27, 0.5))',
    heroBackground: 'linear-gradient(135deg, #18181b, #09090b)',
  },
  'retro-sunset': {
    key: 'retro-sunset',
    name: 'Retro Sunset',
    description: 'A 70s sunburst hero with groovy rounded type and radiating mustard-and-orange rays.',
    layout: 'retro',
    primary: '#a16207',
    accent: '#ea580c',
    background: '#fdf6ec',
    surface: '#fffaf0',
    text: '#7c2d12',
    muted: '#b45309',
    fontName: 'Righteous',
    fontFamily: '"Righteous", system-ui, sans-serif',
    bodyFontName: 'Poppins',
    bodyFontFamily: '"Poppins", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Righteous&family=Poppins:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(124, 45, 18, 0.5), rgba(234, 88, 12, 0.3))',
    heroBackground: 'radial-gradient(circle at 50% 120%, rgba(234, 88, 12, 0.55), transparent 45%), linear-gradient(135deg, #fdf6ec, #fbe6cf)',
  },
  'deco-gold': {
    key: 'deco-gold',
    name: 'Deco Gold',
    description: 'A symmetrical Art Deco frame in black and gold with a geometric sunfan and engraved names.',
    layout: 'deco',
    primary: '#1c1917',
    accent: '#ca8a04',
    background: '#faf7f0',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#57534e',
    fontName: 'Poiret One',
    fontFamily: '"Poiret One", system-ui, sans-serif',
    bodyFontName: 'Jost',
    bodyFontFamily: '"Jost", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Poiret+One&family=Jost:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(28, 25, 23, 0.82), rgba(41, 37, 36, 0.5))',
    heroBackground: 'radial-gradient(circle at 50% 8%, rgba(202, 138, 4, 0.4), transparent 34%), linear-gradient(135deg, #1c1917, #0c0a09)',
  },
  'confetti-pop': {
    key: 'confetti-pop',
    name: 'Confetti Pop',
    description: 'A joyful, playful hero with floating terrazzo confetti and a rounded display face.',
    layout: 'terrazzo',
    primary: '#7c3aed',
    accent: '#f59e0b',
    background: '#f5f3ff',
    surface: '#ffffff',
    text: '#2e1065',
    muted: '#6d28d9',
    fontName: 'Fredoka',
    fontFamily: '"Fredoka", system-ui, sans-serif',
    bodyFontName: 'Nunito',
    bodyFontFamily: '"Nunito", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(46, 16, 101, 0.72), rgba(124, 58, 237, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 18%, rgba(196, 181, 253, 0.6), transparent 34%), linear-gradient(135deg, #7c3aed, #2e1065)',
  },
  'watercolor-wash': {
    key: 'watercolor-wash',
    name: 'Watercolor Wash',
    description: 'Soft painterly blooms drift behind an airy serif name for a dreamy, romantic feel.',
    layout: 'watercolor',
    primary: '#a21caf',
    accent: '#db2777',
    background: '#fdf4ff',
    surface: '#ffffff',
    text: '#4a044e',
    muted: '#86198f',
    fontName: 'Gilda Display',
    fontFamily: '"Gilda Display", Georgia, serif',
    bodyFontName: 'Mulish',
    bodyFontFamily: '"Mulish", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Gilda+Display&family=Mulish:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(74, 4, 78, 0.72), rgba(162, 28, 175, 0.45))',
    heroBackground: 'radial-gradient(circle at 78% 18%, rgba(240, 171, 252, 0.6), transparent 34%), linear-gradient(135deg, #a21caf, #4a044e)',
  },
  'blanc-minimal': {
    key: 'blanc-minimal',
    name: 'Blanc Minimal',
    description: 'Gallery-grade whitespace, a single hairline rule and a thin high-contrast serif.',
    layout: 'minimal',
    primary: '#292524',
    accent: '#a8a29e',
    background: '#fafaf9',
    surface: '#ffffff',
    text: '#1c1917',
    muted: '#78716c',
    fontName: 'Cormorant',
    fontFamily: '"Cormorant", Georgia, serif',
    bodyFontName: 'Inter',
    bodyFontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600&family=Inter:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(28, 25, 23, 0.7), rgba(41, 37, 36, 0.4))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(168, 162, 158, 0.35), transparent 34%), linear-gradient(135deg, #44403c, #1c1917)',
  },
  'iridescent-mesh': {
    key: 'iridescent-mesh',
    name: 'Iridescent Mesh',
    description: 'A drifting gradient mesh glows behind a modern glass headline for a bold, futuristic mood.',
    layout: 'mesh',
    primary: '#6366f1',
    accent: '#06b6d4',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    muted: '#475569',
    fontName: 'Sora',
    fontFamily: '"Sora", system-ui, sans-serif',
    bodyFontName: 'Inter',
    bodyFontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(30, 27, 75, 0.5))',
    heroBackground: 'radial-gradient(circle at 20% 22%, rgba(99, 102, 241, 0.6), transparent 42%), radial-gradient(circle at 82% 30%, rgba(6, 182, 212, 0.5), transparent 44%), linear-gradient(135deg, #0f172a, #1e1b4b)',
  },
  'terracotta-mosaic': {
    key: 'terracotta-mosaic',
    name: 'Terracotta Mosaic',
    description: 'A warm tiled grid of name, date, place and monogram in sun-baked terracotta tones.',
    layout: 'mosaic',
    primary: '#c2410c',
    accent: '#a16207',
    background: '#fef6ee',
    surface: '#ffffff',
    text: '#4c1d0a',
    muted: '#9a3412',
    fontName: 'Fraunces',
    fontFamily: '"Fraunces", Georgia, serif',
    bodyFontName: 'Karla',
    bodyFontFamily: '"Karla", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Karla:wght@400;500;600&display=swap',
    ornaments: false,
    heroOverlay: 'linear-gradient(135deg, rgba(76, 29, 10, 0.74), rgba(194, 65, 12, 0.44))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(253, 186, 116, 0.5), transparent 34%), linear-gradient(135deg, #c2410c, #4c1d0a)',
  },
};

// Layouts drive genuinely different structure (hero + section styling), not
// just a palette swap. Each theme opts into one.
export const WEBSITE_LAYOUTS = [
  'editorial', 'botanical', 'luxe', 'arch', 'poster', 'split',
  'ticket', 'marquee', 'stamp', 'grid', 'aurora', 'monogram', 'filmstrip', 'retro', 'deco',
  'terrazzo', 'watercolor', 'minimal', 'mesh', 'mosaic',
];

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
