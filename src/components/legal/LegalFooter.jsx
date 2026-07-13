import { Link } from 'react-router-dom';
import { APP_NAME } from '../../config/constants';

export default function LegalFooter({ compact = false, className = '' }) {
  return (
    <footer className={`border-t border-gray-200/70 bg-white/70 ${compact ? 'px-4 py-4' : 'px-6 py-8'} ${className}`}>
      <div className={`mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500 ${compact ? '' : 'sm:justify-between'}`}>
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <nav aria-label="Legal">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link className="hover:text-wine-700" to="/privacy">Privacy</Link>
            <Link className="hover:text-wine-700" to="/terms">Terms</Link>
            <Link className="hover:text-wine-700" to="/cookies">Cookies</Link>
            <Link className="hover:text-wine-700" to="/copyright">Copyright</Link>
            <Link className="hover:text-wine-700" to="/accessibility">Accessibility</Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}
