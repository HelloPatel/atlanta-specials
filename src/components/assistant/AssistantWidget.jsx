import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import AssistantChat from './AssistantChat';

const CORNER_KEY = 'phera:assistantCorner';
const VALID_CORNERS = ['br', 'bl', 'tr', 'tl'];
const BUTTON_SIZE = 56; // w-14 / h-14
const DRAG_THRESHOLD = 6; // px of movement before it counts as a drag
const EDGE_GAP = 16; // keep this far from the viewport edge while dragging

function readCorner() {
  if (typeof window === 'undefined') return 'br';
  const saved = window.localStorage.getItem(CORNER_KEY);
  return VALID_CORNERS.includes(saved) ? saved : 'br';
}

// Resting position for the launcher. Bottom corners clear the mobile nav bar
// and the phone's safe-area inset; desktop uses a simple 1.5rem margin.
const LAUNCHER_POS = {
  br: 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 md:bottom-6 md:right-6',
  bl: 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 md:bottom-6 md:left-6',
  tr: 'top-[calc(0.75rem+env(safe-area-inset-top))] right-4 md:top-6 md:right-6',
  tl: 'top-[calc(0.75rem+env(safe-area-inset-top))] left-4 md:top-6 md:left-6',
};

// The desktop chat panel opens from the same corner the button rests in.
const PANEL_POS = {
  br: 'sm:bottom-24 sm:right-6 origin-bottom-right',
  bl: 'sm:bottom-24 sm:left-6 origin-bottom-left',
  tr: 'sm:top-24 sm:right-6 origin-top-right',
  tl: 'sm:top-24 sm:left-6 origin-top-left',
};

/**
 * Floating "chat bubble" entry point for the Phera Assistant.
 *
 * The launcher lives in a corner but can be dragged anywhere; on release it
 * snaps to the nearest corner and remembers that choice. A short drag never
 * counts as a click, so moving it won't accidentally open the chat.
 */
export default function AssistantWidget() {
  const { canViewFeature } = useWedding();
  const [open, setOpen] = useState(false);
  const [corner, setCorner] = useState(readCorner);
  const [dragPos, setDragPos] = useState(null); // {left, top} while dragging
  const panelRef = useRef(null);
  const launcherRef = useRef(null);

  // Pointer/drag bookkeeping kept in refs so it doesn't trigger re-renders.
  const drag = useRef({ active: false, moved: false, grabX: 0, grabY: 0 });
  const suppressClick = useRef(false);

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

  const persistCorner = useCallback((next) => {
    setCorner(next);
    try {
      window.localStorage.setItem(CORNER_KEY, next);
    } catch {
      /* private mode / storage disabled — position just won't persist */
    }
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (open) return; // only draggable in its launcher state
      const rect = launcherRef.current?.getBoundingClientRect();
      if (!rect) return;
      drag.current = {
        active: true,
        moved: false,
        grabX: e.clientX - rect.left,
        grabY: e.clientY - rect.top,
      };
      try {
        launcherRef.current.setPointerCapture(e.pointerId);
      } catch {
        /* not all pointers support capture */
      }
    },
    [open]
  );

  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const left = e.clientX - d.grabX;
    const top = e.clientY - d.grabY;
    if (!d.moved) {
      const rect = launcherRef.current?.getBoundingClientRect();
      const movedFar =
        rect &&
        (Math.abs(left - rect.left) > DRAG_THRESHOLD ||
          Math.abs(top - rect.top) > DRAG_THRESHOLD);
      if (!movedFar) return;
      d.moved = true;
    }
    const maxLeft = window.innerWidth - BUTTON_SIZE - EDGE_GAP;
    const maxTop = window.innerHeight - BUTTON_SIZE - EDGE_GAP;
    setDragPos({
      left: Math.min(Math.max(EDGE_GAP, left), Math.max(EDGE_GAP, maxLeft)),
      top: Math.min(Math.max(EDGE_GAP, top), Math.max(EDGE_GAP, maxTop)),
    });
  }, []);

  const endDrag = useCallback(
    (e) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      try {
        launcherRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (d.moved && dragPos) {
        // Snap to the nearest corner based on the button's center point.
        const centerX = dragPos.left + BUTTON_SIZE / 2;
        const centerY = dragPos.top + BUTTON_SIZE / 2;
        const horiz = centerX < window.innerWidth / 2 ? 'l' : 'r';
        const vert = centerY < window.innerHeight / 2 ? 't' : 'b';
        persistCorner(`${vert}${horiz}`);
        suppressClick.current = true; // this pointer sequence was a drag, not a tap
      }
      setDragPos(null);
    },
    [dragPos, persistCorner]
  );

  const onClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setOpen((v) => !v);
  }, []);

  if (!canViewFeature('assistant')) return null;

  const dragging = dragPos !== null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Phera Assistant chat"
          className={`fixed z-50 bottom-0 right-0 left-0 top-0 sm:top-auto sm:left-auto sm:right-auto sm:bottom-auto ${PANEL_POS[corner]} sm:w-[400px] sm:h-[min(620px,calc(100dvh-8rem))] bg-white sm:rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col animate-sheet-up sm:animate-assistant-in`}
        >
          <AssistantChat onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Launcher button — draggable, snaps to the nearest corner on release */}
      <button
        ref={launcherRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onClick}
        aria-expanded={open}
        aria-label={open ? 'Close Phera Assistant' : 'Open Phera Assistant'}
        style={
          dragging
            ? { left: dragPos.left, top: dragPos.top, right: 'auto', bottom: 'auto', touchAction: 'none' }
            : { touchAction: 'none' }
        }
        className={`fixed z-50 flex items-center justify-center rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2 ${
          dragging
            ? 'cursor-grabbing scale-110 transition-transform'
            : 'transition-all active:scale-95 cursor-grab ' + LAUNCHER_POS[corner]
        } ${
          open
            ? 'w-12 h-12 bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hidden sm:flex'
            : 'w-14 h-14 bg-gradient-to-br from-wine-500 to-wine-700 text-white hover:shadow-xl'
        } ${!open && !dragging ? 'hover:scale-105' : ''}`}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <Sparkles className="w-6 h-6 pointer-events-none" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wine-300 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-wine-400" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
