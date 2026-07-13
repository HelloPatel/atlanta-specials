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
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookieNotice = lazy(() => import('./pages/CookieNotice'));
const CopyrightPolicy = lazy(() => import('./pages/CopyrightPolicy'));
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement'));

// Lazy public sub-views
const PublicPhotoGroupQueue = lazy(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PublicPhotoGroupQueue })));
const PhotoGroupDisplayView = lazy(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PhotoGroupDisplayView })));
const PublicBetsManager = lazy(() => import('./components/bets/BetsManager').then(m => ({ default: m.PublicBetsManager })));
const BetsLeaderboardView = lazy(() => import('./components/bets/BetsManager').then(m => ({ default: m.BetsLeaderboardView })));

function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="space-y-5 animate-pulse" aria-hidden="true">
        <div className="h-8 w-48 rounded-lg bg-wine-100" />
        <div className="h-4 w-72 max-w-full rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70" />
          ))}
        </div>
      </div>
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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookieNotice />} />
          <Route path="/copyright" element={<CopyrightPolicy />} />
          <Route path="/accessibility" element={<AccessibilityStatement />} />
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
