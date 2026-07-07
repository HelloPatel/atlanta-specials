import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-wine-50 via-ivory-100 to-phera-50/30">
      <div className="text-center max-w-md">
        <p className="text-6xl font-display font-bold text-wine-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-8">
          This page doesn't exist. If you were looking for a wedding RSVP link, check with the couple for the correct URL.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-wine-700 hover:bg-wine-800 rounded-xl transition-colors"
          >
            <Home size={16} /> Go home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <ArrowLeft size={16} /> Go back
          </button>
        </div>
      </div>
    </div>
  );
}
