import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { Menu, LayoutDashboard, Users, Grid3X3, Mail, MoreHorizontal } from 'lucide-react';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-dvh bg-gray-50">
      <CommandPalette />
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200/80">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex size-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors active:scale-90"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
        <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-xs">P</div>
        <span className="text-sm font-display font-bold text-gray-900">Phera</span>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full shadow-xl animate-slide-in-left">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main ref={mainRef} className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200/80" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 py-1.5">
          <MobileNavItem to="/dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavItem to="/guests" icon={Users} label="Guests" />
          <MobileNavItem to="/seating" icon={Grid3X3} label="Seating" />
          <MobileNavItem to="/rsvp" icon={Mail} label="RSVPs" />
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="More navigation options"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-gray-400 active:scale-90 transition-all"
          >
            <MoreHorizontal size={20} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-90 ${
          isActive
            ? 'text-wine-700 bg-wine-50'
            : 'text-gray-400 hover:text-gray-600'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.75} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
