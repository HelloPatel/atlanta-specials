import { lazy, Suspense, useEffect, useState } from 'react';
import { PageHeader } from '../components/ui';

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
      <div className="hidden md:block">
        <PageHeader
          eyebrow="Tables"
          title="Seating Chart"
          subtitle="Drag and drop guests to arrange tables."
        />
      </div>
      <h1 className="sr-only md:hidden">Seating Chart</h1>
      <Suspense fallback={<SeatingLoader />}>
        {isMobile ? <MobileSeatingView /> : <DesktopSeatingCanvas />}
      </Suspense>
    </div>
  );
}
