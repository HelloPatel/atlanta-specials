import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Users, Calendar, Grid3X3, Mail, Camera, Trophy, Globe, Printer, User } from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard', keywords: 'home overview' },
  { id: 'guests', label: 'Go to Guest List', icon: Users, path: '/guests', keywords: 'people family import' },
  { id: 'events', label: 'Go to Events', icon: Calendar, path: '/events', keywords: 'mehndi sangeet ceremony reception' },
  { id: 'seating', label: 'Go to Seating Chart', icon: Grid3X3, path: '/seating', keywords: 'tables arrange drag drop' },
  { id: 'rsvp', label: 'Go to RSVPs', icon: Mail, path: '/rsvp', keywords: 'responses invitations' },
  { id: 'photos', label: 'Go to Photo Groups', icon: Camera, path: '/photos', keywords: 'photographer shots' },
  { id: 'games', label: 'Go to Games', icon: Trophy, path: '/bets', keywords: 'bets predictions leaderboard' },
  { id: 'website', label: 'Go to Website Builder', icon: Globe, path: '/website', keywords: 'public link' },
  { id: 'print', label: 'Go to Print & Export', icon: Printer, path: '/print', keywords: 'place cards pdf download' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [guests, setGuests] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { activeWedding } = useWedding();

  // Subscribe to guests for @ search
  useEffect(() => {
    if (!activeWedding) return;
    return subscribeToGuests(activeWedding.id, setGuests);
  }, [activeWedding]);

  // Ctrl+K / Cmd+K to open, ? for shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
      if (e.key === 'Escape') { setOpen(false); setShowShortcuts(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const isGuestSearch = query.startsWith('@');
  const guestQuery = isGuestSearch ? query.slice(1).toLowerCase().trim() : '';

  const filteredGuests = isGuestSearch && guestQuery
    ? guests.filter((g) => `${g.firstName} ${g.lastName}`.toLowerCase().includes(guestQuery)).slice(0, 8)
    : [];

  const filtered = isGuestSearch ? [] : COMMANDS.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.keywords.includes(q);
  });

  const allItems = [...filtered, ...filteredGuests.map((g) => ({ id: `guest-${g.id}`, label: `${g.firstName} ${g.lastName}`, icon: User, path: '/guests', keywords: '', isGuest: true }))];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (cmd) => {
    navigate(cmd.path);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      handleSelect(allItems[selectedIndex]);
    }
  };

  if (!open && !showShortcuts) return null;

  const commandPalette = open ? (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 border-b border-gray-100">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages... (@ for guests)"
            className="flex-1 py-3.5 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-medium text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">{isGuestSearch ? 'No guests found' : 'No results found'}</p>
          ) : (
            allItems.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${i === selectedIndex ? 'bg-wine-50 text-wine-800' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <Icon size={16} className={i === selectedIndex ? 'text-wine-600' : 'text-gray-400'} />
                  <span className="flex-1">{cmd.label}</span>
                  {cmd.isGuest && <span className="text-xs text-gray-400">Guest</span>}
                  {i === selectedIndex && <span className="text-xs text-wine-500">↵</span>}
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-4 text-[10px] text-gray-400">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
          <span className="ml-auto">? Shortcuts</span>
        </div>
      </div>
    </div>
  ) : null;

  const shortcutsModal = showShortcuts ? (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { keys: 'Ctrl+K', desc: 'Open command palette' },
            { keys: '?', desc: 'Show this help' },
            { keys: 'Ctrl+S', desc: 'Save seating chart' },
            { keys: 'Ctrl+Z', desc: 'Undo seating change' },
            { keys: 'Esc', desc: 'Close modals' },
          ].map(({ keys, desc }) => (
            <div key={keys} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{desc}</span>
              <kbd className="text-xs font-mono bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">{keys}</kbd>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <button onClick={() => setShowShortcuts(false)} className="text-xs text-gray-500 hover:text-gray-700">Press ? or Esc to close</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {commandPalette}
      {shortcutsModal}
    </>
  );
}
