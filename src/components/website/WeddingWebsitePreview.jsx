import { useEffect, useId, useMemo, useState } from 'react';
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

function HeroPatternOverlay({ pattern, theme }) {
  const patternId = `website-${pattern}-pattern-${useId().replace(/:/g, '')}`;

  if (!pattern || pattern === 'none') return null;

  if (pattern === 'mandala') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-24 opacity-70">
          <MandalaBackground color={theme.accent} size={420} opacity={0.12} />
        </div>
        <div className="absolute -bottom-36 -left-28 opacity-50">
          <MandalaBackground color="#ffffff" size={360} opacity={0.09} />
        </div>
      </div>
    );
  }

  if (pattern === 'geometric') {
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(30deg, transparent 24%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.12) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.12) 75%, rgba(255,255,255,0.12) 76%, transparent 77%),
            linear-gradient(150deg, transparent 24%, ${hexToRgba(theme.accent, 0.16)} 25%, ${hexToRgba(theme.accent, 0.16)} 26%, transparent 27%, transparent 74%, ${hexToRgba(theme.accent, 0.16)} 75%, ${hexToRgba(theme.accent, 0.16)} 76%, transparent 77%)
          `,
          backgroundSize: '88px 152px',
        }}
      />
    );
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {pattern === 'floral' ? (
          <pattern id={patternId} width="180" height="180" patternUnits="userSpaceOnUse">
            <g transform="translate(45 45)" fill="none" stroke={theme.accent} strokeWidth="1.4" opacity="0.45">
              {[0, 45, 90, 135].map((rotation) => (
                <ellipse key={rotation} cx="0" cy="-13" rx="6" ry="14" transform={`rotate(${rotation})`} />
              ))}
              <circle r="4" fill={theme.accent} fillOpacity="0.35" />
              <path d="M10 14 C28 22, 30 39, 18 52 M18 35 C28 31, 35 32, 42 38" />
            </g>
            <g transform="translate(137 132) scale(.7)" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.32">
              {[0, 60, 120].map((rotation) => (
                <ellipse key={rotation} cx="0" cy="-12" rx="5" ry="12" transform={`rotate(${rotation})`} />
              ))}
            </g>
          </pattern>
        ) : (
          <pattern id={patternId} width="170" height="170" patternUnits="userSpaceOnUse">
            <g transform="translate(28 22) rotate(-12)" fill="none" stroke={theme.accent} strokeWidth="1.4" opacity="0.42">
              <path d="M52 8 C24 18, 8 44, 14 73 C20 101, 55 113, 76 94 C93 79, 87 51, 67 46 C50 42, 39 57, 44 70 C48 80, 62 83, 69 74" />
              <path d="M52 20 C34 29, 24 47, 28 66 C32 82, 49 91, 61 82" opacity="0.7" />
              <circle cx="54" cy="64" r="4" fill={theme.accent} fillOpacity="0.35" />
            </g>
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
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
    heroOverlay: config.websiteCustomColors?.primary
      ? `linear-gradient(135deg, ${hexToRgba(baseTheme.text, 0.74)}, ${hexToRgba(config.websiteCustomColors.primary, 0.5)})`
      : baseTheme.heroOverlay,
    heroBackground: config.websiteCustomColors?.primary
      ? `radial-gradient(circle at 78% 16%, ${hexToRgba(config.websiteCustomColors?.accent || baseTheme.accent, 0.5)}, transparent 34%), linear-gradient(135deg, ${config.websiteCustomColors.primary}, ${baseTheme.text})`
      : baseTheme.heroBackground,
  }), [baseTheme, config.websiteCustomColors]);
  const coupleName = getCoupleDisplayName(wedding);
  const heroDate = formatDisplayDate(config.websiteHero?.date || wedding?.weddingDate);
  const publicEvents = useMemo(() => {
    const selectedIds = new Set(config.websiteEventIds || []);
    return events.filter((event) => selectedIds.has(event.id));
  }, [config.websiteEventIds, events]);
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
          Draft preview. Only you can see this version.
        </div>
      )}

      <section
        className={`relative isolate flex items-center overflow-hidden ${
          previewMode
            ? 'min-h-[560px] px-8 py-12'
            : 'min-h-[620px] px-6 py-16 md:px-10 lg:px-16'
        }`}
        style={{
          backgroundColor: theme.primary,
          backgroundImage: config.websiteHero?.backgroundImage
            ? `${theme.heroOverlay}, url(${config.websiteHero.backgroundImage})`
            : theme.heroBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/5" />
        <HeroPatternOverlay pattern={config.websiteHero?.pattern} theme={theme} />
        {/* Ornamental decorations for Indian themes */}
        {theme.ornaments && (
          <>
            <FourCorners color="rgba(255,255,255,0.15)" size={70} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <MandalaBackground color="#ffffff" size={400} opacity={0.04} />
            </div>
          </>
        )}
        <div className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col ${
          previewMode ? 'gap-8' : 'gap-12 lg:flex-row lg:items-end lg:justify-between'
        }`}>
          <div className="max-w-3xl text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/90 backdrop-blur">
              <Heart size={14} />
              We're getting married
            </div>
            <h1
              className={`font-semibold leading-[0.95] tracking-[-0.03em] ${
                previewMode ? 'text-5xl md:text-6xl' : 'text-5xl md:text-7xl'
              }`}
              style={{ fontFamily: theme.fontFamily }}
            >
              {coupleName}
            </h1>
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

          <div className={`grid w-full gap-4 ${
            previewMode ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 lg:max-w-md'
          }`}>
            <div className="min-w-0 rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur">
              <CalendarDays size={18} className="mb-3 text-white/80" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">When</p>
              <p className="mt-2 text-base font-medium leading-6 md:text-lg">{heroDate || 'Date coming soon'}</p>
            </div>
            <div className="min-w-0 rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg backdrop-blur">
              <MapPin size={18} className="mb-3 text-white/80" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Where</p>
              <p className="mt-2 text-base font-medium leading-6 md:text-lg">{wedding?.city || wedding?.venue || 'Location coming soon'}</p>
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
