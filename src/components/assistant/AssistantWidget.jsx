import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import AssistantChat from './AssistantChat';

const LAUNCHER_KEY = 'phera:assistantLauncherPos';
const BUTTON_SIZE = 56; // w-14 / h-14
const PANEL_W = 400; // sm:w-[400px]
const DRAG_THRESHOLD = 6; // px of movement before it counts as a drag
const EDGE_GAP = 16; // keep this far from the viewport edge

function clampToViewport(pos, w, h) {
  const maxLeft = window.innerWidth - w - EDGE_GAP;
  const maxTop = window.innerHeight - h - EDGE_GAP;
  return {
    left: Math.min(Math.max(EDGE_GAP, pos.left), Math.max(EDGE_GAP, maxLeft)),
    top: Math.min(Math.max(EDGE_GAP, pos.top), Math.max(EDGE_GAP, maxTop)),
  };
}

// Default resting spot: bottom-right, clearing the mobile nav bar / safe area.
function defaultLauncherPos() {
  if (typeof window === 'undefined') return { left: 0, top: 0 };
  return clampToViewport(
    {
      left: window.innerWidth - BUTTON_SIZE - 24,
      top: window.innerHeight - BUTTON_SIZE - 88,
    },
    BUTTON_SIZE,
    BUTTON_SIZE
  );
}

function readLauncherPos() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAUNCHER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.left === 'number' && typeof p?.top === 'number') return p;
  } catch {
    /* ignore */
  }
  return null;
}

function panelHeight() {
  return Math.min(620, window.innerHeight - 128); // matches sm:h-[min(620px,100dvh-8rem)]
}

/**
 * Floating "chat bubble" entry point for the Phera Assistant.
 *
 * The launcher can be dragged anywhere on screen (not just the corners) and
 * remembers where you left it; on first load it starts in the bottom-right.
 * The open chat panel opens centered on desktop and can be dragged around by
 * its header. A short drag never counts as a click, so moving either one won't
 * accidentally open or close the chat.
 */
export default function AssistantWidget() {
  const { canViewFeature } = useWedding();
  const [open, setOpen] = useState(false);
  const [launcherPos, setLauncherPos] = useState(
    () => readLauncherPos() || defaultLauncherPos()
  );
  const [panelPos, setPanelPos] = useState(null); // desktop panel {left, top}
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
  );
  const panelRef = useRef(null);
  const launcherRef = useRef(null);

  // Pointer/drag bookkeeping kept in refs so it doesn't trigger re-renders.
  const drag = useRef({ active: false, moved: false, grabX: 0, grabY: 0 });
  const panelDrag = useRef({ active: false, grabX: 0, grabY: 0 });
  const suppressClick = useRef(false);

  // Track the desktop breakpoint so drag/center only apply on sm+.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Keep the launcher on-screen across resizes / first mount.
  useEffect(() => {
    const clamp = () =>
      setLauncherPos((p) => clampToViewport(p || defaultLauncherPos(), BUTTON_SIZE, BUTTON_SIZE));
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  // Center the desktop panel each time it opens; clear position when closed.
  useEffect(() => {
    if (open && isDesktop) {
      const h = panelHeight();
      setPanelPos({
        left: Math.max(EDGE_GAP, Math.round((window.innerWidth - PANEL_W) / 2)),
        top: Math.max(EDGE_GAP, Math.round((window.innerHeight - h) / 2)),
      });
    } else if (!open) {
      setPanelPos(null);
    }
  }, [open, isDesktop]);

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

  const persistLauncher = useCallback((pos) => {
    try {
      window.localStorage.setItem(LAUNCHER_KEY, JSON.stringify(pos));
    } catch {
      /* private mode / storage disabled — position just won't persist */
    }
  }, []);

  // ---- Launcher drag (free positioning, anywhere on screen) ----
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
    setLauncherPos(clampToViewport({ left, top }, BUTTON_SIZE, BUTTON_SIZE));
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
      if (d.moved) {
        suppressClick.current = true; // this pointer sequence was a drag, not a tap
        setLauncherPos((p) => {
          persistLauncher(p);
          return p;
        });
      }
    },
    [persistLauncher]
  );

  // ---- Panel drag (desktop only, via the header handle) ----
  const onPanelPointerDown = useCallback(
    (e) => {
      if (!isDesktop) return;
      if (e.target.closest('button')) return; // let header buttons work normally
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      panelDrag.current = {
        active: true,
        grabX: e.clientX - rect.left,
        grabY: e.clientY - rect.top,
      };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [isDesktop]
  );

  const onPanelPointerMove = useCallback((e) => {
    const d = panelDrag.current;
    if (!d.active) return;
    const w = panelRef.current?.offsetWidth || PANEL_W;
    const h = panelRef.current?.offsetHeight || panelHeight();
    setPanelPos(clampToViewport({ left: e.clientX - d.grabX, top: e.clientY - d.grabY }, w, h));
  }, []);

  const onPanelPointerUp = useCallback((e) => {
    if (!panelDrag.current.active) return;
    panelDrag.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onClick = useCallback(() => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setOpen((v) => !v);
  }, []);

  if (!canViewFeature('assistant')) return null;

  const dragging = drag.current.active && drag.current.moved;
  const dragHandleProps = isDesktop
    ? {
        onPointerDown: onPanelPointerDown,
        onPointerMove: onPanelPointerMove,
        onPointerUp: onPanelPointerUp,
        onPointerCancel: onPanelPointerUp,
      }
    : undefined;

  return (
    <>
      {/* Chat panel — centered on desktop, draggable by its header; full-screen sheet on mobile */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Phera Assistant chat"
          style={
            isDesktop && panelPos
              ? { left: panelPos.left, top: panelPos.top, right: 'auto', bottom: 'auto' }
              : undefined
          }
          className="fixed z-50 bottom-0 right-0 left-0 top-0 sm:inset-auto sm:w-[400px] sm:h-[min(620px,calc(100dvh-8rem))] bg-white sm:rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col animate-sheet-up sm:animate-assistant-in"
        >
          <AssistantChat
            onClose={() => setOpen(false)}
            onMinimize={() => setOpen(false)}
            dragHandleProps={dragHandleProps}
          />
        </div>
      )}

      {/* Launcher button — draggable anywhere, remembers its position */}
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
        style={{ left: launcherPos.left, top: launcherPos.top, right: 'auto', bottom: 'auto', touchAction: 'none' }}
        className={`fixed z-50 flex items-center justify-center rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2 ${
          dragging ? 'cursor-grabbing scale-110 transition-transform' : 'transition-all active:scale-95 cursor-grab'
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
