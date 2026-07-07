import { lazy, Suspense } from 'react';

// Split desktop (heavy @dnd-kit) from mobile (lightweight, no DnD)
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const DesktopSeatingCanvas = lazy(() => import('../components/seating/SeatingCanvas'));
const MobileSeatingView = lazy(() => import('../components/seating/MobileSeatingView'));

function SeatingLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-wine-700 border-t-transparent" />
    </div>
  );
}

export default function SeatingChart() {
  return (
    <div>
      <div className="mb-4 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop guests to arrange tables</p>
      </div>
      <Suspense fallback={<SeatingLoader />}>
        {isMobile ? <MobileSeatingView /> : <DesktopSeatingCanvas />}
      </Suspense>
    </div>
  );
}
