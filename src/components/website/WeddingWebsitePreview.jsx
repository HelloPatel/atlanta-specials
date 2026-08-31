import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, Clock3, ExternalLink, Gift, Heart, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getCoupleDisplayName,
  getCoupleInitials,
  getCoupleNames,
  getThemeConfig,
  resolveWebsiteTheme,
  normalizeWebsiteConfig,
} from './websiteThemes';

function formatDisplayDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventDate(event) {
  if (!event?.date) return 'Date to come';

  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) {
    return [event.date, event.startTime && `at ${event.startTime}`].filter(Boolean).join(' ');
  }

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  if (!event.startTime && !event.endTime) return dateLabel;
  const timeLabel = [event.startTime, event.endTime].filter(Boolean).join(' - ');
  return `${dateLabel} • ${timeLabel}`;
}

function getMapsLink(event) {
  const locationText = [event?.venue, event?.address].filter(Boolean).join(', ');
  return locationText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}` : '';
}

function escapeIcs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function toIcsStamp(dateValue, timeValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  if (timeValue && /^\d{1,2}:\d{2}/.test(timeValue)) {
    const [hh, mm] = timeValue.split(':');
    date.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

// Build a downloadable .ics so guests can add any event to their calendar.
function buildIcsHref(event, coupleName) {
  const start = toIcsStamp(event?.date, event?.startTime);
  if (!start) return '';
  const end = toIcsStamp(event?.date, event?.endTime) || start;
  const location = [event?.venue, event?.address].filter(Boolean).join(', ');
  const summary = [event?.name, coupleName].filter(Boolean).join(' — ');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Phera//Wedding Website//EN',
    'BEGIN:VEVENT',
    `UID:${(event?.id || Math.random().toString(36).slice(2))}@phera`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(summary)}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    event?.description ? `DESCRIPTION:${escapeIcs(event.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}

function hexToRgba(hex, alpha) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return `rgba(255, 255, 255, ${alpha})`;
  const normalized = hex.slice(1);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function useThemeFont(theme) {
  useEffect(() => {
    if (!theme?.fontUrl) return undefined;

    const linkId = `website-theme-font-${theme.key}`;
    if (document.getElementById(linkId)) return undefined;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = theme.fontUrl;
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [theme]);
}

function Divider({ theme, className = '' }) {
  const layout = theme.layout || 'botanical';
  if (layout === 'editorial') {
    return (
      <div className={`mx-auto mt-5 h-px w-16 ${className}`} style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
    );
  }
  if (layout === 'luxe') {
    return (
      <div className={`mx-auto mt-5 flex items-center justify-center gap-2 ${className}`}>
        <span className="h-px w-10" style={{ backgroundColor: hexToRgba(theme.accent, 0.6) }} />
        <span className="text-lg leading-none" style={{ color: theme.accent }}>&#10022;</span>
        <span className="h-px w-10" style={{ backgroundColor: hexToRgba(theme.accent, 0.6) }} />
      </div>
    );
  }
  if (layout === 'arch') {
    return (
      <div className={`mx-auto mt-5 flex items-center justify-center gap-2 ${className}`}>
        <span className="h-px w-12" style={{ backgroundColor: hexToRgba(theme.accent, 0.55) }} />
        <span className="text-sm leading-none" style={{ color: theme.accent }}>&#9671;</span>
        <span className="h-px w-12" style={{ backgroundColor: hexToRgba(theme.accent, 0.55) }} />
      </div>
    );
  }
  if (layout === 'poster') {
    return (
      <div className={`mx-auto mt-5 h-1 w-14 rounded-full ${className}`} style={{ backgroundColor: theme.accent }} />
    );
  }
  if (layout === 'split') {
    return (
      <div className={`mx-auto mt-5 h-px w-20 ${className}`} style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
    );
  }
  // botanical — small leafy sprig
  return (
    <div className={`mx-auto mt-5 flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.5) }} />
      <span className="text-base leading-none" style={{ color: theme.accent }}>&#10047;</span>
      <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.5) }} />
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, theme }) {
  const layout = theme.layout || 'botanical';
  const eyebrowClass =
    layout === 'editorial'
      ? 'mb-4 text-[11px] font-semibold uppercase tracking-[0.5em]'
      : 'mb-4 text-[11px] font-semibold uppercase tracking-[0.42em]';
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {layout === 'editorial' && eyebrow && (
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.6) }} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.accent }}>{eyebrow}</p>
          <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.6) }} />
        </div>
      )}
      {layout !== 'editorial' && eyebrow && (
        <p className={eyebrowClass} style={{ color: theme.accent }}>
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-semibold @lg:text-4xl" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
        {title}
      </h2>
      <Divider theme={theme} />
      {description && (
        <p className="mt-5 text-sm leading-7 @lg:text-base" style={{ color: theme.muted }}>
          {description}
        </p>
      )}
    </div>
  );
}

function CountdownTimer({ targetDate, theme, variant = 'inline', tone = 'light', align = 'start' }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!timeLeft) return null;

  const feature = variant === 'feature';
  const onLight = tone === 'onLight';
  const cellStyle = onLight
    ? { borderColor: hexToRgba(theme.primary, 0.18), backgroundColor: hexToRgba(theme.primary, 0.06) }
    : undefined;
  return (
    <div className={`flex gap-3 ${feature ? 'mt-8 justify-center gap-3 @sm:gap-4' : 'mt-6'} ${!feature && align === 'center' ? 'justify-center' : ''}`}>
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map(({ value, label }) => (
        <div
          key={label}
          className={`text-center rounded-xl border backdrop-blur ${onLight ? '' : 'border-white/20 bg-white/10'} ${feature ? 'px-4 py-3 min-w-[64px] @sm:min-w-[76px]' : 'px-3 py-2 min-w-[52px]'}`}
          style={cellStyle}
        >
          <p className={`font-bold ${onLight ? '' : 'text-white'} ${feature ? 'text-3xl @sm:text-4xl' : 'text-xl'}`} style={onLight ? { color: theme.text } : undefined}>{value}</p>
          <p className={`text-[10px] uppercase tracking-wider ${onLight ? '' : 'text-white/70'}`} style={onLight ? { color: theme.muted } : undefined}>{label}</p>
        </div>
      ))}
    </div>
  );
}

// ---- Hero layouts -----------------------------------------------------------
// Each layout renders a structurally distinct hero from the same data.

function HeroActions({ theme, config, wedding, publicEvents, tone = 'light' }) {
  const rsvpOnLight = tone === 'onLight';
  return (
    <div className="mt-10 flex flex-col gap-3 @sm:flex-row @sm:flex-wrap @sm:gap-4">
      {config.websiteRsvp?.enabled && (
        <Link
          to={`/rsvp/${wedding?.id}`}
          className="inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5 @sm:w-auto"
          style={
            rsvpOnLight
              ? { backgroundColor: theme.primary, color: '#ffffff' }
              : { backgroundColor: theme.surface, color: theme.primary }
          }
        >
          {config.websiteRsvp.buttonText}
        </Link>
      )}
      {publicEvents.length > 0 && (
        <a
          href="#events"
          className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition @sm:w-auto ${
            rsvpOnLight ? '' : 'border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20'
          }`}
          style={rsvpOnLight ? { border: `1px solid ${hexToRgba(theme.primary, 0.4)}`, color: theme.primary } : undefined}
        >
          View Events
        </a>
      )}
    </div>
  );
}

