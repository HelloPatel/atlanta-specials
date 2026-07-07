import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, ExternalLink, Gift, Heart, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getCoupleDisplayName,
  getThemeConfig,
  normalizeWebsiteConfig,
} from './websiteThemes';
import { FourCorners, MandalaBackground, HennaDivider } from './InvitationOrnaments';

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

function hexToRgba(hex, alpha) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return `rgba(255, 255, 255, ${alpha})`;
  const normalized = hex.slice(1);
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getHeroPatternStyle(pattern, theme) {
  switch (pattern) {
    case 'mandala':
      return {
        backgroundImage: `
          radial-gradient(circle at center, ${hexToRgba(theme.accent, 0.22)} 0, ${hexToRgba(theme.accent, 0.22)} 10%, transparent 10%, transparent 28%),
          radial-gradient(circle at center, transparent 0, transparent 38%, ${hexToRgba('#ffffff', 0.12)} 38%, ${hexToRgba('#ffffff', 0.12)} 40%, transparent 40%)
        `,
        backgroundSize: '220px 220px',
        backgroundPosition: 'center',
      };
    case 'floral':
      return {
        backgroundImage: `
          radial-gradient(circle at 20% 20%, ${hexToRgba('#ffffff', 0.16)} 0, ${hexToRgba('#ffffff', 0.16)} 10%, transparent 10%),
          radial-gradient(circle at 80% 30%, ${hexToRgba(theme.accent, 0.18)} 0, ${hexToRgba(theme.accent, 0.18)} 12%, transparent 12%),
          radial-gradient(circle at 30% 80%, ${hexToRgba(theme.accent, 0.14)} 0, ${hexToRgba(theme.accent, 0.14)} 9%, transparent 9%)
        `,
        backgroundSize: '180px 180px',
        backgroundPosition: 'center',
      };
    case 'geometric':
      return {
        backgroundImage: `linear-gradient(135deg, ${hexToRgba('#ffffff', 0.1)} 25%, transparent 25%, transparent 50%, ${hexToRgba('#ffffff', 0.1)} 50%, ${hexToRgba('#ffffff', 0.1)} 75%, transparent 75%, transparent)`,
        backgroundSize: '72px 72px',
        backgroundPosition: 'center',
      };
    case 'paisley':
      return {
        backgroundImage: `
          radial-gradient(circle at 25% 30%, ${hexToRgba(theme.accent, 0.18)} 0, ${hexToRgba(theme.accent, 0.18)} 10%, transparent 11%),
          radial-gradient(circle at 30% 35%, transparent 0, transparent 12%, ${hexToRgba('#ffffff', 0.12)} 12%, ${hexToRgba('#ffffff', 0.12)} 16%, transparent 16%),
          radial-gradient(circle at 72% 68%, ${hexToRgba('#ffffff', 0.12)} 0, ${hexToRgba('#ffffff', 0.12)} 8%, transparent 9%)
        `,
        backgroundSize: '180px 180px',
        backgroundPosition: 'center',
      };
    default:
      return null;
  }
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

function SectionTitle({ eyebrow, title, description, theme }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p
        className="mb-3 text-xs font-semibold uppercase tracking-[0.35em]"
        style={{ color: theme.muted }}
      >
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: theme.text }}>
        {title}
      </h2>
      {theme.ornaments && (
        <div className="mt-4">
          <HennaDivider color={theme.accent} width="60%" className="mx-auto" />
        </div>
      )}
      {description && (
        <p className="mt-4 text-sm leading-7 md:text-base" style={{ color: theme.muted }}>
          {description}
        </p>
      )}
    </div>
  );
}

