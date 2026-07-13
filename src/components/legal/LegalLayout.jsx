import { Link } from 'react-router-dom';
import { APP_NAME, LEGAL_VERSION } from '../../config/constants';
import LegalFooter from './LegalFooter';

export default function LegalLayout({ title, summary, children }) {
  return (
    <div className="min-h-dvh bg-[#faf9f7] text-gray-800">
      <a href="#legal-content" className="skip-link">Skip to legal content</a>
      <header className="border-b border-gray-200/70 bg-white/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600">
            <span className="flex size-9 items-center justify-center rounded-xl bg-wine-800 font-display font-bold text-white">P</span>
            <span className="font-display text-lg font-bold text-gray-900">{APP_NAME}</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-wine-700 hover:text-wine-900">Back to home</Link>
        </div>
      </header>

      <main id="legal-content" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 border-b border-gray-200 pb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-wine-700">Legal</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{summary}</p>
          <p className="mt-4 text-xs text-gray-500">Effective and last updated: {LEGAL_VERSION}</p>
        </div>

        <article className="legal-copy">
          {children}
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
