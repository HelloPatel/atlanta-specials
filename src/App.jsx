import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WeddingProvider } from './contexts/WeddingContext';
import { ToastProvider } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Eager-loaded pages (landing/auth — needed immediately)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Lazy-loaded pages (code-split for faster initial load)
const PublicRSVP = lazy(() => import('./pages/PublicRSVP'));
const PublicWeddingWebsite = lazy(() => import('./pages/PublicWeddingWebsite'));
const TableFinder = lazy(() => import('./pages/TableFinder'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GuestManager = lazy(() => import('./pages/GuestManager'));
const EventManager = lazy(() => import('./pages/EventManager'));
const SeatingChart = lazy(() => import('./pages/SeatingChart'));
const RSVPManager = lazy(() => import('./pages/RSVPManager'));
const PhotoGroupManager = lazy(() => import('./pages/PhotoGroupManager'));
const BetsManager = lazy(() => import('./pages/BetsManager'));
const WeddingWebsite = lazy(() => import('./pages/WeddingWebsite'));
const PrintExport = lazy(() => import('./pages/PrintExport'));
const SeedData = lazy(() => import('./pages/SeedData'));

// Lazy public sub-views
const PublicPhotoGroupQueue = lazy(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PublicPhotoGroupQueue })));
const PhotoGroupDisplayView = lazy(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PhotoGroupDisplayView })));
const PublicBetsManager = lazy(() => import('./components/bets/BetsManager').then(m => ({ default: m.PublicBetsManager })));
const BetsLeaderboardView = lazy(() => import('./components/bets/BetsManager').then(m => ({ default: m.BetsLeaderboardView })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-wine-700 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/rsvp/:weddingId" element={<PublicRSVP />} />
          <Route path="/w/:weddingId" element={<PublicWeddingWebsite />} />
          <Route path="/find-table/:weddingId/:eventId" element={<TableFinder />} />
          <Route path="/photos/:weddingId" element={<PublicPhotoGroupQueue />} />
          <Route path="/photos/:weddingId/display" element={<PhotoGroupDisplayView />} />
          <Route path="/bets/:weddingId" element={<PublicBetsManager />} />
          <Route path="/bets/:weddingId/leaderboard" element={<BetsLeaderboardView />} />

          {/* Protected app routes */}
          <Route
            element={
              <ProtectedRoute>
                <WeddingProvider>
                  <AppShell />
                </WeddingProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guests" element={<GuestManager />} />
            <Route path="/events" element={<EventManager />} />
            <Route path="/seating" element={<SeatingChart />} />
            <Route path="/rsvp" element={<RSVPManager />} />
            <Route path="/photos" element={<PhotoGroupManager />} />
            <Route path="/bets" element={<BetsManager />} />
            <Route path="/website" element={<WeddingWebsite />} />
            <Route path="/print" element={<PrintExport />} />
            <Route path="/seed" element={<SeedData />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
