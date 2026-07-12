import { useEffect, useRef, useState } from 'react';
import { Calendar, Users, Grid3X3, Camera, Trophy, Play, Pause, Maximize2 } from 'lucide-react';
import VideoModal from './VideoModal';

const FEATURES = [
  {
    key: 'events',
    icon: Calendar,
    title: 'Multiple events, separate guest lists',
    description: 'Mehndi gets 80 guests. Sangeet gets 200. Reception gets 500. Each one tracked separately.',
    caption: 'Switch between events — each keeps its own invite list.',
  },
  {
    key: 'import',
    icon: Users,
    title: 'Import 500 guests in 60 seconds',
    description: 'Upload from Excel or CSV. Columns auto-detected, families grouped, duplicates caught within each family.',
    caption: 'Upload a spreadsheet, watch columns map themselves.',
  },
  {
    key: 'seating',
    icon: Grid3X3,
    title: 'Drag and drop seating',
    description: 'Mix table sizes (8, 10, 12, 14). Set keep-apart rules. Dance floor, stage and bar zones.',
    caption: 'Drag guests onto tables around the dance floor.',
  },
  {
    key: 'photos',
    icon: Camera,
    title: 'Photo group shot list',
    description: 'Live queue on a screen at the venue. MC calls each group. Never miss a combination.',
    caption: 'A live shot-list queue the MC works through.',
  },
  {
    key: 'games',
    icon: Trophy,
    title: 'Guest games and predictions',
    description: 'Live voting on phones. Real-time leaderboard on the big screen. Keeps guests engaged.',
    caption: 'Live predictions with a real-time leaderboard.',
  },
];

// Persistent, on-brand animated placeholder. It always sits behind the media
// frame so there is never a blank/broken flash — a real recording (if present)
// simply fades in on top of it.
function DemoFallback({ label, icon: Icon }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-wine-50 via-ivory-50 to-phera-50">
      <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-wine-200/40 blur-2xl animate-float" />
      <div className="absolute -right-8 top-1/3 h-32 w-32 rounded-full bg-phera-200/40 blur-2xl animate-float" style={{ animationDelay: '1.2s' }} />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-wine-700 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
          {Icon && <Icon size={20} />}
        </span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-wine-500/70">
          <span className="size-1.5 rounded-full bg-wine-400 animate-pulse" /> Live preview
        </span>
      </div>
    </div>
  );
}

function FeatureTile({ feature, index, revealed, isOpen, onToggle }) {
  const { icon: Icon, title, description, caption, key } = feature;
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [maximized, setMaximized] = useState(false);

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div
      style={{ transitionDelay: revealed ? `${index * 70}ms` : '0ms' }}
      className={`group min-h-[9.5rem] rounded-2xl sm:min-h-[11rem] sm:rounded-[1.25rem] border bg-white p-5 sm:p-7 shadow-card transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        revealed ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-8 opacity-0 blur-[6px]'
      } ${
        isOpen
          ? 'border-wine-200 shadow-lifted ring-1 ring-wine-100'
          : 'border-gray-200/60 hover:-translate-y-1 hover:shadow-lifted'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-wine-50 to-phera-50 group-hover:from-wine-100 group-hover:to-phera-100 transition-all duration-500 ease-spring shadow-sm">
          <Icon size={20} className="text-wine-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
        <span
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ease-spring ${
            isOpen
              ? 'rotate-180 border-wine-200 bg-wine-600 text-white'
              : 'border-gray-200 bg-white text-wine-600 group-hover:border-wine-200 group-hover:bg-wine-50'
          }`}
        >
          <Play size={12} className="translate-x-[1px]" fill="currentColor" />
        </span>
      </button>

      {/* Expandable media — grid-rows accordion keeps it GPU-friendly */}
      <div
        className={`grid transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'mt-5 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          {/* Double-bezel media frame */}
          <div className="rounded-[1.25rem] bg-gray-900/[0.04] p-1.5 ring-1 ring-black/5">
            <div className="relative aspect-video overflow-hidden rounded-[calc(1.25rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              {/* Placeholder is always the base layer — no blank flash */}
              <DemoFallback label={caption} icon={Icon} />

              {/* Real recording (if one exists) fades in on top once it loads */}
              {isOpen && !videoFailed && (
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                  src={`/demos/${key}.webm`}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  onLoadedData={() => setVideoReady(true)}
                  onError={() => setVideoFailed(true)}
                />
              )}

              {/* Caption overlay only when a real video is showing */}
              {videoReady && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 py-3">
                  <p className="text-[11px] sm:text-xs font-medium text-white/95">{caption}</p>
                </div>
              )}

              {/* Play/pause + maximize controls (only when a real video is present) */}
              {videoReady && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/50 active:scale-95"
                    aria-label={playing ? 'Pause' : 'Play'}
                  >
                    {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="translate-x-[1px]" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMaximized(true); }}
                    className="flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/50 active:scale-95"
                    aria-label="Maximize"
                  >
                    <Maximize2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <VideoModal open={maximized} src={`/demos/${key}.webm`} caption={caption} onClose={() => setMaximized(false)} />
    </div>
  );
}

export default function FeatureTiles() {
  const [openKey, setOpenKey] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const gridRef = useRef(null);

  // Self-contained reveal driven by React state so it survives re-renders when
  // a tile is expanded (the previous imperative `.reveal` class was clobbered
  // by React on toggle, causing tiles to flash out and back in).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px 60px 0px' }
    );
    observer.observe(el);
    const fallback = setTimeout(() => setRevealed(true), 1500);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, []);

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 items-start">
      {FEATURES.map((f, i) => (
        <FeatureTile
          key={f.key}
          feature={f}
          index={i}
          revealed={revealed}
          isOpen={openKey === f.key}
          onToggle={() => setOpenKey((cur) => (cur === f.key ? null : f.key))}
        />
      ))}
    </div>
  );
}
