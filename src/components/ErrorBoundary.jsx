import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { APP_NAME } from '../config/constants';
import { isChunkLoadError } from '../utils/lazyWithRetry';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      const title = chunkError ? 'A new version is available' : 'Something went wrong';
      const message = chunkError
        ? `${APP_NAME} was updated while this page was open. Refresh to load the latest version.`
        : `${APP_NAME} encountered an unexpected error. Please try refreshing the page.`;

      return (
        <div className="flex min-h-dvh items-center justify-center bg-ivory-50 px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle className="text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-wine-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-wine-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2"
              >
                <RefreshCw size={16} aria-hidden="true" />
                Refresh page
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2"
              >
                <Home size={16} aria-hidden="true" />
                Go home
              </a>
            </div>
            {this.state.error && !chunkError && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Technical details</summary>
                <pre className="mt-2 rounded-lg bg-gray-100 p-3 text-xs text-gray-600 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
