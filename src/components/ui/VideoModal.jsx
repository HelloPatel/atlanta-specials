import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Fullscreen video lightbox. Click a demo to maximize it. Closes on backdrop
 * click, the close button, or Escape. Rendered through a portal so it always
 * sits above the page regardless of where it is triggered from.
 */
export default function VideoModal({ open, src, caption, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 active:scale-95"
      >
        <X size={18} />
      </button>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          className="aspect-video w-full object-contain"
          src={src}
          loop
          playsInline
          autoPlay
          controls
        />
        {caption && (
          <div className="px-4 py-3 text-center">
            <p className="text-sm font-medium text-white/90">{caption}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
