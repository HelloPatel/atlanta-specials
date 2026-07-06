import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { Menu, LayoutDashboard, Users, Grid3X3, Mail, MoreHorizontal } from 'lucide-react';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <CommandPalette />
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-700" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-xs">P</div>
        <span className="text-sm font-display font-bold text-gray-900">Phera</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full animate-fade-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          <MobileNavItem to="/dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavItem to="/guests" icon={Users} label="Guests" />
          <MobileNavItem to="/seating" icon={Grid3X3} label="Seating" />
          <MobileNavItem to="/rsvp" icon={Mail} label="RSVPs" />
          <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-1 text-gray-400">
            <MoreHorizontal size={20} />
            <span className="text-[10px]">More</span>
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
        `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? 'text-wine-700' : 'text-gray-400 hover:text-gray-600'}`
      }
    >
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
}
