import { useRef, useState } from 'react';
import { Calendar, Users, Grid3X3, Mail, Camera, Trophy, Play, Pause } from 'lucide-react';

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
    description: 'Paste from Excel. Columns auto-detected, families grouped, duplicates caught.',
    caption: 'Paste a spreadsheet, watch columns map themselves.',
  },
  {
    key: 'seating',
    icon: Grid3X3,
    title: 'Drag and drop seating',
    description: 'Mix table sizes (8, 10, 12, 14). Set keep-apart rules. Dance floor, stage and bar zones.',
    caption: 'Drag guests onto tables around the dance floor.',
  },
  {
    key: 'rsvp',
    icon: Mail,
    title: 'RSVPs via WhatsApp link',
    description: 'One link. Guests tap their name and respond. No login, no app download needed.',
    caption: 'Guests tap their name and respond in seconds.',
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

// Aesthetic animated placeholder shown until a real recording exists (or if it
// fails to load). Keeps the panel feeling premium rather than broken.
function DemoFallback({ label }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-wine-50 via-ivory-50 to-phera-50">
      <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-wine-200/40 blur-2xl animate-float" />
      <div className="absolute -right-8 top-1/3 h-32 w-32 rounded-full bg-phera-200/40 blur-2xl animate-float" style={{ animationDelay: '1.2s' }} />
      <div className="relative flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-wine-500/70">Preview</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
    </div>
  );
}

function FeatureTile({ feature, isOpen, onToggle }) {
  const { icon: Icon, title, description, caption, key } = feature;
  const videoRef = useRef(null);
  const [videoOk, setVideoOk] = useState(true);
  const [playing, setPlaying] = useState(true);

  const togglePlay = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div
      className={`reveal group rounded-2xl sm:rounded-[1.25rem] border bg-white p-5 sm:p-7 shadow-card transition-all duration-500 ease-spring ${
        isOpen
          ? 'border-wine-200 shadow-lifted ring-1 ring-wine-100'
          : 'border-gray-200/60 hover:shadow-lifted hover:-translate-y-1'
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
            <div className="relative aspect-video overflow-hidden rounded-[calc(1.25rem-0.375rem)] bg-gray-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
              {videoOk ? (
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={`/demos/${key}.webm`}
                  poster={`/demos/${key}.png`}
                  muted
                  loop
                  playsInline
                  autoPlay={isOpen}
                  preload="metadata"
                  onError={() => setVideoOk(false)}
                />
              ) : (
                <DemoFallback label={caption} />
              )}

              {/* Caption overlay */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 py-3">
                <p className="text-[11px] sm:text-xs font-medium text-white/95">{caption}</p>
              </div>

              {/* Play/pause control (only meaningful when a real video is present) */}
              {videoOk && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/50 active:scale-95"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="translate-x-[1px]" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureTiles() {
  const [openKey, setOpenKey] = useState(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 items-start">
      {FEATURES.map((f) => (
        <FeatureTile
          key={f.key}
          feature={f}
          isOpen={openKey === f.key}
          onToggle={() => setOpenKey((cur) => (cur === f.key ? null : f.key))}
        />
      ))}
    </div>
  );
}
