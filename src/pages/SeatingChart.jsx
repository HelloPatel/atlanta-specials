import { lazy, Suspense, useEffect, useState } from 'react';

// Split desktop (heavy @dnd-kit) from mobile (lightweight, no DnD)
const DesktopSeatingCanvas = lazy(() => import('../components/seating/SeatingCanvas'));
const MobileSeatingView = lazy(() => import('../components/seating/MobileSeatingView'));

function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

function SeatingLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-wine-700 border-t-transparent" />
    </div>
  );
}

export default function SeatingChart() {
  const isMobile = useMobileLayout();

  return (
    <div>
      <div className="mb-4 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900">Seating Chart</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop guests to arrange tables</p>
      </div>
      <h1 className="sr-only md:hidden">Seating Chart</h1>
      <Suspense fallback={<SeatingLoader />}>
        {isMobile ? <MobileSeatingView /> : <DesktopSeatingCanvas />}
      </Suspense>
    </div>
  );
}
