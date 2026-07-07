import { useState, useEffect, useRef } from 'react';
import { Users, Grid3X3, Mail, Check, ArrowRight } from 'lucide-react';

/**
 * Animated product showcase that demonstrates Phera's key features.
 * Replaces a static video placeholder with a live, animated UI mockup.
 */
export default function ProductShowcase() {
  const [activeScene, setActiveScene] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  const scenes = [
    { id: 'guests', label: 'Import Guests', icon: Users },
    { id: 'seating', label: 'Seating Chart', icon: Grid3X3 },
    { id: 'rsvp', label: 'RSVP Tracking', icon: Mail },
  ];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveScene((prev) => (prev + 1) % scenes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div ref={ref} className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video shadow-venue">
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Scene indicator pills */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {scenes.map((scene, i) => {
          const Icon = scene.icon;
          return (
            <button
              key={scene.id}
              onClick={() => setActiveScene(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                activeScene === i
                  ? 'bg-white text-gray-900 shadow-sm scale-105'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Icon size={10} />
              <span className="hidden sm:inline">{scene.label}</span>
            </button>
          );
        })}
      </div>

      {/* Animated scenes */}
      <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-10">
        {activeScene === 0 && <GuestImportScene isVisible={isVisible} />}
        {activeScene === 1 && <SeatingScene isVisible={isVisible} />}
        {activeScene === 2 && <RSVPScene isVisible={isVisible} />}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-wine-500 to-phera-500 transition-none"
          style={{
            animation: isVisible ? 'progressFill 4s linear infinite' : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

function GuestImportScene({ isVisible }) {
  const guests = [
    { name: 'Sharma Family', count: 8, side: 'bride' },
    { name: 'Patel Family', count: 12, side: 'groom' },
    { name: 'Gupta Family', count: 6, side: 'bride' },
    { name: 'Mehta Family', count: 10, side: 'groom' },
    { name: 'Kapoor Family', count: 5, side: 'bride' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mockup window chrome */}
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-400/80" />
          <div className="size-2 rounded-full bg-amber-400/80" />
          <div className="size-2 rounded-full bg-green-400/80" />
          <span className="text-[9px] text-white/40 ml-2 font-mono">guest-list.xlsx imported</span>
        </div>
        <div className="bg-white p-3 space-y-1.5">
          {guests.map((g, i) => (
            <div
              key={g.name}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100"
              style={{
                animation: isVisible ? `slideInRow 0.4s cubic-bezier(0.32,0.72,0,1) ${i * 0.12}s both` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`size-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                  g.side === 'bride' ? 'bg-pink-400' : 'bg-blue-400'
                }`}>
                  {g.count}
                </div>
                <span className="text-xs font-medium text-gray-800">{g.name}</span>
              </div>
              <Check size={12} className="text-green-500" />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 px-1">
            <span className="text-[10px] text-gray-400">41 guests imported in 2.3s</span>
            <span className="text-[10px] font-semibold text-green-600">Ready</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRow {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function SeatingScene({ isVisible }) {
  const tables = [
    { x: 15, y: 25, size: 40, name: 'T1', fill: 8, cap: 10 },
    { x: 55, y: 20, size: 40, name: 'T2', fill: 10, cap: 10 },
    { x: 75, y: 55, size: 40, name: 'T3', fill: 6, cap: 10 },
    { x: 20, y: 65, size: 40, name: 'T4', fill: 9, cap: 10 },
    { x: 45, y: 55, size: 50, name: 'Head', fill: 12, cap: 12 },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-400/80" />
          <div className="size-2 rounded-full bg-amber-400/80" />
          <div className="size-2 rounded-full bg-green-400/80" />
          <span className="text-[9px] text-white/40 ml-2 font-mono">Seating Chart - Reception</span>
        </div>
        <div className="bg-[#fafbfc] p-4 relative aspect-[16/10]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(171, 32, 77, 0.04) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}>
          {/* Dance floor */}
          <div
            className="absolute rounded-full border-2 border-dashed border-purple-300 bg-purple-50/60 flex items-center justify-center"
            style={{ left: '35%', top: '35%', width: '28%', height: '45%', animation: isVisible ? 'fadeScale 0.6s cubic-bezier(0.32,0.72,0,1) 0.2s both' : 'none' }}
          >
            <span className="text-[9px] font-semibold text-purple-500">Dance Floor</span>
          </div>

          {/* Tables */}
          {tables.map((t, i) => (
            <div
              key={t.name}
              className={`absolute rounded-full border-2 flex flex-col items-center justify-center ${
                t.fill >= t.cap ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
              } shadow-sm`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: `${t.size}px`,
                height: `${t.size}px`,
                animation: isVisible ? `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.1}s both` : 'none',
              }}
            >
              <span className="text-[8px] font-bold text-gray-700">{t.name}</span>
              <span className="text-[7px] text-gray-500">{t.fill}/{t.cap}</span>
            </div>
          ))}

          {/* Stage indicator */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-1"
            style={{ animation: isVisible ? 'fadeScale 0.5s cubic-bezier(0.32,0.72,0,1) 0.5s both' : 'none' }}
          >
            <span className="text-[8px] font-semibold text-amber-600">Stage</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function RSVPScene({ isVisible }) {
  const responses = [
    { name: 'Priya Sharma', status: 'attending', time: '2m ago' },
    { name: 'Vikram Mehta +3', status: 'attending', time: '5m ago' },
    { name: 'Anita Gupta +1', status: 'maybe', time: '12m ago' },
    { name: 'Raj Kapoor +2', status: 'attending', time: '18m ago' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-400/80" />
          <div className="size-2 rounded-full bg-amber-400/80" />
          <div className="size-2 rounded-full bg-green-400/80" />
          <span className="text-[9px] text-white/40 ml-2 font-mono">RSVP Responses - Live</span>
        </div>
        <div className="bg-white p-3">
          {/* Stats row */}
          <div className="flex gap-2 mb-3">
            {[
              { val: '312', label: 'Attending', color: 'text-green-600 bg-green-50' },
              { val: '28', label: 'Maybe', color: 'text-amber-600 bg-amber-50' },
              { val: '89%', label: 'Response', color: 'text-wine-600 bg-wine-50' },
            ].map((stat) => (
              <div key={stat.label} className={`flex-1 rounded-lg px-2 py-1.5 ${stat.color}`}>
                <p className="text-sm font-bold">{stat.val}</p>
                <p className="text-[8px] opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Live responses */}
          <div className="space-y-1.5">
            {responses.map((r, i) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100"
                style={{
                  animation: isVisible ? `slideInRow 0.4s cubic-bezier(0.32,0.72,0,1) ${i * 0.15}s both` : 'none',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className={`size-2 rounded-full ${r.status === 'attending' ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <span className="text-xs font-medium text-gray-800">{r.name}</span>
                </div>
                <span className="text-[9px] text-gray-400">{r.time}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] text-gray-400">Via WhatsApp link</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-wine-600">
              Live <span className="size-1.5 rounded-full bg-green-400 animate-pulse-soft" />
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRow {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