function HeroEditorial({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const hashtag = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="editorial"
      className="relative isolate overflow-hidden px-6 py-10 @md:px-10 @2xl:px-16"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* top nav bar */}
      <div className="mx-auto flex max-w-6xl items-center justify-between border-b pb-5 text-xs font-semibold uppercase tracking-[0.32em]"
        style={{ borderColor: hexToRgba(theme.text, 0.15), color: theme.muted }}>
        <span>{heroDate || 'Date to come'}</span>
        <span className="hidden @sm:inline">{location}</span>
      </div>

      <div className="mx-auto max-w-5xl py-14 text-center @lg:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.55em]" style={{ color: theme.accent }}>
          We&apos;re getting married
        </p>
        <div className="mt-8 flex flex-col items-center">
          <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.02em] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>
            {names.first}
          </h1>
          {names.second && (
            <>
              <span className="my-2 text-4xl @sm:text-5xl" style={{ fontFamily: theme.fontFamily, color: theme.accent }}>&amp;</span>
              <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.02em] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>
                {names.second}
              </h1>
            </>
          )}
        </div>
        {hashtag && (
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.3em]" style={{ color: theme.muted }}>{hashtag}</p>
        )}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border px-6 py-3 text-sm"
            style={{ borderColor: hexToRgba(theme.text, 0.15), color: theme.muted }}>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.primary }} />{heroDate || 'Date coming soon'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.primary }} />{location}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

function HeroBotanical({ theme, config, wedding, coupleName, initials, heroDate, location, publicEvents }) {
  const hasPhoto = Boolean(config.websiteHero?.backgroundImage);
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="botanical"
      className="relative isolate overflow-hidden px-6 py-14 @md:px-10 @lg:py-20 @2xl:px-16"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-semibold"
          style={{ borderColor: theme.accent, color: theme.primary, fontFamily: theme.fontFamily }}>
          {initials}
        </div>
        <Divider theme={theme} className="!mt-6" />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.42em]" style={{ color: theme.accent }}>
          Together with their families
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight @sm:text-5xl @xl:text-6xl" style={{ fontFamily: theme.fontFamily }}>
          {coupleName}
        </h1>
        {config.websiteHero?.tagline && (
          <p className="mt-6 max-w-xl text-base leading-8" style={{ color: theme.muted }}>{config.websiteHero.tagline}</p>
        )}

        {hasPhoto && (
          <div className="mt-10 w-full overflow-hidden rounded-[2rem] border p-2" style={{ borderColor: hexToRgba(theme.accent, 0.4), backgroundColor: theme.surface }}>
            <div
              className="aspect-[16/9] w-full rounded-[1.5rem] bg-cover bg-center"
              style={{ backgroundImage: `url(${config.websiteHero.backgroundImage})` }}
            />
          </div>
        )}

        <div className="mt-10 grid w-full gap-4 @sm:grid-cols-2">
          <div className="rounded-2xl border p-5 text-left" style={{ borderColor: hexToRgba(theme.accent, 0.35), backgroundColor: theme.surface }}>
            <CalendarDays size={18} className="mb-2" style={{ color: theme.primary }} />
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: theme.muted }}>When</p>
            <p className="mt-1 text-base font-medium" style={{ color: theme.text }}>{heroDate || 'Date coming soon'}</p>
          </div>
          <div className="rounded-2xl border p-5 text-left" style={{ borderColor: hexToRgba(theme.accent, 0.35), backgroundColor: theme.surface }}>
            <MapPin size={18} className="mb-2" style={{ color: theme.primary }} />
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: theme.muted }}>Where</p>
            <p className="mt-1 text-base font-medium" style={{ color: theme.text }}>{location}</p>
          </div>
        </div>

        <div className="flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

function HeroLuxe({ theme, config, wedding, names, coupleName, heroDate, location, publicEvents }) {
  const scriptFamily = theme.scriptFontFamily;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="luxe"
      className="relative isolate flex min-h-[560px] items-center overflow-hidden px-6 py-16 text-white @md:px-10 @2xl:min-h-[640px] @2xl:px-16"
      style={{
        backgroundColor: theme.primary,
        backgroundImage: config.websiteHero?.backgroundImage
          ? `${theme.heroOverlay}, url(${config.websiteHero.backgroundImage})`
          : theme.heroBackground,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">
          <span className="h-px w-8 bg-white/40" />
          The wedding of
          <span className="h-px w-8 bg-white/40" />
        </div>
        {scriptFamily ? (
          <h1 className="mt-6 leading-none text-white" style={{ fontFamily: scriptFamily, fontSize: 'clamp(3.5rem, 12vw, 7rem)' }}>
            {names.second ? (
              <>
                {names.first} <span style={{ color: theme.accent }}>&amp;</span> {names.second}
              </>
            ) : coupleName}
          </h1>
        ) : (
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>
            {coupleName}
          </h1>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/85">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} />{heroDate || 'Date coming soon'}</span>
          <span className="hidden h-4 w-px bg-white/30 @sm:inline-block" />
          <span className="inline-flex items-center gap-2"><MapPin size={15} />{location}</span>
        </div>
        <CountdownTimer targetDate={config.websiteHero?.date || wedding?.weddingDate} theme={theme} variant="feature" />
        {config.websiteHero?.tagline && (
          <p className="mt-8 max-w-xl text-base leading-8 text-white/80">{config.websiteHero.tagline}</p>
        )}
        <div className="flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
        </div>
      </div>
    </section>
  );
}

// Reusable anchor-link menu ("button menu") used by nav-driven layouts. Links
// only render for sections the couple has actually enabled.
function HeroNav({ theme, config, wedding, publicEvents, monogram, tone = 'onLight' }) {
  const onDark = tone === 'dark';
  const linkColor = onDark ? 'rgba(255,255,255,0.82)' : theme.muted;
  const links = [
    config.websiteStory?.enabled && config.websiteStory?.text && { href: '#story', label: 'Our Story' },
    publicEvents.length > 0 && { href: '#events', label: 'Events' },
    config.websiteRegistry?.enabled && config.websiteRegistry.items.length > 0 && { href: '#registry', label: 'Registry' },
  ].filter(Boolean);
  return (
    <div
      className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b pb-5"
      style={{ borderColor: onDark ? 'rgba(255,255,255,0.18)' : hexToRgba(theme.text, 0.14) }}
    >
      <span
        className="text-lg font-semibold tracking-[0.14em]"
        style={{ fontFamily: theme.fontFamily, color: onDark ? '#ffffff' : theme.primary }}
      >
        {monogram}
      </span>
      <nav className="flex items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.28em]">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="hidden transition-opacity hover:opacity-70 @sm:inline" style={{ color: linkColor }}>
            {link.label}
          </a>
        ))}
        {config.websiteRsvp?.enabled && (
          <Link
            to={`/rsvp/${wedding?.id}`}
            className="inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
            style={onDark ? { backgroundColor: '#ffffff', color: theme.primary } : { backgroundColor: theme.primary, color: '#ffffff' }}
          >
            RSVP
          </Link>
        )}
      </nav>
    </div>
  );
}

