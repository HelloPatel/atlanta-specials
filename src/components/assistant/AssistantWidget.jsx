import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import AssistantChat from './AssistantChat';

/**
 * Floating "chat bubble" entry point for the Phera Assistant.
 *
 * Renders a fixed bottom-right launcher button on every authenticated page.
 * Clicking it opens a compact chat panel anchored to the same corner (near
 * full-screen on mobile). Gated by the `assistant` feature so the role/access
 * matrix still applies.
 */
export default function AssistantWidget() {
  const { canViewFeature } = useWedding();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);

  // Close on Escape and restore focus to the launcher.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!canViewFeature('assistant')) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Phera Assistant chat"
          className="fixed z-50 bottom-0 right-0 left-0 top-0 origin-bottom-right sm:top-auto sm:left-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:h-[min(620px,calc(100dvh-8rem))] bg-white sm:rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col animate-sheet-up sm:animate-assistant-in"
        >
          <AssistantChat onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Launcher button (hidden while open on mobile to avoid overlap) */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close Phera Assistant' : 'Open Phera Assistant'}
        className={`fixed z-50 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2 ${
          open
            ? 'w-12 h-12 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hidden sm:flex'
            : 'w-14 h-14 bg-gradient-to-br from-wine-500 to-wine-700 text-white hover:shadow-xl hover:scale-105'
        }`}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wine-300 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-wine-400" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
