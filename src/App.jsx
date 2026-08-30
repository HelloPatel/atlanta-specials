import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { lazyWithRetry } from './utils/lazyWithRetry';
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

// Lazy-loaded pages (code-split for faster initial load). lazyWithRetry keeps a
// stale chunk after a new deploy from showing a hard "failed to load" error.
const PublicRSVP = lazyWithRetry(() => import('./pages/PublicRSVP'));
const PublicWeddingWebsite = lazyWithRetry(() => import('./pages/PublicWeddingWebsite'));
const TableFinder = lazyWithRetry(() => import('./pages/TableFinder'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const GuestManager = lazyWithRetry(() => import('./pages/GuestManager'));
const EventManager = lazyWithRetry(() => import('./pages/EventManager'));
const SeatingChart = lazyWithRetry(() => import('./pages/SeatingChart'));
const RSVPManager = lazyWithRetry(() => import('./pages/RSVPManager'));
const PhotoGroupManager = lazyWithRetry(() => import('./pages/PhotoGroupManager'));
const BetsManager = lazyWithRetry(() => import('./pages/BetsManager'));
const WeddingWebsite = lazyWithRetry(() => import('./pages/WeddingWebsite'));
const PrintExport = lazyWithRetry(() => import('./pages/PrintExport'));
const SeedData = lazyWithRetry(() => import('./pages/SeedData'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const CookieNotice = lazyWithRetry(() => import('./pages/CookieNotice'));
const CopyrightPolicy = lazyWithRetry(() => import('./pages/CopyrightPolicy'));
const AccessibilityStatement = lazyWithRetry(() => import('./pages/AccessibilityStatement'));

// Lazy public sub-views
const PublicPhotoGroupQueue = lazyWithRetry(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PublicPhotoGroupQueue })));
const PhotoGroupDisplayView = lazyWithRetry(() => import('./components/photos/PhotoGroupManager').then(m => ({ default: m.PhotoGroupDisplayView })));
const PublicBetsManager = lazyWithRetry(() => import('./components/bets/BetsManager').then(m => ({ default: m.PublicBetsManager })));
const BetsLeaderboardView = lazyWithRetry(() => import('./components/bets/BetsManager').then(m => ({ default: m.BetsLeaderboardView })));

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