// classic-rose — a centered invitation with an arched portrait window.
function HeroArch({ theme, config, wedding, coupleName, initials, heroDate, location, publicEvents }) {
  const hasPhoto = Boolean(config.websiteHero?.backgroundImage);
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="arch"
      className="relative isolate overflow-hidden px-6 py-14 @md:px-10 @lg:py-20 @2xl:px-16"
      style={{
        color: theme.text,
        backgroundColor: theme.background,
        backgroundImage: `radial-gradient(circle at 50% 0%, ${hexToRgba(theme.accent, 0.16)}, transparent 60%)`,
      }}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.accent }}>
          Together with their families
        </p>
        <div
          className="relative mt-8 w-64 overflow-hidden border @sm:w-72"
          style={{
            borderColor: hexToRgba(theme.accent, 0.5),
            borderRadius: '9999px 9999px 1.5rem 1.5rem',
            aspectRatio: '3 / 4',
            backgroundColor: theme.surface,
            backgroundImage: hasPhoto
              ? `url(${config.websiteHero.backgroundImage})`
              : `linear-gradient(160deg, ${hexToRgba(theme.accent, 0.22)}, ${hexToRgba(theme.primary, 0.14)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {!hasPhoto && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-semibold" style={{ fontFamily: theme.fontFamily, color: theme.primary }}>{initials}</span>
            </div>
          )}
        </div>
        <h1 className="mt-9 text-4xl font-semibold leading-tight @sm:text-5xl @xl:text-6xl" style={{ fontFamily: theme.fontFamily }}>
          {coupleName}
        </h1>
        <Divider theme={theme} />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm" style={{ color: theme.muted }}>
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.primary }} />{heroDate || 'Date coming soon'}</span>
          <span className="hidden h-4 w-px @sm:inline-block" style={{ backgroundColor: hexToRgba(theme.text, 0.2) }} />
          <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.primary }} />{location}</span>
        </div>
        {config.websiteHero?.tagline && (
          <p className="mt-6 max-w-xl text-base leading-8" style={{ color: theme.muted }}>{config.websiteHero.tagline}</p>
        )}
        <div className="flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

// marigold-mandap — a bold poster with a top menu and giant date numerals.
function HeroPoster({ theme, config, wedding, names, coupleName, initials, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const validDate = dateObj && !Number.isNaN(dateObj.getTime());
  const dd = validDate ? String(dateObj.getDate()).padStart(2, '0') : '00';
  const mm = validDate ? String(dateObj.getMonth() + 1).padStart(2, '0') : '00';
  const yyyy = validDate ? dateObj.getFullYear() : '';
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="poster"
      className="relative isolate overflow-hidden px-6 py-8 @md:px-10 @2xl:px-16"
      style={{
        color: theme.text,
        backgroundColor: theme.background,
        backgroundImage: `radial-gradient(circle at 88% 6%, ${hexToRgba(theme.accent, 0.28)}, transparent 42%)`,
      }}
    >
      <HeroNav theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} monogram={initials} tone="onLight" />
      <div className="mx-auto max-w-6xl py-12 @lg:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.accent }}>The wedding of</p>
        <h1 className="mt-6 text-6xl font-normal leading-[0.9] tracking-[-0.01em] @sm:text-7xl @xl:text-[8rem]" style={{ fontFamily: theme.fontFamily }}>
          {names.first}
          {names.second && (
            <>
              <span className="mx-3" style={{ color: theme.accent }}>&amp;</span>
              {names.second}
            </>
          )}
        </h1>
        <div className="mt-10 flex flex-wrap items-end gap-x-8 gap-y-6">
          <div className="flex items-end gap-3" style={{ color: theme.primary }}>
            <span className="text-6xl font-semibold leading-none @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>{dd}</span>
            <span className="pb-1 text-2xl" style={{ color: theme.accent }}>/</span>
            <span className="text-6xl font-semibold leading-none @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>{mm}</span>
            <span className="pb-1 text-2xl" style={{ color: theme.accent }}>/</span>
            <span className="text-6xl font-semibold leading-none @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>{yyyy}</span>
          </div>
          <div className="flex flex-col gap-1 border-l pl-6 text-sm" style={{ borderColor: hexToRgba(theme.text, 0.2), color: theme.muted }}>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>Where</span>
            <span className="inline-flex items-center gap-2 text-base font-medium" style={{ color: theme.text }}><MapPin size={16} style={{ color: theme.primary }} />{location}</span>
          </div>
        </div>
        {config.websiteHero?.tagline && (
          <p className="mt-8 max-w-xl text-base leading-8" style={{ color: theme.muted }}>{config.websiteHero.tagline}</p>
        )}
        <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
      </div>
    </section>
  );
}

// midnight-sangeet — a dark two-column split with a photo/accent panel.
function HeroSplit({ theme, config, wedding, names, coupleName, initials, heroDate, location, publicEvents }) {
  const scriptFamily = theme.scriptFontFamily;
  const hasPhoto = Boolean(config.websiteHero?.backgroundImage);
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="split"
      className="relative isolate grid overflow-hidden @3xl:grid-cols-2"
    >
      {/* left dark panel */}
      <div
        className="flex flex-col justify-center px-6 py-16 text-white @md:px-10 @2xl:px-14"
        style={{ backgroundColor: theme.primary, backgroundImage: theme.heroBackground, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">
          <span className="h-px w-8 bg-white/40" />The wedding of
        </div>
        {scriptFamily ? (
          <h1 className="mt-6 leading-none text-white" style={{ fontFamily: scriptFamily, fontSize: 'clamp(3rem, 9vw, 5.5rem)' }}>
            {names.second ? (<>{names.first} <span style={{ color: theme.accent }}>&amp;</span> {names.second}</>) : coupleName}
          </h1>
        ) : (
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] @xl:text-6xl" style={{ fontFamily: theme.fontFamily }}>{coupleName}</h1>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} />{heroDate || 'Date coming soon'}</span>
          <span className="hidden h-4 w-px bg-white/30 @sm:inline-block" />
          <span className="inline-flex items-center gap-2"><MapPin size={15} />{location}</span>
        </div>
        <CountdownTimer targetDate={config.websiteHero?.date || wedding?.weddingDate} theme={theme} variant="inline" />
        {config.websiteHero?.tagline && (
          <p className="mt-6 max-w-md text-sm leading-7 text-white/75">{config.websiteHero.tagline}</p>
        )}
        <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
      </div>
      {/* right photo / accent panel */}
      <div
        className="relative min-h-[280px] @3xl:min-h-full"
        style={{
          backgroundColor: theme.surface,
          backgroundImage: hasPhoto
            ? `url(${config.websiteHero.backgroundImage})`
            : `linear-gradient(150deg, ${hexToRgba(theme.accent, 0.35)}, ${hexToRgba(theme.primary, 0.2)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {!hasPhoto && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(theme.accent, 0.25) }} aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: hexToRgba(theme.primary, 0.18) }} aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <span className="absolute inset-0 rounded-full border" style={{ borderColor: hexToRgba(theme.primary, 0.18) }} aria-hidden="true" />
                <span className="absolute inset-4 rounded-full border" style={{ borderColor: hexToRgba(theme.accent, 0.35) }} aria-hidden="true" />
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 text-3xl font-semibold shadow-lg" style={{ borderColor: theme.accent, color: theme.primary, fontFamily: theme.fontFamily, backgroundColor: theme.surface }}>
                  {initials}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: hexToRgba(theme.primary, 0.6) }}>
                <span className="h-px w-6" style={{ backgroundColor: hexToRgba(theme.primary, 0.3) }} />
                Forever
                <span className="h-px w-6" style={{ backgroundColor: hexToRgba(theme.primary, 0.3) }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Injects scoped keyframes for the premium hero layouts. Every animation is
// transform/opacity-only and gated behind prefers-reduced-motion: no-preference
// so reduced-motion visitors see the fully-composed final state with no motion.
function HeroKeyframes() {
  return (
    <style>{`
      .phera-rise{opacity:1}
      .phera-marquee-track{display:inline-flex;white-space:nowrap;will-change:transform}
      @media (prefers-reduced-motion: no-preference){
        .phera-rise{opacity:0;animation:phera-rise .8s cubic-bezier(.22,1,.36,1) forwards}
        @keyframes phera-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        .phera-d1{animation-delay:.08s}.phera-d2{animation-delay:.16s}.phera-d3{animation-delay:.24s}.phera-d4{animation-delay:.34s}.phera-d5{animation-delay:.44s}.phera-d6{animation-delay:.56s}
        .phera-marquee-track{animation:phera-marquee 28s linear infinite}
        @keyframes phera-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .phera-float{animation:phera-float 8s ease-in-out infinite}
        .phera-float-slow{animation:phera-float 13s ease-in-out infinite}
        @keyframes phera-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .phera-spin-slow{animation:phera-spin 46s linear infinite}
        @keyframes phera-spin{to{transform:rotate(360deg)}}
        .phera-aurora{animation:phera-aurora 18s ease-in-out infinite}
        @keyframes phera-aurora{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(6%,-4%) scale(1.12)}66%{transform:translate(-5%,5%) scale(.94)}}
        .phera-shimmer{background-size:200% auto;animation:phera-shimmer 7s linear infinite}
        @keyframes phera-shimmer{to{background-position:200% center}}
      }
    `}</style>
  );
}

// Squared call-to-action pair for the typographic / cinematic heroes where the
// default rounded pills would clash. Same RSVP + View Events behavior.
function SquareActions({ config, wedding, publicEvents, primaryBg, primaryText, outline }) {
  return (
    <div className="mt-8 flex flex-col gap-3 @sm:flex-row @sm:flex-wrap">
      {config.websiteRsvp?.enabled && (
        <Link
          to={`/rsvp/${wedding?.id}`}
          className="inline-flex items-center justify-center px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: primaryBg, color: primaryText }}
        >
          {config.websiteRsvp.buttonText}
        </Link>
      )}
      {publicEvents.length > 0 && (
        <a
          href="#events"
          className="inline-flex items-center justify-center px-7 py-3 text-xs font-bold uppercase tracking-[0.22em] transition-transform hover:-translate-y-0.5"
          style={{ border: `1px solid ${outline}`, color: outline }}
        >
          View Events
        </a>
      )}
    </div>
  );
}

// 1) Boarding-pass hero — destination-wedding ticket with FROM/TO and a stub.
function HeroTicket({ theme, config, wedding, names, initials, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="ticket"
      className="relative isolate overflow-hidden px-5 py-14 @md:px-10 @lg:py-20"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="phera-rise text-[11px] font-semibold uppercase tracking-[0.5em] text-white/80">
          Now boarding — you&apos;re invited
        </p>
      </div>
      <div className="phera-rise phera-d2 mx-auto mt-8 max-w-4xl">
        <div
          className="grid overflow-hidden rounded-3xl shadow-2xl @lg:grid-cols-[1.7fr_1fr]"
          style={{ backgroundColor: theme.surface, color: theme.text }}
        >
          <div className="p-7 @md:p-9">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: theme.muted }}>
              <span className="inline-flex items-center gap-1.5"><Plane size={13} style={{ color: theme.accent }} />Boarding Pass</span>
              <span className="hidden @sm:inline">Two hearts · One journey</span>
            </div>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: theme.muted }}>From</p>
                <p className="text-lg font-semibold" style={{ fontFamily: theme.fontFamily }}>{names.first}</p>
              </div>
              <Plane size={22} className="mb-1" style={{ color: theme.accent }} />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: theme.muted }}>To</p>
                <p className="text-lg font-semibold" style={{ fontFamily: theme.fontFamily }}>{names.second || 'Forever'}</p>
              </div>
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight @sm:text-5xl" style={{ fontFamily: theme.fontFamily, color: theme.primary }}>
              {names.second ? `${names.first} & ${names.second}` : names.first}
            </h1>
            {tagline && <p className="mt-3 text-sm leading-6" style={{ color: theme.muted }}>{tagline}</p>}
            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              {[
                { label: 'Date', value: heroDate || 'TBA' },
                { label: 'Gate', value: location },
                { label: 'Class', value: 'Celebration' },
              ].map((cell) => (
                <div key={cell.label}>
                  <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: theme.muted }}>{cell.label}</p>
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>{cell.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            className="relative flex flex-col items-center justify-center gap-4 border-t border-dashed p-7 @lg:border-l @lg:border-t-0"
            style={{ borderColor: hexToRgba(theme.muted, 0.4), backgroundColor: hexToRgba(theme.accent, 0.08) }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold text-white shadow-inner" style={{ backgroundColor: theme.primary, fontFamily: theme.fontFamily }}>
              {initials}
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: theme.muted }}>Seat</p>
              <p className="text-xl font-semibold" style={{ color: theme.primary, fontFamily: theme.fontFamily }}>2 · Together</p>
            </div>
            <div className="flex items-end gap-[3px]" aria-hidden="true">
              {[7, 3, 5, 2, 6, 3, 8, 2, 4, 6, 3, 7, 2, 5].map((h, i) => (
                <span key={i} className="w-[3px]" style={{ height: `${h * 4}px`, backgroundColor: hexToRgba(theme.text, 0.75) }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="phera-rise phera-d4 mt-8 flex flex-col items-center">
        <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" />
        <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
      </div>
    </section>
  );
}

// 2) Kinetic marquee hero — electric after-dark with a scrolling name band.
function HeroMarquee({ theme, config, wedding, names, coupleName, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  const bannerText = `${coupleName}  ✦  ${heroDate || 'Save the date'}  ✦  ${tagline || 'Celebrate with us'}  ✦  `;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="marquee"
      className="relative isolate overflow-hidden px-6 py-16 @md:px-10 @lg:py-24"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <div className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full blur-3xl phera-float" style={{ backgroundColor: hexToRgba(theme.accent, 0.35) }} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full blur-3xl phera-float-slow" style={{ backgroundColor: hexToRgba(theme.muted, 0.45) }} aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="phera-rise inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/85 backdrop-blur">
          The night is ours
        </p>
        <h1 className="phera-rise phera-d1 mt-8 text-6xl font-extrabold leading-[0.92] tracking-[-0.02em] @sm:text-7xl @xl:text-8xl" style={{ fontFamily: theme.fontFamily }}>
          <span style={{ color: '#ffffff' }}>{names.first}</span>
          {names.second && (
            <>
              <span className="mx-3" style={{ color: theme.accent }}>&amp;</span>
              <span style={{ color: '#ffffff' }}>{names.second}</span>
            </>
          )}
        </h1>
        {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-xl text-base leading-8 text-white/75">{tagline}</p>}
      </div>
      <div className="relative mt-10 overflow-hidden border-y py-3" style={{ borderColor: hexToRgba(theme.accent, 0.35) }} aria-hidden="true">
        <div className="phera-marquee-track">
          {[0, 1].map((dup) => (
            <span key={dup} className="text-2xl font-bold uppercase tracking-[0.15em] @sm:text-3xl" style={{ fontFamily: theme.fontFamily, color: hexToRgba('#ffffff', 0.9) }}>
              {bannerText}{bannerText}
            </span>
          ))}
        </div>
      </div>
      <div className="relative mx-auto mt-10 flex max-w-4xl flex-col items-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm text-white/85 backdrop-blur">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date coming soon'}</span>
          <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</span>
        </div>
        <CountdownTimer targetDate={rawDate} theme={theme} variant="feature" />
        <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
      </div>
    </section>
  );
}

// 3) Vintage postcard hero — postage stamp, postmark and handwritten names.
function HeroStamp({ theme, config, wedding, names, initials, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  const scriptFamily = theme.scriptFontFamily || theme.fontFamily;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="stamp"
      className="relative isolate overflow-hidden px-5 py-14 @md:px-10 @lg:py-20"
      style={{ background: theme.heroBackground, color: theme.text }}
    >
      <div className="phera-rise mx-auto max-w-4xl -rotate-1">
        <div
          className="relative grid gap-6 rounded-sm border p-6 shadow-xl @md:grid-cols-[1.4fr_1fr] @md:p-9"
          style={{ backgroundColor: theme.surface, borderColor: hexToRgba(theme.muted, 0.35) }}
        >
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: theme.primary }}>Greetings from our wedding</p>
            <h1 className="mt-4 text-5xl leading-none @sm:text-6xl" style={{ fontFamily: scriptFamily, color: theme.primary }}>
              {names.second ? `${names.first} & ${names.second}` : names.first}
            </h1>
            {tagline && <p className="mt-5 max-w-sm text-sm leading-7" style={{ fontFamily: theme.bodyFontFamily, color: theme.muted }}>{tagline}</p>}
            <div className="mt-6 flex flex-col items-start gap-1.5 text-sm" style={{ fontFamily: theme.bodyFontFamily, color: theme.text }}>
              <p className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date to come'}</p>
              <p className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</p>
            </div>
          </div>
          <div className="relative flex flex-col items-center justify-between gap-6 border-t pt-6 @md:border-l @md:border-t-0 @md:pl-6 @md:pt-0" style={{ borderColor: hexToRgba(theme.muted, 0.3) }}>
            <div
              className="flex h-24 w-20 flex-col items-center justify-center gap-1 border-2 border-dashed"
              style={{ borderColor: hexToRgba(theme.primary, 0.5), backgroundColor: hexToRgba(theme.accent, 0.08) }}
            >
              <span className="text-2xl font-semibold" style={{ fontFamily: theme.fontFamily, color: theme.primary }}>{initials}</span>
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Forever</span>
            </div>
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 text-center phera-float-slow"
              style={{ borderColor: hexToRgba(theme.primary, 0.5), color: theme.primary }}
            >
              <span className="px-2 text-[9px] font-semibold uppercase leading-tight tracking-[0.15em]">{location} · Est. Love</span>
            </div>
          </div>
        </div>
      </div>
      <div className="phera-rise phera-d3 mt-8 flex justify-center">
        <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
      </div>
    </section>
  );
}

// 4) Brutalist Swiss-grid hero — oversized uppercase type, hairlines, one accent.
function HeroGrid({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="grid"
      className="relative isolate overflow-hidden px-6 py-12 @md:px-10 @lg:py-16"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between border-t-2 pb-3 pt-3 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ borderColor: theme.text }}>
          <span>01 — The Wedding Of</span>
          <span style={{ color: theme.accent }}>◆</span>
          <span className="hidden @sm:inline">{heroDate || 'Date TBA'}</span>
        </div>
        <div className="phera-rise border-b py-8" style={{ borderColor: hexToRgba(theme.text, 0.2) }}>
          <h1 className="text-[clamp(2.75rem,15cqw,9rem)] font-black uppercase leading-[0.82] tracking-[-0.03em]" style={{ fontFamily: theme.fontFamily }}>
            {names.first}
          </h1>
          {names.second && (
            <h1 className="text-[clamp(2.75rem,15cqw,9rem)] font-black uppercase leading-[0.82] tracking-[-0.03em]" style={{ fontFamily: theme.fontFamily }}>
              <span style={{ color: theme.accent }}>&amp;</span> {names.second}
            </h1>
          )}
        </div>
        <div className="grid gap-px @md:grid-cols-3" style={{ backgroundColor: hexToRgba(theme.text, 0.15) }}>
          {[
            { n: '02', label: 'Date', value: heroDate || 'TBA' },
            { n: '03', label: 'Location', value: location },
            { n: '04', label: 'Dress Code', value: tagline || 'Celebration Best' },
          ].map((cell) => (
            <div key={cell.n} className="p-5" style={{ backgroundColor: theme.background }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>{cell.n} / {cell.label}</p>
              <p className="mt-2 text-lg font-semibold" style={{ fontFamily: theme.bodyFontFamily }}>{cell.value}</p>
            </div>
          ))}
        </div>
        <SquareActions config={config} wedding={wedding} publicEvents={publicEvents} primaryBg={theme.text} primaryText={theme.background} outline={theme.text} />
      </div>
    </section>
  );
}

// 5) Aurora glass hero — drifting gradient blobs behind a frosted card.
function HeroAurora({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="aurora"
      className="relative isolate overflow-hidden px-6 py-16 @md:px-10 @lg:py-24"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.primary, 0.4) }} aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-10%] top-10 h-96 w-96 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.accent, 0.38), animationDelay: '-6s' }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-20%] left-1/3 h-80 w-80 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.muted, 0.32), animationDelay: '-11s' }} aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl">
        <div
          className="phera-rise rounded-[2rem] border border-white/50 bg-white/40 px-7 py-12 text-center shadow-[0_24px_80px_rgba(15,23,42,0.15)] backdrop-blur-2xl @md:px-12"
          style={{ borderColor: hexToRgba('#ffffff', 0.6) }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.primary }}>Save our date</p>
          <h1 className="mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.01em] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily, color: theme.text }}>
            {names.first}
            {names.second && (
              <span className="block" style={{ color: theme.primary }}>&amp; {names.second}</span>
            )}
          </h1>
          {tagline && <p className="mx-auto mt-6 max-w-lg text-base leading-8" style={{ color: theme.muted }}>{tagline}</p>}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border px-6 py-3 text-sm" style={{ borderColor: hexToRgba(theme.primary, 0.25), color: theme.muted }}>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.primary }} />{heroDate || 'Date coming soon'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.primary }} />{location}</span>
          </div>
          <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" tone="onLight" align="center" />
          <div className="flex justify-center">
            <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
          </div>
        </div>
      </div>
    </section>
  );
}

