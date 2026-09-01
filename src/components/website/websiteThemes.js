// Each theme pairs a DISPLAY face (headings) with a clean BODY face (paragraphs
// and UI). Type pairing — never setting long-form text in a heavy display serif
// — is the single biggest lever for perceived quality, so every preset ships a
// deliberate two-font system loaded in one request.
export const WEBSITE_THEMES = {
  'classic-rose': {
    key: 'classic-rose',
    name: 'Amara',
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
    name: 'Zari',
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
    name: 'Juniper',
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
    name: 'Sloane',
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
    name: 'Marigold',
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
    name: 'Midnight',
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
    name: 'Amalfi',
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
    name: 'Electric',
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
    name: 'Voyage',
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
    name: 'Noir',
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
    name: 'Aurora',
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
    name: 'Beaumont',
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
    name: 'Cinema',
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
    name: 'Sundown',
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
    name: 'Ravenna',
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
    name: 'Poppy',
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
    name: 'Camellia',
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
    name: 'Blanc',
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
    name: 'Prism',
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
    name: 'Ravello',
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
  'sindoor-silk': {
    key: 'sindoor-silk',
    name: 'Rani',
    description: 'A deep maroon hero with a gold script name and a live countdown, made for a grand shaadi.',
    layout: 'luxe',
    primary: '#9f1239',
    accent: '#d4af37',
    background: '#fff7ed',
    surface: '#fffdf7',
    text: '#4c0519',
    muted: '#9f1239',
    fontName: 'Cormorant Garamond',
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    bodyFontName: 'Mulish',
    bodyFontFamily: '"Mulish", system-ui, sans-serif',
    scriptFontName: 'Tangerine',
    scriptFontFamily: '"Tangerine", "Cormorant Garamond", cursive',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Mulish:wght@400;500;600&family=Tangerine:wght@700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(76, 5, 25, 0.78), rgba(159, 18, 57, 0.46))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(212, 175, 55, 0.6), transparent 32%), linear-gradient(135deg, #9f1239, #4c0519)',
  },
  'kumkum-poster': {
    key: 'kumkum-poster',
    name: 'Vermillion',
    description: 'A bold crimson poster with a top menu, oversized names, and giant date numerals.',
    layout: 'poster',
    primary: '#b91c1c',
    accent: '#f59e0b',
    background: '#fff7ed',
    surface: '#fffbf5',
    text: '#450a0a',
    muted: '#991b1b',
    fontName: 'Yeseva One',
    fontFamily: '"Yeseva One", Georgia, serif',
    bodyFontName: 'Mulish',
    bodyFontFamily: '"Mulish", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Yeseva+One&family=Mulish:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(69, 10, 10, 0.78), rgba(185, 28, 28, 0.44))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(245, 158, 11, 0.7), transparent 34%), linear-gradient(135deg, #b91c1c, #450a0a)',
  },
  'mehndi-henna': {
    key: 'mehndi-henna',
    name: 'Henna',
    description: 'Airy botanical layout in henna green and gold with leafy dividers and a framed portrait.',
    layout: 'botanical',
    primary: '#3f6212',
    accent: '#ca8a04',
    background: '#f7fee7',
    surface: '#ffffff',
    text: '#1a2e05',
    muted: '#4d7c0f',
    fontName: 'Lora',
    fontFamily: '"Lora", Georgia, serif',
    bodyFontName: 'Nunito Sans',
    bodyFontFamily: '"Nunito Sans", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Nunito+Sans:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(26, 46, 5, 0.76), rgba(63, 98, 18, 0.44))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(202, 138, 4, 0.5), transparent 34%), linear-gradient(135deg, #3f6212, #1a2e05)',
  },
  'peacock-royal': {
    key: 'peacock-royal',
    name: 'Mayura',
    description: 'A jewel-tone mesh hero in teal and gold with a soft iridescent glow.',
    layout: 'mesh',
    primary: '#0f766e',
    accent: '#d4af37',
    background: '#ecfeff',
    surface: '#ffffff',
    text: '#083344',
    muted: '#0e7490',
    fontName: 'Fraunces',
    fontFamily: '"Fraunces", Georgia, serif',
    bodyFontName: 'Inter',
    bodyFontFamily: '"Inter", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(8, 51, 68, 0.78), rgba(15, 118, 110, 0.44))',
    heroBackground: 'radial-gradient(circle at 76% 16%, rgba(212, 175, 55, 0.5), transparent 32%), linear-gradient(135deg, #0f766e, #083344)',
  },
  'lotus-blush': {
    key: 'lotus-blush',
    name: 'Kamala',
    description: 'A soft watercolor wash in rose and gold with painterly edges and gentle serif type.',
    layout: 'watercolor',
    primary: '#be185d',
    accent: '#d4af37',
    background: '#fdf2f8',
    surface: '#ffffff',
    text: '#500724',
    muted: '#9d174d',
    fontName: 'Playfair Display',
    fontFamily: '"Playfair Display", Georgia, serif',
    bodyFontName: 'Karla',
    bodyFontFamily: '"Karla", system-ui, sans-serif',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Karla:wght@400;500;600&display=swap',
    ornaments: true,
    heroOverlay: 'linear-gradient(135deg, rgba(80, 7, 36, 0.72), rgba(190, 24, 93, 0.44))',
    heroBackground: 'radial-gradient(circle at 78% 16%, rgba(212, 175, 55, 0.45), transparent 34%), linear-gradient(135deg, #be185d, #500724)',
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

// Curated groupings so the theme picker reads like a styled lookbook instead of a
// flat wall of swatches. Every theme key belongs to exactly one group; any theme
// not listed here falls back to a catch-all group in the UI.
export const THEME_GROUPS = [
  {
    key: 'ceremonial',
    name: 'Ceremonial & Indian',
    description: 'Marigold, mehndi, and gold for every rasm.',
    themes: ['marigold-mandap', 'sindoor-silk', 'kumkum-poster', 'mehndi-henna', 'peacock-royal', 'lotus-blush'],
  },
  {
    key: 'romantic',
    name: 'Romantic & Soft',
    description: 'Blush tones, florals, and gentle serif type.',
    themes: ['classic-rose', 'watercolor-wash', 'garden-green', 'confetti-pop', 'aurora-dream'],
  },
  {
    key: 'regal',
    name: 'Traditional & Regal',
    description: 'Gold, crests, and ceremonial warmth.',
    themes: ['royal-gold', 'heritage-crest', 'deco-gold', 'terracotta-mosaic'],
  },
  {
    key: 'modern',
    name: 'Modern & Minimal',
    description: 'Clean grids, big type, and quiet color.',
    themes: ['modern-minimal', 'blanc-minimal', 'brutalist-noir', 'iridescent-mesh'],
  },
  {
    key: 'bold',
    name: 'Bold & After Dark',
    description: 'Deep backgrounds and high-energy accents.',
    themes: ['midnight-sangeet', 'neon-nights', 'cinema-reel'],
  },
  {
    key: 'destination',
    name: 'Destination & Retro',
    description: 'Travel stamps, sunsets, and postcard nostalgia.',
    themes: ['coastal-voyage', 'vintage-postcard', 'retro-sunset'],
  },
];

// Build the ordered group list, folding any ungrouped theme keys into an "More
// styles" bucket so nothing silently disappears when new themes are added.
export function getGroupedThemes() {
  const grouped = new Set();
  const groups = THEME_GROUPS.map((group) => {
    const themes = group.themes.map((key) => WEBSITE_THEMES[key]).filter(Boolean);
    themes.forEach((theme) => grouped.add(theme.key));
    return { ...group, themeList: themes };
  }).filter((group) => group.themeList.length > 0);

  const leftovers = Object.values(WEBSITE_THEMES).filter((theme) => !grouped.has(theme.key));
  if (leftovers.length > 0) {
    groups.push({ key: 'more', name: 'More Styles', description: 'Fresh looks to explore.', themeList: leftovers });
  }
  return groups;
}

// Open-license photography (Pixabay, free for commercial use, no attribution)
// used only inside the ready-made examples so a couple can preview a fully
// dressed site and import it in one click. URLs are hotlinked at full size.
const pixabay = (url) => url;

// Curated image sets. Every hero is ONE identifiable couple; the rest of each
// gallery is faceless detail work (henna, bangles, rings, jasmine, garlands) so
// a single example never mixes two different couples. Variety comes across
// examples, not inside one.
const COUPLE = {
  blushGold: 'https://cdn.pixabay.com/photo/2023/12/11/10/11/couple-8443236_1280.jpg',
  goldenSaree: 'https://cdn.pixabay.com/photo/2021/08/03/21/16/bride-6520538_1280.jpg',
  marigoldPair: 'https://cdn.pixabay.com/photo/2021/12/23/04/34/bride-6888615_1280.jpg',
  marigoldBride: 'https://cdn.pixabay.com/photo/2021/12/23/04/34/bride-6888614_1280.jpg',
  mustardField: 'https://cdn.pixabay.com/photo/2021/10/05/11/28/couple-6682448_1280.jpg',
  seaside: 'https://cdn.pixabay.com/photo/2024/09/26/04/47/pre-wedding-9074893_1280.jpg',
  forest: 'https://cdn.pixabay.com/photo/2022/01/30/05/50/couple-6979881_1280.jpg',
  garden: 'https://cdn.pixabay.com/photo/2018/09/11/16/13/indian-wedding-3669913_1280.jpg',
  temple: 'https://cdn.pixabay.com/photo/2021/09/03/06/10/wedding-6595090_1280.jpg',
  courtyard: 'https://cdn.pixabay.com/photo/2021/04/05/19/55/wedding-6154519_1280.jpg',
  veil: 'https://cdn.pixabay.com/photo/2021/08/28/08/49/couple-6580418_1280.jpg',
  sindoor: 'https://cdn.pixabay.com/photo/2019/11/25/15/34/indian-4652313_1280.jpg',
  embrace: 'https://cdn.pixabay.com/photo/2018/11/29/19/38/couple-3846355_1280.jpg',
  meadow: 'https://cdn.pixabay.com/photo/2022/02/24/09/24/pre-wedding-photoshoot-7032116_1280.jpg',
  studio: 'https://cdn.pixabay.com/photo/2022/01/19/14/44/couple-6950039_1280.jpg',
  classicShot: 'https://cdn.pixabay.com/photo/2016/06/05/16/14/wedding-couple-1437654_1280.jpg',
  redLehenga: 'https://cdn.pixabay.com/photo/2021/08/03/07/30/bride-6518725_1280.jpg',
  mandapDay: 'https://cdn.pixabay.com/photo/2023/08/26/06/05/wedding-8214210_1280.jpg',
  aisle: 'https://cdn.pixabay.com/photo/2023/06/20/04/42/wedding-8076019_1280.jpg',
  modernPair: 'https://cdn.pixabay.com/photo/2025/02/12/09/18/couple-9400897_1280.jpg',
  portrait: 'https://cdn.pixabay.com/photo/2020/05/14/17/48/bride-5170729_1280.jpg',
  cityLights: 'https://cdn.pixabay.com/photo/2024/01/27/09/37/couple-8535582_1280.jpg',
  ceremony: 'https://cdn.pixabay.com/photo/2022/01/21/12/38/wedding-6954716_1280.jpg',
  florals: 'https://cdn.pixabay.com/photo/2021/05/30/07/29/wedding-6295093_1280.jpg',
  baraat: 'https://cdn.pixabay.com/photo/2020/04/07/17/16/indian-wedding-5014197_1280.jpg',
  sunsetPair: 'https://cdn.pixabay.com/photo/2024/07/13/08/30/couple-8891707_1280.jpg',
  regalPair: 'https://cdn.pixabay.com/photo/2024/08/21/10/13/indian-8985675_1280.jpg',
  vows: 'https://cdn.pixabay.com/photo/2020/07/24/14/26/wedding-5434151_1280.jpg',
};
const DETAIL = {
  jasmine: 'https://cdn.pixabay.com/photo/2021/08/24/11/32/couple-6570391_1280.jpg',
  mehndiRings: 'https://cdn.pixabay.com/photo/2021/08/24/11/33/mehndi-6570407_1280.jpg',
  bangles: 'https://cdn.pixabay.com/photo/2020/01/07/04/37/bangles-4746766_1280.jpg',
  rings: 'https://cdn.pixabay.com/photo/2018/05/31/07/57/ring-3443341_1280.jpg',
  palm: 'https://cdn.pixabay.com/photo/2019/08/06/12/01/indian-4388166_1280.jpg',
  garland: 'https://cdn.pixabay.com/photo/2019/09/13/08/44/wedding-4473452_1280.jpg',
};

// Fully embedded example sites. Each one pairs a template with sample photos and
// copy so the picker shows the real potential of a theme. Importing an example
// drops this content into the couple's own config, which they can then edit. The
// couple's real names and event schedule always come from their wedding data, so
// only the styling, story, photos, hotels, and registry are seeded here.
// Reusable hotel and registry blocks so every imported example lands as a full,
// editable site. Couples swap these for their own details in one click.
const HOTEL_SETS = [
  [
    { name: 'The Grand Ballroom Hotel', address: 'Downtown, next to the reception', link: 'https://example.com/stay', groupRateCode: 'WEDDING' },
    { name: 'Riverside Inn', address: 'By the river, free shuttle to every event', link: 'https://example.com/riverside', groupRateCode: '' },
  ],
  [
    { name: 'Heritage Palace Hotel', address: 'Old City, a short walk to the mandap', link: 'https://example.com/heritage', groupRateCode: 'SHAADI' },
  ],
  [
    { name: 'Garden Suites', address: 'Ten minutes from the ceremony, group block available', link: 'https://example.com/garden', groupRateCode: 'BLOCK' },
  ],
];
const REGISTRY_SETS = [
  [
    { name: 'Honeymoon Fund', url: 'https://example.com/honeymoon' },
    { name: 'Home Registry', url: 'https://example.com/registry' },
  ],
  [{ name: 'Blessings and Gifts', url: 'https://example.com/blessings' }],
  [{ name: 'Our First Home', url: 'https://example.com/firsthome' }],
];

// One flagship example per template (a few have two), so clicking any template
// shows a fully dressed site to preview and import. Each example is ONE couple;
// variety comes across templates, never inside a single site. The generator
// below turns these compact specs into full example objects.
const EXAMPLE_SPECS = [
  // Ceremonial & Indian
  { key: 'marigold-mandap', name: 'Marigold Mandap', couple: 'marigoldPair', tagline: 'Marigolds, dhol, and three days of joy.', gallery: ['garland', 'jasmine', 'bangles'], story: 'Two families, one big celebration. We are keeping the rituals our grandparents held dear and adding the music our cousins cannot sit still for. Come hungry, come ready to dance.' },
  { key: 'marigold-mandap', name: 'Haldi Morning', couple: 'marigoldBride', tagline: 'A bright haldi and an even brighter forever.', gallery: ['jasmine', 'bangles', 'palm'], story: 'It starts with turmeric, laughter, and a courtyard full of yellow. Join us for the haldi and stay for every song after.' },
  { key: 'sindoor-silk', name: 'Sindoor and Silk', couple: 'sindoor', tagline: 'Red silk, sacred vows, and a full heart.', gallery: ['garland', 'rings', 'bangles'], story: 'We are marking this day the way our families always have, with red silk, quiet vows, and a feast that runs late into the night.' },
  { key: 'kumkum-poster', name: 'Kumkum', couple: 'regalPair', tagline: 'Bold color and a big, warm welcome.', gallery: ['garland', 'jasmine', 'palm'], story: 'Loud, bright, and full of family. That is how we love, and that is how we are getting married. We saved you a seat.' },
  { key: 'mehndi-henna', name: 'Mehndi Night', couple: 'mustardField', tagline: 'Henna, music, and hands full of stories.', gallery: ['mehndiRings', 'bangles', 'jasmine'], story: 'The night before it all begins, we gather for henna and dancing. Bring your appetite and your best dhol moves.' },
  { key: 'peacock-royal', name: 'Peacock', couple: 'baraat', tagline: 'Jewel tones and a royal procession.', gallery: ['garland', 'bangles', 'rings'], story: 'Blues, greens, and gold, and a baraat you will hear before you see. We cannot wait to celebrate with the people we love.' },
  { key: 'lotus-blush', name: 'Lotus', couple: 'portrait', tagline: 'Soft petals and a gentle start.', gallery: ['jasmine', 'rings', 'garland'], story: 'A calm morning, close family, and vows we have been writing in our heads for years. Thank you for being part of it.' },
  // Romantic & Soft
  { key: 'classic-rose', name: 'Blush Rose', couple: 'blushGold', tagline: 'Soft light, warm hearts, and the start of forever.', gallery: ['rings', 'bangles', 'jasmine'], story: 'We met at a friend\'s Diwali party and have laughed our way through the years since. Now we are ready to celebrate with everyone who means the most to us.' },
  { key: 'classic-rose', name: 'Garden Vows', couple: 'garden', tagline: 'A garden gathering of two families becoming one.', gallery: ['jasmine', 'mehndiRings', 'rings'], story: 'We love slow mornings, good chai, and being outdoors, so a garden felt right for the day we say our vows. Stay for the evening under the string lights.' },
  { key: 'watercolor-wash', name: 'Watercolor', couple: 'florals', tagline: 'Painterly washes and pretty little details.', gallery: ['jasmine', 'rings', 'bangles'], story: 'Soft colors, softer light, and a day built around the people we love. Here is everything you need to know.' },
  { key: 'garden-green', name: 'Garden Party', couple: 'meadow', tagline: 'Green leaves, string lights, and slow evenings.', gallery: ['jasmine', 'palm', 'rings'], story: 'We are saying our vows outdoors, under the trees, with our favorite people close by. Bring comfortable shoes and stay a while.' },
  { key: 'confetti-pop', name: 'Confetti', couple: 'studio', tagline: 'Color, confetti, and a whole lot of fun.', gallery: ['bangles', 'jasmine', 'garland'], story: 'This one is a party first and a ceremony second. Expect color everywhere and a dance floor that never really empties.' },
  { key: 'aurora-dream', name: 'Aurora', couple: 'sunsetPair', tagline: 'Dreamy gradients and golden light.', gallery: ['rings', 'jasmine'], story: 'Golden hour is our favorite time of day, so we are getting married in it. Join us for a warm, glowing evening.' },
  // Traditional & Regal
  { key: 'royal-gold', name: 'Palace Gold', couple: 'goldenSaree', tagline: 'A gold and garland celebration, three days in the making.', gallery: ['garland', 'palm', 'bangles'], story: 'We fell for each other over long dinners and longer conversations. Now we are gathering everyone we love for haldi, mehndi, and the pheras.' },
  { key: 'royal-gold', name: 'Zari Nights', couple: 'redLehenga', tagline: 'Gold zari and a dark, glowing hero.', gallery: ['bangles', 'rings', 'garland'], story: 'Deep reds, warm gold, and a room lit like a jewel box. Come celebrate a night we have been dreaming about.' },
  { key: 'heritage-crest', name: 'Heritage', couple: 'mandapDay', tagline: 'A family crest and old-world warmth.', gallery: ['garland', 'rings', 'palm'], story: 'Two family histories, one new beginning. We are honoring where we come from and where we are headed together.' },
  { key: 'deco-gold', name: 'Deco Gold', couple: 'cityLights', tagline: 'Deco lines and champagne gold.', gallery: ['rings', 'bangles'], story: 'Think black tie, gold accents, and a little old-Hollywood glamour. We would be honored to have you there.' },
  { key: 'terracotta-mosaic', name: 'Terracotta', couple: 'courtyard', tagline: 'Warm clay tones and hand-set mosaic tile.', gallery: ['palm', 'jasmine', 'garland'], story: 'A sun-warmed courtyard, tiled floors, and family everywhere you look. That is the day we are inviting you into.' },
  // Modern & Minimal
  { key: 'modern-minimal', name: 'Quiet Modern', couple: 'forest', tagline: 'Simple, clean, and all about the two of you.', gallery: ['rings', 'bangles'], story: 'We kept the guest list small and the details intentional. Everything you need is right here, and nothing you do not.' },
  { key: 'blanc-minimal', name: 'Blanc', couple: 'modernPair', tagline: 'White space and one perfect photo.', gallery: ['rings'], story: 'One photo, a few words, and the date that changed everything. We are keeping it simple and we cannot wait.' },
  { key: 'brutalist-noir', name: 'Noir', couple: 'embrace', tagline: 'Black, white, and bold type.', gallery: ['rings', 'bangles'], story: 'High contrast, big letters, zero fuss. Here is where to be and when. See you on the dance floor.' },
  { key: 'iridescent-mesh', name: 'Iridescent', couple: 'veil', tagline: 'Soft mesh gradients and a modern glow.', gallery: ['jasmine', 'rings'], story: 'A modern look for a timeless promise. Scroll down for the schedule, the stay, and everything in between.' },
  // Bold & After Dark
  { key: 'midnight-sangeet', name: 'Midnight Sangeet', couple: 'ceremony', tagline: 'Dark skies, bright lights, all night long.', gallery: ['garland', 'bangles'], story: 'The sangeet is the heart of it for us, so we are leaning all the way in. Rehearse your dance, we are keeping score.' },
  { key: 'neon-nights', name: 'Neon Nights', couple: 'vows', tagline: 'Neon glow and an after-party feel.', gallery: ['bangles', 'rings'], story: 'Late nights, loud music, and the people we love in one room. This is going to be a good one.' },
  { key: 'cinema-reel', name: 'Cinema', couple: 'aisle', tagline: 'A film-strip love story.', gallery: ['rings', 'jasmine'], story: 'Our story has had a few plot twists and a very happy ending. Come watch the final scene with us.' },
  // Destination & Retro
  { key: 'coastal-voyage', name: 'By the Sea', couple: 'seaside', tagline: 'Salt air, sunset vows, and a weekend by the water.', gallery: ['rings', 'jasmine'], story: 'We always come back to the coast, so this is where we want to say our vows. Pack light and bring your dancing shoes.' },
  { key: 'vintage-postcard', name: 'Postcard', couple: 'temple', tagline: 'Travel stamps and old-postcard charm.', gallery: ['palm', 'garland'], story: 'We have collected stamps and stories across a lot of miles. Now we are adding the best one yet, with you there.' },
  { key: 'retro-sunset', name: 'Retro Sunset', couple: 'classicShot', tagline: 'Warm seventies color and a sun-faded glow.', gallery: ['rings', 'bangles'], story: 'Think warm tones, big sun, and a laid-back party. Come as you are and stay till the last song.' },
];

// Expand each compact spec into a full example object with a hero photo, a
// faceless detail gallery, and ready-to-edit hotels and registry.
export const WEBSITE_EXAMPLES = EXAMPLE_SPECS.map((spec, index) => ({
  key: `${spec.key}-${(spec.name || 'example').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  name: spec.name,
  themeKey: spec.key,
  tagline: spec.tagline,
  hero: pixabay(COUPLE[spec.couple]),
  story: spec.story,
  gallery: (spec.gallery || []).map((detailKey) => DETAIL[detailKey]).filter(Boolean),
  hotels: spec.hotels || HOTEL_SETS[index % HOTEL_SETS.length],
  registry: spec.registry || REGISTRY_SETS[index % REGISTRY_SETS.length],
}));

// Return the ready-made examples that belong to a given template key, so the
// picker can offer a couple "start from scratch" or a filled-in variation.
export function getExamplesForTheme(themeKey) {
  return WEBSITE_EXAMPLES.filter((example) => example.themeKey === themeKey);
}

// The hero photo used to preview a template in the picker grid. Prefer the
// template's first example so every card shows a real, dressed first page
// instead of an empty colored header.
export function getPreviewConfigForTheme(themeKey, baseConfig = {}) {
  const [firstExample] = getExamplesForTheme(themeKey);
  if (firstExample) return buildConfigFromExample(firstExample, baseConfig);
  return {
    websiteTheme: themeKey,
    websitePublished: true,
    websiteHero: { tagline: '' },
    websiteGallery: { enabled: false, images: [] },
  };
}

// Merge an example into a couple's existing config. Their names, date, event
// selection, RSVP, and publish state are preserved; the example seeds styling,
// story, photos, hotels, and registry that they can edit afterward.
export function buildConfigFromExample(example, baseConfig = {}) {
  const base = normalizeWebsiteConfig(baseConfig);
  return {
    ...base,
    websiteTheme: example.themeKey,
    websiteCustomColors: { primary: '', accent: '', background: '' },
    websiteHero: {
      ...base.websiteHero,
      tagline: example.tagline || base.websiteHero.tagline,
      backgroundImage: example.hero || base.websiteHero.backgroundImage,
    },
    websiteStory: { enabled: true, text: example.story || '' },
    websiteGallery: {
      enabled: true,
      images: (example.gallery || []).slice(0, 12),
    },
    websiteHotels: { enabled: true, items: example.hotels || [] },
    websiteRegistry: { enabled: true, items: example.registry || [] },
  };
}

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
