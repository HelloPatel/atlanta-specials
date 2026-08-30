import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, Clock3, ExternalLink, Gift, Heart, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getCoupleDisplayName,
  getCoupleInitials,
  getCoupleNames,
  getThemeConfig,
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

function CountdownTimer({ targetDate, theme, variant = 'inline' }) {
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
  return (
    <div className={`flex gap-3 ${feature ? 'mt-8 justify-center gap-3 @sm:gap-4' : 'mt-6'}`}>
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map(({ value, label }) => (
        <div
          key={label}
          className={`text-center rounded-xl border border-white/20 bg-white/10 backdrop-blur ${feature ? 'px-4 py-3 min-w-[64px] @sm:min-w-[76px]' : 'px-3 py-2 min-w-[52px]'}`}
        >
          <p className={`font-bold text-white ${feature ? 'text-3xl @sm:text-4xl' : 'text-xl'}`}>{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
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

export default function WeddingWebsitePreview({
  wedding,
  config: rawConfig,
  events = [],
  previewMode = false,
}) {
  const config = useMemo(() => normalizeWebsiteConfig(rawConfig), [rawConfig]);
  const baseTheme = useMemo(() => getThemeConfig(config.websiteTheme), [config.websiteTheme]);
  const theme = useMemo(() => ({
    ...baseTheme,
    primary: config.websiteCustomColors?.primary || baseTheme.primary,
    accent: config.websiteCustomColors?.accent || baseTheme.accent,
    background: config.websiteCustomColors?.background || baseTheme.background,
    heroOverlay: config.websiteCustomColors?.primary
      ? `linear-gradient(135deg, ${hexToRgba(baseTheme.text, 0.74)}, ${hexToRgba(config.websiteCustomColors.primary, 0.5)})`
      : baseTheme.heroOverlay,
    heroBackground: config.websiteCustomColors?.primary
      ? `radial-gradient(circle at 78% 16%, ${hexToRgba(config.websiteCustomColors?.accent || baseTheme.accent, 0.5)}, transparent 34%), linear-gradient(135deg, ${config.websiteCustomColors.primary}, ${baseTheme.text})`
      : baseTheme.heroBackground,
  }), [baseTheme, config.websiteCustomColors]);
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
          <section id="events" className="py-6">
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
          <section className="py-16">
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
          <section className="py-16">
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
