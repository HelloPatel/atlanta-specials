import { useEffect, useMemo } from 'react';
import { resolveWebsiteTheme, normalizeWebsiteConfig, hexToRgba } from './websiteThemes';

// Guest-facing pages (RSVP, photo queue, bets) are built with hardcoded `wine`
// Tailwind utilities. Rather than rewrite every color site, we re-point those
// compiled utilities at CSS variables derived from the couple's chosen website
// theme, but ONLY for elements inside a `.website-theme` root. This themes the
// whole page at once, is fully reversible, and leaves loading/error screens on
// the default palette (they render before the theme resolves).
//
// `!important` + the `.website-theme` prefix is required to beat Tailwind's
// compiled literal-hex utilities. Pseudo-class escapes (`\:`) are double-escaped
// here so the emitted CSS contains a single backslash.
export const WEBSITE_THEME_CSS = `
.website-theme h1 { font-family: var(--wt-display-font); }

/* Solid backgrounds */
.website-theme .bg-wine-800,
.website-theme .bg-wine-700,
.website-theme .bg-wine-600 { background-color: var(--wt-primary) !important; }
.website-theme .hover\\:bg-wine-800:hover,
.website-theme .hover\\:bg-wine-700:hover { background-color: var(--wt-primary) !important; filter: brightness(0.92); }
.website-theme .bg-wine-400,
.website-theme .bg-wine-300 { background-color: var(--wt-accent) !important; }
.website-theme .bg-wine-100 { background-color: var(--wt-primary-tint) !important; }
.website-theme .bg-wine-50,
.website-theme .bg-wine-50\\/70 { background-color: var(--wt-primary-soft) !important; }
.website-theme .hover\\:bg-wine-50:hover { background-color: var(--wt-primary-soft) !important; }
.website-theme .bg-wine-600\\/10,
.website-theme .bg-wine-600\\/20,
.website-theme .bg-wine-400\\/10 { background-color: var(--wt-primary-tint) !important; }
.website-theme .bg-amber-50 { background-color: var(--wt-accent-soft) !important; }

/* Text */
.website-theme .text-wine-800,
.website-theme .text-wine-700,
.website-theme .text-wine-600 { color: var(--wt-primary) !important; }
.website-theme .text-wine-400,
.website-theme .text-wine-300 { color: var(--wt-accent) !important; }
.website-theme .hover\\:text-wine-800:hover,
.website-theme .hover\\:text-wine-700:hover { color: var(--wt-primary) !important; }
.website-theme .text-amber-800,
.website-theme .text-amber-700 { color: var(--wt-primary) !important; }

/* Borders */
.website-theme .border-wine-600 { border-color: var(--wt-primary) !important; }
.website-theme .border-wine-400,
.website-theme .border-wine-300,
.website-theme .border-wine-200,
.website-theme .border-wine-100,
.website-theme .border-wine-400\\/40,
.website-theme .border-wine-300\\/40,
.website-theme .border-amber-200 { border-color: var(--wt-border-soft) !important; }
.website-theme .hover\\:border-wine-400:hover,
.website-theme .hover\\:border-wine-300:hover { border-color: var(--wt-border-soft) !important; }

/* Rings + focus */
.website-theme .ring-wine-600,
.website-theme .focus\\:ring-wine-600:focus { --tw-ring-color: var(--wt-primary) !important; }
.website-theme .ring-wine-100,
.website-theme .focus\\:ring-wine-100:focus { --tw-ring-color: var(--wt-ring) !important; }
.website-theme .focus\\:border-wine-600:focus { border-color: var(--wt-primary) !important; }

/* Gradient stops (keep Tailwind position vars intact) */
.website-theme .from-wine-700 { --tw-gradient-from: var(--wt-primary) var(--tw-gradient-from-position) !important; }
.website-theme .to-wine-600 { --tw-gradient-to: var(--wt-primary) var(--tw-gradient-to-position) !important; }
.website-theme .from-wine-400 { --tw-gradient-from: var(--wt-accent) var(--tw-gradient-from-position) !important; }
.website-theme .from-wine-50 { --tw-gradient-from: var(--wt-primary-soft) var(--tw-gradient-from-position) !important; }
.website-theme .to-amber-300,
.website-theme .to-amber-50 { --tw-gradient-to: var(--wt-accent-soft) var(--tw-gradient-to-position) !important; }
`;

export function buildWebsiteThemeVars(theme) {
  return {
    '--wt-primary': theme.primary,
    '--wt-accent': theme.accent,
    '--wt-primary-tint': hexToRgba(theme.primary, 0.12),
    '--wt-primary-soft': hexToRgba(theme.primary, 0.06),
    '--wt-accent-tint': hexToRgba(theme.accent, 0.12),
    '--wt-accent-soft': hexToRgba(theme.accent, 0.06),
    '--wt-ring': hexToRgba(theme.primary, 0.18),
    '--wt-border-soft': hexToRgba(theme.primary, 0.3),
    '--wt-display-font': theme.fontFamily,
    '--wt-bg': theme.background,
  };
}

// Resolve the couple's website theme from a public wedding doc (may be null
// while loading). Safe to call with undefined/null — falls back to defaults.
export function useResolvedWebsiteTheme(wedding) {
  return useMemo(
    () => resolveWebsiteTheme(normalizeWebsiteConfig(wedding || {})),
    [wedding],
  );
}

/**
 * Wraps guest-facing content in a themed scope. Renders a `display: contents`
 * element so it adds no layout box — it only supplies the `.website-theme`
 * class, the theme CSS variables, and the scoped override stylesheet to its
 * descendants. Also injects the theme's display font once.
 */
export default function WebsiteThemeScope({ wedding, style, children }) {
  const theme = useResolvedWebsiteTheme(wedding);
  const vars = useMemo(() => buildWebsiteThemeVars(theme), [theme]);

  useEffect(() => {
    if (!theme.fontUrl) return undefined;
    const existing = document.querySelector(`link[data-wt-font="${theme.fontUrl}"]`);
    if (existing) return undefined;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme.fontUrl;
    link.setAttribute('data-wt-font', theme.fontUrl);
    document.head.appendChild(link);
    return undefined;
  }, [theme.fontUrl]);

  return (
    <div className="website-theme" style={{ display: 'contents', ...vars, ...style }}>
      <style>{WEBSITE_THEME_CSS}</style>
      {children}
    </div>
  );
}