// 6) Heritage crest hero — ceremonial monogram seal with a laurel ring.
function HeroMonogram({ theme, config, wedding, names, initials, coupleName, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  const year = (() => {
    const d = new Date(config.websiteHero?.date || wedding?.weddingDate);
    return Number.isNaN(d.getTime()) ? '' : d.getFullYear();
  })();
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="monogram"
      className="relative isolate overflow-hidden px-6 py-16 text-center @md:px-10 @lg:py-24"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <div className="relative mx-auto flex max-w-2xl flex-col items-center">
        <div className="phera-rise relative flex h-56 w-56 items-center justify-center rounded-full @sm:h-64 @sm:w-64" style={{ border: `2px solid ${hexToRgba(theme.accent, 0.7)}` }}>
          <div className="absolute inset-3 rounded-full" style={{ border: `1px solid ${hexToRgba('#ffffff', 0.35)}` }} />
          <div className="flex flex-col items-center">
            <span className="text-6xl leading-none @sm:text-7xl" style={{ fontFamily: theme.fontFamily, color: '#ffffff' }}>{initials}</span>
            {year && <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: theme.accent }}>Est. {year}</span>}
          </div>
        </div>
        <p className="phera-rise phera-d2 mt-9 text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.accent }}>The marriage of</p>
        <h1 className="phera-rise phera-d2 mt-4 text-4xl leading-tight @sm:text-5xl" style={{ fontFamily: theme.fontFamily }}>
          {coupleName}
        </h1>
        {tagline && <p className="phera-rise phera-d3 mt-5 max-w-lg text-base leading-8 text-white/80" style={{ fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mt-7 flex items-center gap-4 text-sm text-white/85">
          <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date to come'}</span>
          <span className="h-px w-8" style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
        </div>
        <p className="phera-rise phera-d4 mt-2 inline-flex items-center gap-2 text-sm text-white/70"><MapPin size={14} style={{ color: theme.accent }} />{location}</p>
        <div className="phera-rise phera-d5">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
        </div>
      </div>
    </section>
  );
}

// 7) Cinematic filmstrip hero — letterbox bars, feature title and credits.
function HeroFilmstrip({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  const holes = Array.from({ length: 22 });
  const Sprockets = () => (
    <div className="flex justify-between px-3 py-2" aria-hidden="true">
      {holes.map((_, i) => (
        <span key={i} className="h-2.5 w-2 rounded-[2px]" style={{ backgroundColor: hexToRgba('#ffffff', 0.18) }} />
      ))}
    </div>
  );
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="filmstrip"
      className="relative isolate overflow-hidden py-6 text-center"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <Sprockets />
      <div className="relative mx-auto max-w-3xl px-6 py-12 @lg:py-16">
        <div className="phera-rise inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border phera-spin-slow" style={{ borderColor: hexToRgba(theme.accent, 0.7) }}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.accent }} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.5em]" style={{ color: theme.accent }}>Now Showing</span>
        </div>
        <h1 className="phera-rise phera-d1 mt-7 text-5xl font-bold uppercase leading-[0.9] tracking-[0.02em] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>
          {names.first}
          {names.second && <span className="block" style={{ color: theme.accent }}>&amp; {names.second}</span>}
        </h1>
        <p className="phera-rise phera-d2 mt-5 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Directed by love · A once-in-a-lifetime feature</p>
        {tagline && <p className="phera-rise phera-d3 mx-auto mt-6 max-w-xl text-base leading-8 text-white/80" style={{ fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/85">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Coming soon'}</span>
          <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</span>
          <span className="rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ borderColor: hexToRgba('#ffffff', 0.4) }}>Rated · L</span>
        </div>
        <div className="phera-rise phera-d4 flex justify-center">
          <SquareActions config={config} wedding={wedding} publicEvents={publicEvents} primaryBg={theme.accent} primaryText="#111111" outline={hexToRgba('#ffffff', 0.6)} />
        </div>
      </div>
      <Sprockets />
    </section>
  );
}

// 8) Retro sunburst hero — 70s groovy type over radiating rays.
function HeroRetro({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  const rays = `repeating-conic-gradient(from 0deg at 50% 100%, ${hexToRgba(theme.accent, 0.28)} 0deg 8deg, transparent 8deg 16deg)`;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="retro"
      className="relative isolate overflow-hidden px-6 py-16 text-center @md:px-10 @lg:py-24"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[-40%] phera-spin-slow" style={{ background: rays, opacity: 0.9 }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-30%] mx-auto h-[70%] w-[70%] rounded-full blur-2xl" style={{ background: `radial-gradient(circle, ${hexToRgba(theme.accent, 0.4)}, transparent 70%)` }} aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <p className="phera-rise inline-flex items-center rounded-full px-5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-white shadow" style={{ backgroundColor: theme.accent }}>
          Let&apos;s get groovy
        </p>
        <h1 className="phera-rise phera-d1 mt-8 text-6xl leading-[0.9] @sm:text-7xl @xl:text-8xl" style={{ fontFamily: theme.fontFamily, color: theme.primary }}>
          {names.first}
          {names.second && (
            <span className="block" style={{ color: theme.accent }}>&amp; {names.second}</span>
          )}
        </h1>
        {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-lg text-base leading-8" style={{ color: theme.muted, fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full px-6 py-3 text-sm text-white shadow-lg" style={{ backgroundColor: theme.primary }}>
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} />{heroDate || 'Date coming soon'}</span>
          <span className="inline-flex items-center gap-2"><MapPin size={15} />{location}</span>
        </div>
        <div className="phera-rise phera-d4 flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

// 9) Art Deco hero — symmetrical black-and-gold frame with a geometric sunfan.
function HeroDeco({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const tagline = config.websiteHero?.tagline;
  const fan = `repeating-conic-gradient(from 200deg at 50% 0%, ${hexToRgba(theme.accent, 0.55)} 0deg 2deg, transparent 2deg 12deg)`;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="deco"
      className="relative isolate overflow-hidden px-6 py-14 text-center @md:px-10 @lg:py-20"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <div className="relative mx-auto max-w-3xl p-6 @md:p-10" style={{ border: `2px solid ${hexToRgba(theme.accent, 0.6)}` }}>
        <div className="absolute inset-2" style={{ border: `1px solid ${hexToRgba(theme.accent, 0.35)}` }} aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-48 -translate-x-1/2" style={{ background: fan, maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }} aria-hidden="true" />
        <div className="relative">
          <p className="phera-rise mt-6 text-[11px] font-semibold uppercase tracking-[0.55em]" style={{ color: theme.accent }}>The marriage of</p>
          <div className="phera-rise phera-d1 my-5 flex items-center justify-center gap-4">
            <span className="h-px w-12" style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
            <span className="text-lg" style={{ color: theme.accent }}>◆</span>
            <span className="h-px w-12" style={{ backgroundColor: hexToRgba(theme.accent, 0.7) }} />
          </div>
          <h1 className="phera-rise phera-d1 text-5xl leading-[1.05] tracking-[0.02em] @sm:text-6xl @xl:text-7xl" style={{ fontFamily: theme.fontFamily }}>
            {names.first}
            {names.second && (
              <>
                <span className="mx-3" style={{ color: theme.accent }}>&amp;</span>
                <span className="block @sm:inline">{names.second}</span>
              </>
            )}
          </h1>
          {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-lg text-base leading-8 text-white/80" style={{ fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
          <div className="phera-rise phera-d3 mx-auto mt-7 inline-flex items-center gap-3 px-6 py-3 text-sm" style={{ border: `1px solid ${hexToRgba(theme.accent, 0.5)}`, color: '#ffffff' }}>
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date to come'}</span>
            <span style={{ color: theme.accent }}>·</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</span>
          </div>
          <div className="phera-rise phera-d4 flex justify-center">
            <SquareActions config={config} wedding={wedding} publicEvents={publicEvents} primaryBg={theme.accent} primaryText={theme.primary} outline={hexToRgba(theme.accent, 0.7)} />
          </div>
        </div>
      </div>
    </section>
  );
}

// 10) Confetti terrazzo hero — playful Memphis shapes scattered behind bold rounded type.
function HeroTerrazzo({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  const confetti = [
    { top: '10%', left: '7%', size: 34, color: theme.accent, shape: 'rounded-full', anim: 'phera-float' },
    { top: '20%', left: '87%', size: 26, color: theme.primary, shape: 'rounded-md rotate-12', anim: 'phera-float-slow' },
    { top: '70%', left: '11%', size: 22, color: theme.primary, shape: 'rounded-md -rotate-6', anim: 'phera-float-slow' },
    { top: '74%', left: '84%', size: 38, color: theme.accent, shape: 'rounded-full', anim: 'phera-float' },
    { top: '44%', left: '93%', size: 16, color: theme.muted, shape: 'rounded-full', anim: 'phera-float' },
    { top: '54%', left: '4%', size: 20, color: theme.accent, shape: 'rounded-sm rotate-45', anim: 'phera-float-slow' },
  ];
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="terrazzo"
      className="relative isolate overflow-hidden px-6 py-16 text-center @md:px-10 @lg:py-24"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {confetti.map((c, i) => (
        <span
          key={i}
          className={`pointer-events-none absolute ${c.shape} ${c.anim}`}
          style={{ top: c.top, left: c.left, height: c.size, width: c.size, backgroundColor: hexToRgba(c.color, 0.85) }}
          aria-hidden="true"
        />
      ))}
      <div className="relative mx-auto max-w-2xl">
        <p className="phera-rise inline-flex items-center rounded-full px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-white shadow" style={{ backgroundColor: theme.primary }}>
          Let&apos;s celebrate
        </p>
        <h1 className="phera-rise phera-d1 mt-7 text-[clamp(2.75rem,13cqw,6rem)] font-bold leading-[0.95] tracking-[-0.01em]" style={{ fontFamily: theme.fontFamily, color: theme.primary }}>
          {names.first}
          {names.second && (
            <span className="block">
              <span style={{ color: theme.accent }}>&amp;</span> {names.second}
            </span>
          )}
        </h1>
        {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-lg text-base leading-8" style={{ color: theme.muted, fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl px-6 py-3 text-sm font-medium shadow-sm" style={{ backgroundColor: theme.surface, color: theme.text }}>
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date coming soon'}</span>
          <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</span>
        </div>
        <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" tone="onLight" align="center" />
        <div className="phera-rise phera-d4 flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

// 11) Watercolor wash hero — soft painterly blooms behind an airy serif name.
function HeroWatercolor({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="watercolor"
      className="relative isolate overflow-hidden px-6 py-20 text-center @md:px-10 @lg:py-28"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="pointer-events-none absolute -left-16 -top-10 h-72 w-72 rounded-full blur-[80px] phera-aurora" style={{ backgroundColor: hexToRgba(theme.primary, 0.32), mixBlendMode: 'multiply' }} aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-8%] top-8 h-80 w-80 rounded-full blur-[90px] phera-aurora" style={{ backgroundColor: hexToRgba(theme.accent, 0.3), mixBlendMode: 'multiply', animationDelay: '-7s' }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-16%] left-1/3 h-72 w-72 rounded-full blur-[80px] phera-aurora" style={{ backgroundColor: hexToRgba(theme.muted, 0.26), mixBlendMode: 'multiply', animationDelay: '-12s' }} aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <p className="phera-rise text-[11px] font-semibold uppercase tracking-[0.5em]" style={{ color: theme.primary }}>Together with our families</p>
        <h1 className="phera-rise phera-d1 mt-7 text-[clamp(2.5rem,12cqw,5.5rem)] font-medium leading-[1.02]" style={{ fontFamily: theme.fontFamily, color: theme.text }}>
          {names.first}
          {names.second && (
            <span className="mt-1 block italic" style={{ color: theme.primary }}>&amp; {names.second}</span>
          )}
        </h1>
        {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-lg text-base leading-8" style={{ color: theme.muted, fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
          <span className="h-px w-16" style={{ backgroundColor: hexToRgba(theme.primary, 0.4) }} />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.primary }} />{heroDate || 'Date coming soon'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.primary }} />{location}</span>
          </div>
          <span className="h-px w-16" style={{ backgroundColor: hexToRgba(theme.primary, 0.4) }} />
        </div>
        <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" tone="onLight" align="center" />
        <div className="phera-rise phera-d4 flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

// 12) Blanc minimal hero — gallery-grade whitespace, a hairline rule and thin serif.
function HeroMinimal({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="minimal"
      className="relative isolate overflow-hidden px-6 py-24 text-center @md:px-10 @lg:py-32"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="relative mx-auto max-w-2xl">
        <p className="phera-rise text-[11px] font-semibold uppercase tracking-[0.6em]" style={{ color: theme.muted }}>The wedding of</p>
        <h1 className="phera-rise phera-d1 mt-8 text-[clamp(2.5rem,11cqw,5.5rem)] font-light leading-[1.05] tracking-[-0.01em]" style={{ fontFamily: theme.fontFamily, color: theme.text }}>
          {names.first}
          {names.second && (
            <>
              <span className="mx-2 font-light" style={{ color: theme.accent }}>&amp;</span>
              <span className="@sm:inline">{names.second}</span>
            </>
          )}
        </h1>
        <div className="phera-rise phera-d2 mx-auto mt-9 h-px w-16" style={{ backgroundColor: hexToRgba(theme.text, 0.25) }} />
        <div className="phera-rise phera-d2 mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] font-medium uppercase tracking-[0.28em]" style={{ color: theme.muted }}>
          <span>{heroDate || 'Date coming soon'}</span>
          <span style={{ color: theme.accent }}>·</span>
          <span>{location}</span>
        </div>
        {tagline && <p className="phera-rise phera-d3 mx-auto mt-7 max-w-md text-base leading-8" style={{ color: theme.muted, fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" tone="onLight" align="center" />
        <div className="phera-rise phera-d4 flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

// 13) Iridescent mesh hero — drifting gradient mesh under a modern glass headline.
function HeroMesh({ theme, config, wedding, names, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="mesh"
      className="relative isolate overflow-hidden px-6 py-20 text-center @md:px-10 @lg:py-28"
      style={{ background: theme.heroBackground, color: '#ffffff' }}
    >
      <div className="pointer-events-none absolute -left-24 -top-20 h-96 w-96 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.primary, 0.55) }} aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-12%] top-4 h-96 w-96 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.accent, 0.5), animationDelay: '-6s' }} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-24%] left-1/4 h-96 w-96 rounded-full blur-3xl phera-aurora" style={{ backgroundColor: hexToRgba(theme.muted, 0.45), animationDelay: '-11s' }} aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl">
        <p className="phera-rise inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.4em] text-white/85 backdrop-blur">
          Save our date
        </p>
        <h1 className="phera-rise phera-d1 mt-8 text-[clamp(2.75rem,13cqw,7rem)] font-bold leading-[0.94] tracking-[-0.02em]" style={{ fontFamily: theme.fontFamily }}>
          {names.first}
          {names.second && (
            <span className="block" style={{ color: theme.accent }}>&amp; {names.second}</span>
          )}
        </h1>
        {tagline && <p className="phera-rise phera-d2 mx-auto mt-6 max-w-xl text-base leading-8 text-white/80" style={{ fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
        <div className="phera-rise phera-d3 mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm text-white/85 backdrop-blur">
          <span className="inline-flex items-center gap-2"><CalendarDays size={15} style={{ color: theme.accent }} />{heroDate || 'Date coming soon'}</span>
          <span className="inline-flex items-center gap-2"><MapPin size={15} style={{ color: theme.accent }} />{location}</span>
        </div>
        <CountdownTimer targetDate={rawDate} theme={theme} variant="feature" />
        <div className="phera-rise phera-d4 flex justify-center">
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="light" />
        </div>
      </div>
    </section>
  );
}

// 14) Terracotta mosaic hero — a warm tiled grid of name, date, place and monogram.
function HeroMosaic({ theme, config, wedding, names, initials, heroDate, location, publicEvents }) {
  const rawDate = config.websiteHero?.date || wedding?.weddingDate;
  const tagline = config.websiteHero?.tagline;
  return (
    <section
      data-website-theme={theme.key}
      data-hero-layout="mosaic"
      className="relative isolate overflow-hidden px-6 py-14 @md:px-10 @lg:py-20"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="phera-rise grid gap-3 @lg:grid-cols-3 @lg:grid-rows-2">
          <div
            className="flex flex-col justify-between rounded-2xl p-7 @lg:col-span-2 @lg:row-span-2 @md:p-9"
            style={{ backgroundColor: theme.primary, color: '#ffffff' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em]" style={{ color: hexToRgba('#ffffff', 0.75) }}>Together forever</p>
            <h1 className="mt-8 text-[clamp(2.5rem,11cqw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.01em]" style={{ fontFamily: theme.fontFamily }}>
              {names.first}
              {names.second && (
                <span className="block" style={{ color: theme.accent }}>&amp; {names.second}</span>
              )}
            </h1>
            {tagline && <p className="mt-6 max-w-md text-sm leading-7" style={{ color: hexToRgba('#ffffff', 0.82), fontFamily: theme.bodyFontFamily }}>{tagline}</p>}
          </div>
          <div className="flex items-center justify-center rounded-2xl p-6" style={{ backgroundColor: theme.accent, color: '#ffffff' }}>
            <span className="text-5xl font-semibold" style={{ fontFamily: theme.fontFamily }}>{initials}</span>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-2xl p-6" style={{ backgroundColor: theme.surface }}>
            <p className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.text }}><CalendarDays size={16} style={{ color: theme.primary }} />{heroDate || 'Date coming soon'}</p>
            <p className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: theme.text }}><MapPin size={16} style={{ color: theme.primary }} />{location}</p>
          </div>
        </div>
        <div className="phera-rise phera-d2 mt-3 flex flex-col items-center gap-4 rounded-2xl p-6" style={{ backgroundColor: theme.surface }}>
          <CountdownTimer targetDate={rawDate} theme={theme} variant="inline" tone="onLight" />
          <HeroActions theme={theme} config={config} wedding={wedding} publicEvents={publicEvents} tone="onLight" />
        </div>
      </div>
    </section>
  );
}

export default function WeddingWebsitePreview({
  wedding,
  config: rawConfig,
  events = [],
  previewMode = false,
}) {
  const config = useMemo(() => normalizeWebsiteConfig(rawConfig), [rawConfig]);
  const baseTheme = useMemo(() => getThemeConfig(config.websiteTheme), [config.websiteTheme]);
  const theme = useMemo(() => resolveWebsiteTheme(config), [config]);
  const coupleName = getCoupleDisplayName(wedding);
  const names = useMemo(() => getCoupleNames(wedding), [wedding]);
  const initials = useMemo(() => getCoupleInitials(wedding), [wedding]);
  const heroDate = formatDisplayDate(config.websiteHero?.date || wedding?.weddingDate);
  const heroLocation = wedding?.city || wedding?.venue || 'Location coming soon';
  const publicEvents = useMemo(() => {
    const selectedIds = new Set(config.websiteEventIds || []);
    return events.filter((event) => selectedIds.has(event.id));
  }, [config.websiteEventIds, events]);
  useThemeFont(theme);

  const heroProps = {
    theme,
    config,
    wedding,
    coupleName,
    names,
    initials,
    heroDate,
    location: heroLocation,
    publicEvents,
  };
  const renderHero = () => {
    switch (theme.layout) {
      case 'editorial':
        return <HeroEditorial {...heroProps} />;
      case 'luxe':
        return <HeroLuxe {...heroProps} />;
      case 'arch':
        return <HeroArch {...heroProps} />;
      case 'poster':
        return <HeroPoster {...heroProps} />;
      case 'split':
        return <HeroSplit {...heroProps} />;
      case 'ticket':
        return <HeroTicket {...heroProps} />;
      case 'marquee':
        return <HeroMarquee {...heroProps} />;
      case 'stamp':
        return <HeroStamp {...heroProps} />;
      case 'grid':
        return <HeroGrid {...heroProps} />;
      case 'aurora':
        return <HeroAurora {...heroProps} />;
      case 'monogram':
        return <HeroMonogram {...heroProps} />;
      case 'filmstrip':
        return <HeroFilmstrip {...heroProps} />;
      case 'retro':
        return <HeroRetro {...heroProps} />;
      case 'deco':
        return <HeroDeco {...heroProps} />;
      case 'terrazzo':
        return <HeroTerrazzo {...heroProps} />;
      case 'watercolor':
        return <HeroWatercolor {...heroProps} />;
      case 'minimal':
        return <HeroMinimal {...heroProps} />;
      case 'mesh':
        return <HeroMesh {...heroProps} />;
      case 'mosaic':
        return <HeroMosaic {...heroProps} />;
      case 'botanical':
      default:
        return <HeroBotanical {...heroProps} />;
    }
  };

  return (
    <div
      className="@container overflow-hidden rounded-[2rem] border border-white/60 shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
      style={{ backgroundColor: theme.background, color: theme.text, fontFamily: theme.bodyFontFamily }}
    >
      <HeroKeyframes />
      {!config.websitePublished && previewMode && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium"
          style={{ backgroundColor: theme.surface, color: theme.primary }}
        >
          <Heart size={16} />
          Draft preview. Only you can see this version.
        </div>
      )}

      {renderHero()}

      <div className="mx-auto max-w-6xl px-6 py-16 @md:px-10 @2xl:px-16">
        {publicEvents.length > 0 && (
          <section id="events" className="scroll-mt-24 py-6">
            <SectionTitle
              eyebrow="Schedule"
              title="Wedding Weekend"
              description="A celebration thoughtfully planned for our favorite people."
              theme={theme}
            />
            <div className="grid gap-6 @2xl:grid-cols-2">
              {publicEvents.map((event) => {
                const mapsLink = getMapsLink(event);
                const icsHref = buildIcsHref(event, coupleName);
                return (
                  <article
                    key={event.id}
                    className="rounded-[1.75rem] border border-white/60 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.primary }}>
                          Event
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
                          {event.name}
                        </h3>
                      </div>
                      {event.dressCode && (
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{ backgroundColor: `${theme.accent}55`, color: theme.primary }}
                        >
                          {event.dressCode}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4 text-sm leading-7" style={{ color: theme.muted }}>
                      <div className="flex items-start gap-3">
                        <CalendarDays size={18} className="mt-1 flex-shrink-0" style={{ color: theme.primary }} />
                        <p>{formatEventDate(event)}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="mt-1 flex-shrink-0" style={{ color: theme.primary }} />
                        <div>
                          <p className="font-medium" style={{ color: theme.text }}>{event.venue || 'Venue to come'}</p>
                          {event.address && <p>{event.address}</p>}
                        </div>
                      </div>
                      {event.description && (
                        <div className="flex items-start gap-3">
                          <Clock3 size={18} className="mt-1 flex-shrink-0" style={{ color: theme.primary }} />
                          <p>{event.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold"
                          style={{ color: theme.primary }}
                        >
                          <MapPin size={16} />
                          View Map
                        </a>
                      )}
                      {icsHref && (
                        <a
                          href={icsHref}
                          download={`${(event.name || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`}
                          className="inline-flex items-center gap-2 text-sm font-semibold"
                          style={{ color: theme.primary }}
                        >
                          <CalendarPlus size={16} />
                          Add to Calendar
                        </a>
                      )}
                      {config.websiteRsvp?.enabled && (
                        <Link
                          to={`/rsvp/${wedding?.id}`}
                          className="inline-flex items-center gap-2 text-sm font-semibold"
                          style={{ color: theme.primary }}
                        >
                          RSVP
                          <ExternalLink size={16} />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {config.websiteStory?.enabled && config.websiteStory?.text && (
          <section id="story" className="scroll-mt-24 py-16">
            <SectionTitle
              eyebrow="Our Story"
              title="How It All Began"
              description="The little moments that led us here."
              theme={theme}
            />
            <div
              className="mx-auto max-w-4xl rounded-[2rem] border border-white/60 px-8 py-10 text-center text-base leading-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] @lg:text-lg"
              style={{ backgroundColor: theme.surface, color: theme.muted }}
            >
              <p className="whitespace-pre-line">{config.websiteStory.text}</p>
            </div>
          </section>
        )}

        {config.websiteHotels?.enabled && config.websiteHotels.items.length > 0 && (
          <section className="py-6">
            <SectionTitle
              eyebrow="Travel"
              title="Travel & Accommodation"
              description="Everything you need to plan a smooth and joyful stay."
              theme={theme}
            />
            <div className="grid gap-6 @2xl:grid-cols-2">
              {config.websiteHotels.items.map((hotel, index) => (
                <article
                  key={`${hotel.name}-${index}`}
                  className="rounded-[1.75rem] border border-white/60 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                  style={{ backgroundColor: theme.surface }}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${theme.accent}50`, color: theme.primary }}
                    >
                      <Plane size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold" style={{ color: theme.text, fontFamily: theme.fontFamily }}>{hotel.name || 'Hotel block'}</h3>
                      {hotel.groupRateCode && (
                        <p className="text-sm" style={{ color: theme.muted }}>
                          Group rate code: <span className="font-semibold" style={{ color: theme.primary }}>{hotel.groupRateCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {hotel.address && (
                    <p className="text-sm leading-7" style={{ color: theme.muted }}>{hotel.address}</p>
                  )}
                  {hotel.link && (
                    <a
                      href={hotel.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                      style={{ color: theme.primary }}
                    >
                      View booking details
                      <ExternalLink size={16} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {config.websiteRegistry?.enabled && config.websiteRegistry.items.length > 0 && (
          <section id="registry" className="scroll-mt-24 py-16">
            <SectionTitle
              eyebrow="Registry"
              title="Gift Registry"
              description="Your love and presence mean the world. If you'd like to celebrate with a gift, we've shared a few registries below."
              theme={theme}
            />
            <div className="mx-auto grid max-w-4xl gap-4">
              {config.websiteRegistry.items.map((item, index) => (
                <a
                  key={`${item.name}-${index}`}
                  href={item.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[1.5rem] border border-white/60 px-5 py-4 shadow-[0_12px_36px_rgba(15,23,42,0.08)] transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.surface }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${theme.accent}45`, color: theme.primary }}
                    >
                      <Gift size={18} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold" style={{ color: theme.text }}>{item.name || 'Registry'}</p>
                      <p className="text-sm" style={{ color: theme.muted }}>{item.url}</p>
                    </div>
                  </div>
                  <ExternalLink size={18} style={{ color: theme.primary }} />
                </a>
              ))}
            </div>
          </section>
        )}

        {config.websiteGallery?.enabled && (config.websiteGallery.images || []).length > 0 && (
          <section className="py-16">
            <SectionTitle
              eyebrow="Gallery"
              title="Our Moments"
              description="A few of our favorite memories together."
              theme={theme}
            />
            <div className="mx-auto max-w-5xl grid grid-cols-2 @2xl:grid-cols-3 gap-3">
              {config.websiteGallery.images.map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </section>
        )}

        {config.websiteRsvp?.enabled && (
          <section className="py-8">
            <div
              className="rounded-[2rem] px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.text})`,
                color: '#ffffff',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                Celebration RSVP
              </p>
              <h2 className="mt-4 text-3xl font-semibold @lg:text-4xl" style={{ fontFamily: theme.fontFamily }}>
                We would love to celebrate with you
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 @lg:text-base">
                Please let us know if you'll be joining us so we can plan each moment with care.
              </p>
              <Link
                to={`/rsvp/${wedding?.id}`}
                className="mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: theme.surface, color: theme.primary }}
              >
                {config.websiteRsvp.buttonText}
              </Link>
            </div>
          </section>
        )}
      </div>

      <footer
        className="border-t px-6 py-10 text-center text-sm @md:px-10 @2xl:px-16"
        style={{ borderColor: `${theme.accent}60`, backgroundColor: theme.surface, color: theme.muted }}
      >
        <p className="text-lg font-medium" style={{ color: theme.text, fontFamily: theme.fontFamily }}>
          {config.websiteFooter}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.3em]">
          With love, {coupleName}
        </p>
      </footer>
    </div>
  );
}
