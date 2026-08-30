import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Grid3X3,
  Mail,
  Camera,
  Trophy,
  Globe,
  Printer,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWedding } from '../../contexts/WeddingContext';
import { APP_NAME } from '../../config/constants';

export const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', feature: 'dashboard' },
  { to: '/guests', icon: Users, label: 'Guest List', feature: 'guests' },
  { to: '/events', icon: Calendar, label: 'Events', feature: 'events' },
  { to: '/seating', icon: Grid3X3, label: 'Seating', feature: 'seating' },
  { to: '/rsvp', icon: Mail, label: 'RSVPs', feature: 'rsvp' },
  { to: '/print', icon: Printer, label: 'Print', feature: 'print' },
  { to: '/photos', icon: Camera, label: 'Photo Groups', feature: 'photos' },
  { to: '/bets', icon: Trophy, label: 'Games', feature: 'bets' },
  { to: '/website', icon: Globe, label: 'Website', feature: 'website' },
];

export default function Sidebar({ onNavigate, mobile = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const { activeWedding, canViewFeature, allowedFeatures } = useWedding();
  const navigate = useNavigate();
  const visibleNavItems = NAV_ITEMS.filter((item) => canViewFeature(item.feature));
  const homePath = `/${allowedFeatures?.[0] || 'dashboard'}`;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      aria-label="Wedding planning navigation"
      className={`flex h-full flex-col border-r border-gray-200/80 bg-white transition-[width] duration-200 ${
        mobile ? 'w-[min(20rem,88vw)]' : collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo → home (dashboard) */}
      <NavLink
        to={homePath}
        onClick={onNavigate}
        aria-label={`${APP_NAME} home`}
        className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wine-600"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-wine-700 to-wine-900 text-white font-display font-bold text-sm shadow-sm">
          P
        </div>
        {!collapsed && <span className="text-lg font-display font-bold text-gray-900 tracking-tight">{APP_NAME}</span>}
      </NavLink>

      {/* Wedding name */}
      {!collapsed && activeWedding && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Planning</p>
          <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">
            {activeWedding.coupleName1} & {activeWedding.coupleName2}
          </p>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600 focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-wine-50 text-wine-800 shadow-sm ring-1 ring-wine-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-2 space-y-1">
        {!collapsed && !mobile && (
          <div className="flex items-center justify-center gap-3 px-2 pb-1 text-[10px] text-gray-400">
            <NavLink to="/privacy" className="hover:text-wine-700">Privacy</NavLink>
            <NavLink to="/terms" className="hover:text-wine-700">Terms</NavLink>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign out</span>}
        </button>
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
            className="flex min-h-10 w-full items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine-600"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>
    </aside>
  );
}
