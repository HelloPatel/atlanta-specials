import { useState, useEffect, useRef } from 'react';
import { Check, ArrowRight } from 'lucide-react';

/**
 * Animated product showcase that demonstrates Phera's key features.
 * Replaces a static video placeholder with a live, animated UI mockup.
 */
export default function ProductShowcase() {
  const [activeScene, setActiveScene] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  const scenes = [
    { id: 'guests' },
    { id: 'seating' },
    { id: 'rsvp' },
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
    { name: 'Shah Family (Bride)', count: 8, side: 'bride' },
    { name: 'Patel Family (Groom)', count: 14, side: 'groom' },
    { name: 'Mehta Family', count: 6, side: 'bride' },
    { name: 'Desai Family', count: 10, side: 'groom' },
    { name: 'Bhatt Family', count: 5, side: 'bride' },
    { name: 'Joshi Family', count: 7, side: 'groom' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Mockup window chrome */}
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-400/80" />
          <div className="size-2 rounded-full bg-amber-400/80" />
          <div className="size-2 rounded-full bg-green-400/80" />
          <span className="text-[9px] text-white/40 ml-2 font-mono">phera-300-guests.xlsx imported</span>
        </div>
        <div className="bg-white p-3 space-y-1.5">
          {guests.map((g, i) => (
            <div
              key={g.name}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 border border-gray-100"
              style={{
                animation: isVisible ? `slideInRow 0.4s cubic-bezier(0.32,0.72,0,1) ${i * 0.1}s both` : 'none',
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
            <span className="text-[10px] text-gray-400">315 guests across 38 families in 3.1s</span>
            <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
              <Check size={10} /> Imported
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

function SeatingScene({ isVisible }) {
  const tables = [
    { x: 8, y: 8, size: 28, name: 'Head', fill: 12, cap: 12, shape: 'rect' },
    { x: 10, y: 32, size: 32, name: 'T1', fill: 10, cap: 10 },
    { x: 10, y: 58, size: 32, name: 'T2', fill: 10, cap: 10 },
    { x: 30, y: 38, size: 32, name: 'T3', fill: 8, cap: 10 },
    { x: 30, y: 64, size: 32, name: 'T4', fill: 10, cap: 10 },
    { x: 72, y: 32, size: 32, name: 'T5', fill: 10, cap: 10 },
    { x: 72, y: 58, size: 32, name: 'T6', fill: 9, cap: 10 },
    { x: 88, y: 38, size: 32, name: 'T7', fill: 10, cap: 10 },
    { x: 88, y: 64, size: 32, name: 'T8', fill: 7, cap: 10 },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-red-400/80" />
          <div className="size-2 rounded-full bg-amber-400/80" />
          <div className="size-2 rounded-full bg-green-400/80" />
          <span className="text-[9px] text-white/40 ml-2 font-mono">Reception - 30 tables, 315 guests</span>
        </div>
        <div className="bg-[#fafbfc] p-4 relative aspect-[16/10]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(171, 32, 77, 0.04) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}>
          {/* Dance floor - center */}
          <div
            className="absolute rounded-full border-2 border-dashed border-purple-300/70 flex items-center justify-center"
            style={{ 
              left: '38%', top: '28%', width: '24%', height: '50%',
              background: 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.06) 0%, rgba(168, 85, 247, 0.02) 70%, transparent 100%)',
              animation: isVisible ? 'fadeScale 0.6s cubic-bezier(0.32,0.72,0,1) 0.2s both' : 'none',
            }}
          >
            <span className="text-[8px] font-semibold text-purple-400">Dance Floor</span>
          </div>

          {/* Tables */}
          {tables.map((t, i) => (
            <div
              key={t.name}
              className={`absolute flex flex-col items-center justify-center shadow-sm ${
                t.shape === 'rect' 
                  ? 'rounded-lg border-2 border-amber-300 bg-amber-50' 
                  : t.fill >= t.cap 
                    ? 'rounded-full border-2 border-green-300 bg-green-50' 
                    : 'rounded-full border-2 border-gray-200 bg-white'
              }`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: t.shape === 'rect' ? '18%' : `${t.size}px`,
                height: t.shape === 'rect' ? '16%' : `${t.size}px`,
                animation: isVisible ? `popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.08}s both` : 'none',
              }}
            >
              <span className="text-[7px] font-bold text-gray-700">{t.name}</span>
              <span className="text-[6px] text-gray-400">{t.fill}/{t.cap}</span>
            </div>
          ))}

          {/* Stage indicator at bottom */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg border-2 border-dashed border-amber-300/70 px-6 py-1.5"
            style={{ 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(217, 119, 6, 0.03) 100%)',
              animation: isVisible ? 'fadeScale 0.5s cubic-bezier(0.32,0.72,0,1) 0.6s both' : 'none',
            }}
          >
            <span className="text-[8px] font-semibold text-amber-500">Stage / DJ</span>
          </div>

          {/* Stats overlay */}
          <div
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-100 shadow-sm"
            style={{ animation: isVisible ? 'fadeScale 0.4s cubic-bezier(0.32,0.72,0,1) 0.8s both' : 'none' }}
          >
            <span className="text-[8px] font-semibold text-gray-600">289/315 seated</span>
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
    { name: 'Sharma Family (4)', status: 'attending', time: '2m ago' },
    { name: 'Vikram Mehta +3', status: 'attending', time: '5m ago' },
    { name: 'Bhatt Family (6)', status: 'attending', time: '8m ago' },
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
          <span className="text-[9px] text-white/40 ml-2 font-mono">RSVP Responses - Reception (315 invited)</span>
        </div>
        <div className="bg-white p-3">
          {/* Stats row */}
          <div className="flex gap-2 mb-3">
            {[
              { val: '267', label: 'Attending', color: 'text-green-600 bg-green-50 border-green-100' },
              { val: '18', label: 'Maybe', color: 'text-amber-600 bg-amber-50 border-amber-100' },
              { val: '91%', label: 'Response', color: 'text-wine-600 bg-wine-50 border-wine-100' },
            ].map((stat) => (
              <div key={stat.label} className={`flex-1 rounded-xl px-2.5 py-2 border ${stat.color}`}>
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
                  animation: isVisible ? `slideInRow 0.4s cubic-bezier(0.32,0.72,0,1) ${i * 0.12}s both` : 'none',
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

          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] text-gray-400">Shared via WhatsApp link</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-green-600">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse-soft" />
              Live
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
