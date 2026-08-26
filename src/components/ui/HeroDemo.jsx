import { useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import ProductShowcase from './ProductShowcase';
import VideoModal from './VideoModal';

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
  const [maximized, setMaximized] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[calc(1.25rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]">
      {/* Base layer: coded showcase, shown only until the real video is ready
          (acts as a no-flash fallback, then unmounts so nothing shows behind
          the recording). */}
      {!ready && (
        <div className="absolute inset-0">
          <ProductShowcase />
        </div>
      )}

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
        <button
          type="button"
          onClick={() => setMaximized(true)}
          aria-label="Maximize"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition-all duration-300 hover:bg-black/50 active:scale-95"
        >
          <Maximize2 size={15} />
        </button>
      )}

      <VideoModal
        open={maximized}
        src="/demos/hero.webm"
        caption="From guest list to seating to RSVPs, all in one place."
        onClose={() => setMaximized(false)}
      />
    </div>
  );
}
