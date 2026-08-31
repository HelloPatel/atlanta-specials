import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import CommandPalette from './CommandPalette';
import AssistantWidget from '../assistant/AssistantWidget';
import { Menu, LayoutDashboard, Users, Grid3X3, Mail, MoreHorizontal, X } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import { APP_NAME } from '../../config/constants';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);
  const mobileCloseRef = useRef(null);
  const { pathname } = useLocation();
  const { activeWedding, canViewFeature } = useWedding();
  const currentPage = NAV_ITEMS.find((item) => item.to === pathname)?.label || 'Wedding workspace';
  const mobileNavItems = NAV_ITEMS.filter((item) => canViewFeature(item.feature)).slice(0, 4);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
    setMobileOpen(false);
    document.title = `${currentPage} | ${APP_NAME}`;
  }, [currentPage, pathname]);

  return (
    <div className="flex h-dvh bg-[#faf9f7]">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <CommandPalette />
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex min-h-14 items-center gap-3 px-3 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="flex size-11 items-center justify-center rounded-xl hover:bg-gray-100 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{currentPage}</p>
          <p className="truncate text-[11px] text-gray-500">
            {activeWedding ? `${activeWedding.coupleName1} & ${activeWedding.coupleName2}` : APP_NAME}
          </p>
        </div>
      </header>

      {/* Mobile overlay sidebar */}
      <Dialog
        open={mobileOpen}
        onClose={setMobileOpen}
        initialFocus={mobileCloseRef}
        className="relative z-50 md:hidden"
      >
        <div className="fixed inset-0">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <Dialog.Panel className="relative h-full w-fit shadow-xl animate-slide-in-left">
            <Dialog.Title className="sr-only">Navigation menu</Dialog.Title>
            <button
              ref={mobileCloseRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
            >
              <X size={20} />
            </button>
            <Sidebar mobile onNavigate={() => setMobileOpen(false)} />
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar />
      </div>

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 overflow-x-hidden overflow-y-auto pt-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] outline-none md:pt-0 md:pb-0"
      >
        <div key={pathname} className="mx-auto max-w-7xl px-4 py-5 sm:px-5 md:px-6 md:py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="Primary mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-stretch px-1 py-1">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <MobileNavItem key={to} to={to} icon={Icon} label={label} />
          ))}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="More navigation options"
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-gray-500 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wine-600"
          >
            <MoreHorizontal size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Floating AI assistant */}
      <AssistantWidget />
    </div>
  );
}

function MobileNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wine-600 ${
          isActive
            ? 'text-wine-800 bg-wine-50'
            : 'text-gray-500 hover:text-gray-700'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.75} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