function CountdownTimer({ targetDate, theme }) {
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

  return (
    <div className="flex gap-3 mt-6">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map(({ value, label }) => (
        <div key={label} className="text-center rounded-xl border border-white/20 bg-white/10 backdrop-blur px-3 py-2 min-w-[52px]">
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-white/70">{label}</p>
        </div>
      ))}
    </div>
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
    heroOverlay: `linear-gradient(135deg, ${hexToRgba(baseTheme.text, 0.78)}, ${hexToRgba(config.websiteCustomColors?.primary || baseTheme.primary, 0.45)})`,
  }), [baseTheme, config.websiteCustomColors]);
  const coupleName = getCoupleDisplayName(wedding);
  const heroDate = formatDisplayDate(config.websiteHero?.date || wedding?.weddingDate);
  const publicEvents = useMemo(() => {
    const selectedIds = new Set(config.websiteEventIds || []);
    return events.filter((event) => selectedIds.has(event.id));
  }, [config.websiteEventIds, events]);
  const heroPatternStyle = useMemo(
    () => getHeroPatternStyle(config.websiteHero?.pattern, theme),
    [config.websiteHero?.pattern, theme]
  );

  useThemeFont(theme);

  return (
    <div
      className="overflow-hidden rounded-[2rem] border border-white/60 shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
      style={{ backgroundColor: theme.background, color: theme.text, fontFamily: theme.fontFamily }}
    >
      {!config.websitePublished && previewMode && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium"
          style={{ backgroundColor: theme.surface, color: theme.primary }}
        >
          <Heart size={16} />
          Previewing a draft website. Publish when you're ready to share it with guests.
        </div>
      )}

      <section
        className="relative isolate flex min-h-[620px] items-center overflow-hidden px-6 py-16 md:px-10 lg:px-16"
        style={{
          backgroundColor: theme.primary,
          backgroundImage: `${theme.heroOverlay}, ${
            config.websiteHero?.backgroundImage
              ? `url(${config.websiteHero.backgroundImage})`
              : `radial-gradient(circle at top, ${theme.accent}66, transparent 42%), linear-gradient(135deg, ${theme.primary}, ${theme.text})`
          }`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/5" />
        {heroPatternStyle && (
          <div
            className="absolute inset-0 opacity-90"
            style={heroPatternStyle}
          />
        )}
        {/* Ornamental decorations for Indian themes */}
        {theme.ornaments && (
          <>
            <FourCorners color="rgba(255,255,255,0.15)" size={70} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <MandalaBackground color="#ffffff" size={400} opacity={0.04} />
            </div>
          </>
        )}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/90 backdrop-blur">
              <Heart size={14} />
              Wedding Celebration
            </div>
            <h1 className="text-5xl font-semibold leading-none md:text-7xl" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {coupleName}
            </h1>
            {heroDate && (
              <p className="mt-6 text-lg text-white/90 md:text-2xl">
                {heroDate}
              </p>
            )}
            <CountdownTimer targetDate={config.websiteHero?.date || wedding?.weddingDate} theme={theme} />
            {config.websiteHero?.tagline && (
              <p className="mt-8 max-w-2xl text-base leading-8 text-white/85 md:text-xl">
                {config.websiteHero.tagline}
              </p>
            )}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {config.websiteRsvp?.enabled && (
                <Link
                  to={`/rsvp/${wedding?.id}`}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.surface, color: theme.primary }}
                >
                  {config.websiteRsvp.buttonText}
                </Link>
              )}
              {publicEvents.length > 0 && (
                <a
                  href="#events"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  View Events
                </a>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-md">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur">
              <CalendarDays size={18} className="mb-3 text-white/80" />
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Celebration Date</p>
              <p className="mt-2 text-lg font-medium">{heroDate || 'Details coming soon'}</p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur">
              <MapPin size={18} className="mb-3 text-white/80" />
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Location</p>
              <p className="mt-2 text-lg font-medium">{wedding?.city || wedding?.venue || 'Venue details to come'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 lg:px-16">
        {publicEvents.length > 0 && (
          <section id="events" className="py-6">
            <SectionTitle
              eyebrow="Schedule"
              title="Wedding Weekend"
              description="A celebration thoughtfully planned for our favorite people."
              theme={theme}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {publicEvents.map((event) => {
                const mapsLink = getMapsLink(event);
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
                        <h3 className="mt-3 text-2xl font-semibold" style={{ color: theme.text }}>
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

                    {mapsLink && (
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: theme.primary }}
                      >
                        Open in Google Maps
                        <ExternalLink size={16} />
                      </a>
                    )}
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
              className="mx-auto max-w-4xl rounded-[2rem] border border-white/60 px-8 py-10 text-center text-base leading-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] md:text-lg"
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
            <div className="grid gap-6 md:grid-cols-2">
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
                      <h3 className="text-xl font-semibold" style={{ color: theme.text }}>{hotel.name || 'Hotel block'}</h3>
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
            <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-3 gap-3">
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
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                We would love to celebrate with you
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
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
        className="border-t px-6 py-10 text-center text-sm md:px-10 lg:px-16"
        style={{ borderColor: `${theme.accent}60`, backgroundColor: theme.surface, color: theme.muted }}
      >
        <p className="text-lg font-medium" style={{ color: theme.text }}>
          {config.websiteFooter}
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.3em]">
          With love, {coupleName}
        </p>
      </footer>
    </div>
  );
}
