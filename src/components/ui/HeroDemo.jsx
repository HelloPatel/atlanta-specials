import { useRef, useState } from 'react';
import ProductShowcase from './ProductShowcase';

/**
 * Real recorded walkthrough layered over the coded ProductShowcase.
 * The showcase is always the base layer so there is never a blank flash,
 * and the video fades in on top once it can play. If the video is missing
 * or fails, the showcase simply stays visible.
 */
export default function HeroDemo() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
      {/* Base layer: coded showcase, always present */}
      <div className="absolute inset-0">
        <ProductShowcase />
      </div>

      {/* Real recording fades in on top once it loads */}
      {!failed && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${ready ? 'opacity-100' : 'opacity-0'}`}
          src="/demos/hero.webm"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}

      {ready && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 py-3">
          <p className="text-[11px] sm:text-xs font-medium text-white/95">
            From guest list to seating to RSVPs, all in one place.
          </p>
        </div>
      )}
    </div>
  );
}
