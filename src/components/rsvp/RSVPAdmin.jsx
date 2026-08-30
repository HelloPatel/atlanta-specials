import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests, updateGuest } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import {
  saveRsvpSettings,
  subscribeToRsvpSettings,
  subscribeToResponses,
  getRsvpLink,
  getWhatsAppRsvpLink,
  getHouseholdRsvpLink,
} from '../../services/rsvpService';
import { Button, Modal, Input, Badge, Card } from '../ui';
import { RSVP_STATUS, DIETARY_OPTIONS } from '../../config/constants';
import { guestInvitedToEvent } from '../../utils/eventInvites';
import {
  Copy, ExternalLink, Share2, Check, X, Clock, Users, Mail,
  MessageCircle, Link2, ChevronDown, Filter, Download, Eye, EyeOff,
} from 'lucide-react';

export default function RSVPAdmin() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [responses, setResponses] = useState([]);
  const [rsvpSettings, setRsvpSettings] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    const unsub3 = subscribeToRsvpSettings(activeWedding.id, setRsvpSettings);
    const unsub4 = subscribeToResponses(activeWedding.id, setResponses);
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [activeWedding]);

  // Compute RSVP stats. For a specific event, only count guests actually
  // invited to that event so non-invited guests don't inflate "No Response".
  const stats = useMemo(() => {
    const scoped = selectedEvent === 'all'
      ? guests
      : guests.filter((g) => guestInvitedToEvent(events.find((e) => e.id === selectedEvent), g.id));
    const result = { total: scoped.length, accepted: 0, declined: 0, pending: 0, noResponse: 0, notSeen: 0 };

    scoped.forEach((g) => {
      const rsvp = g.rsvpStatus || {};
      if (!g.rsvpViewedAt) result.notSeen++;
      if (selectedEvent === 'all') {
        // Overall: accepted if accepted to ANY event
        const statuses = Object.values(rsvp);
        if (statuses.length === 0) result.noResponse++;
        else if (statuses.includes('accepted')) result.accepted++;
        else if (statuses.every((s) => s === 'declined')) result.declined++;
        else result.pending++;
      } else {
        const s = rsvp[selectedEvent];
        if (!s) result.noResponse++;
        else if (s === 'accepted') result.accepted++;
        else if (s === 'declined') result.declined++;
        else result.pending++;
      }
    });
    return result;
  }, [guests, events, selectedEvent]);

  // Filter guests
  const filteredGuests = useMemo(() => {
    const selectedEventObj = selectedEvent === 'all' ? null : events.find((e) => e.id === selectedEvent);
    return guests.filter((g) => {
      // When viewing a single event, only show guests invited to it — a
      // non-invited guest has no RSVP to manage there.
      if (selectedEventObj && !guestInvitedToEvent(selectedEventObj, g.id)) return false;

      // Search
      if (search) {
        const name = `${g.firstName} ${g.lastName} ${g.familyName}`.toLowerCase();
        if (!name.includes(search.toLowerCase())) return false;
      }

      // Status filter
      if (filterStatus === 'not-seen') {
        if (g.rsvpViewedAt) return false;
      } else if (filterStatus !== 'all') {
        const rsvp = g.rsvpStatus || {};
        const status = selectedEvent === 'all'
          ? (Object.values(rsvp).length === 0 ? 'none' : Object.values(rsvp).includes('accepted') ? 'accepted' : Object.values(rsvp).every((s) => s === 'declined') ? 'declined' : 'pending')
          : (rsvp[selectedEvent] || 'none');
        if (filterStatus === 'no-response' && status !== 'none') return false;
        if (filterStatus !== 'no-response' && status !== filterStatus) return false;
      }

      return true;
    });
  }, [guests, events, search, filterStatus, selectedEvent]);

  // Update a guest's RSVP for an event (admin-entered = source "manual")
  const handleSetRsvp = async (guestId, eventId, status) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    const rsvpStatus = { ...(guest.rsvpStatus || {}), [eventId]: status };
    await updateGuest(activeWedding.id, guestId, {
      rsvpStatus,
      rsvpMethod: 'manual',
      rsvpUpdatedAt: Date.now(),
    });
  };

  // Bulk set RSVP for all INVITED events (admin-entered = source "manual")
  const handleBulkRsvp = async (guestId, status) => {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    const rsvpStatus = { ...(guest.rsvpStatus || {}) };
    events.forEach((evt) => {
      if (guestInvitedToEvent(evt, guestId)) rsvpStatus[evt.id] = status;
    });
    await updateGuest(activeWedding.id, guestId, {
      rsvpStatus,
      rsvpMethod: 'manual',
      rsvpUpdatedAt: Date.now(),
    });
  };

  // Toggle RSVP open/closed
  const handleToggleRsvp = async () => {
    const isOpen = rsvpSettings?.isOpen || false;
    await saveRsvpSettings(activeWedding.id, {
      isOpen: !isOpen,
      deadline: rsvpSettings?.deadline || '',
      allowPlusOne: rsvpSettings?.allowPlusOne ?? true,
      allowDietary: rsvpSettings?.allowDietary ?? true,
      allowMessage: rsvpSettings?.allowMessage ?? true,
      requirePhone: rsvpSettings?.requirePhone ?? false,
      familyRsvp: rsvpSettings?.familyRsvp ?? true,
    });
  };

  // Copy RSVP link
  const handleCopyLink = async () => {
    const link = getRsvpLink(activeWedding.id, activeWedding.slug);
    try {
      await navigator.clipboard?.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (insecure context / older browser) — ignore.
    }
  };

  const rsvpLink = activeWedding ? getRsvpLink(activeWedding.id, activeWedding.slug) : '';
  const coupleLabel = activeWedding
    ? (activeWedding.coupleName ||
       [activeWedding.coupleName1, activeWedding.coupleName2].filter(Boolean).join(' & ') ||
       'Our')
    : 'Our';
  const whatsappLink = activeWedding
    ? getWhatsAppRsvpLink(activeWedding.id, coupleLabel, activeWedding.slug)
    : '';

  // ─── Buffer-aware headcount ────────────────────────────────────────────────
  // Weddings rarely hit exact confirmed numbers. Show a planning headcount that
  // adds a configurable buffer % on top of confirmed acceptances.
  const bufferPct = Number.isFinite(rsvpSettings?.headcountBufferPct)
    ? rsvpSettings.headcountBufferPct
    : 10;
  const planHeadcount = Math.ceil(stats.accepted * (1 + bufferPct / 100));

  // ─── CSV exports ───────────────────────────────────────────────────────────
  const downloadCSV = (filename, header, rows) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Per-caterer dietary breakdown for the selected event (or all events).
  const exportDietaryCSV = () => {
    const evts = selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent);
    const header = ['Event', 'Dietary', 'Confirmed guests'];
    const rows = [];
    evts.forEach((evt) => {
      const counts = {};
      guests.forEach((g) => {
        if ((g.rsvpStatus || {})[evt.id] !== 'accepted') return;
        const diet = (g.dietary || 'vegetarian').toLowerCase();
        counts[diet] = (counts[diet] || 0) + 1;
      });
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([diet, n]) => rows.push([evt.name, diet, n]));
      if (Object.keys(counts).length === 0) rows.push([evt.name, '(no confirmed guests)', 0]);
    });
    downloadCSV(`dietary-by-event.csv`, header, rows);
  };

  // Timestamped RSVP integrity log: every guest's status + source, for records.
  const exportResponsesCSV = () => {
    const header = ['Guest', 'Family', 'Side', 'Phone', 'Email', 'Event', 'Status', 'Dietary', 'Source'];
    const rows = [];
    guests.forEach((g) => {
      const status = g.rsvpStatus || {};
      const evts = events.filter((e) => e.inviteAll || (e.guestIds || []).includes(g.id));
      const list = evts.length ? evts : events;
      list.forEach((evt) => {
        rows.push([
          `${g.firstName} ${g.lastName}`.trim(),
          g.familyName || '',
          g.side || '',
          g.phone || '',
          g.email || '',
          evt.name,
          status[evt.id] || 'no-response',
          g.dietary || '',
          g.rsvpMethod || (status[evt.id] ? 'web' : ''),
        ]);
      });
    });
    downloadCSV('rsvp-log.csv', header, rows);
  };

  const isOpen = rsvpSettings?.isOpen || false;

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatCard label="Total" count={stats.total} color="gray" icon={Users} />
        <StatCard label="Accepted" count={stats.accepted} color="green" icon={Check} />
        <StatCard label="Declined" count={stats.declined} color="red" icon={X} />
        <div className="hidden md:contents">
          <StatCard label="Pending" count={stats.pending} color="amber" icon={Clock} />
          <StatCard label="No Response" count={stats.noResponse} color="gray" icon={Mail} />
          <StatCard label="Not Seen" count={stats.notSeen} color="amber" icon={EyeOff} />
        </div>
      </div>

      {/* Actions row — Export on the left, controls + plan-for on the right */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative group">
          <Button
            variant="outline"
            size="sm"
            aria-label="Export RSVP data"
            aria-expanded={showExport}
            aria-haspopup="menu"
            onClick={() => setShowExport((open) => !open)}
          >
            <Download size={14} /><span className="hidden md:inline">Export</span>
          </Button>
          <div
            role="menu"
            className={`absolute left-0 mt-1 w-52 rounded-lg border border-gray-200 bg-white shadow-lg transition-all z-20 ${
              showExport
                ? 'visible opacity-100'
                : 'invisible opacity-0 md:group-hover:visible md:group-hover:opacity-100'
            }`}
          >
            <button role="menuitem" onClick={() => { exportResponsesCSV(); setShowExport(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
              RSVP log (CSV)
            </button>
            <button role="menuitem" onClick={() => { exportDietaryCSV(); setShowExport(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg">
              Dietary by event (CSV)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <Button
            variant={isOpen ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleRsvp}
          >
            {isOpen ? 'RSVPs Open' : 'RSVPs Closed'}
          </Button>

          <Button aria-label="Share RSVP link" variant="outline" size="sm" onClick={() => setShowShare(true)}>
            <Share2 size={14} /><span className="hidden md:inline">Share Link</span>
          </Button>

          <Button aria-label="RSVP settings" variant="outline" size="sm" onClick={() => setShowSettings(true)}>
            <span className="hidden md:inline">Settings</span>
            <span className="md:hidden">Set</span>
          </Button>

          {stats.accepted > 0 && (
            <div
              className="flex items-center gap-1.5 rounded-lg bg-wine-50 border border-wine-100 px-3 py-1.5 text-xs"
              title={`Confirmed ${stats.accepted} + ${bufferPct}% planning buffer`}
            >
              <span className="text-wine-700 font-semibold">Plan for ~{planHeadcount}</span>
              <span className="hidden lg:inline text-wine-400">({stats.accepted} confirmed +{bufferPct}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search guests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-base pl-9 focus:border-wine-600 focus:ring-1 focus:ring-wine-600 sm:text-sm"
          />
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <label htmlFor="rsvp-event-filter" className="sr-only">Event filter</label>
        <select
          id="rsvp-event-filter"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        >
          <option value="all">All Events</option>
          {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
        </select>

        <label htmlFor="rsvp-status-filter" className="sr-only">Status filter</label>
        <select
          id="rsvp-status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
          <option value="no-response">No Response</option>
          <option value="not-seen">Not seen invite</option>
        </select>
      </div>

      {/* Guest RSVP — table on desktop, cards on mobile */}
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Family</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Side</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Seen</th>
                {(selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent)).map((evt) => (
                  <th key={evt.id} className="text-center px-3 py-3 font-medium text-gray-600 min-w-[100px]">
                    {evt.name}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-600">Quick</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{guest.firstName} {guest.lastName}</div>
                    {guest.phone && <div className="text-xs text-gray-400">{guest.phone}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{guest.familyName || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium ${guest.side === 'bride' ? 'text-wine-700' : 'text-blue-600'}`}>
                      {guest.side === 'bride' ? 'Bride' : 'Groom'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <ViewedBadge guest={guest} />
                  </td>
                  {(selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent)).map((evt) => {
                    const status = (guest.rsvpStatus || {})[evt.id];
                    const invited = guestInvitedToEvent(evt, guest.id);
                    return (
                      <td key={evt.id} className="text-center px-3 py-2.5">
                        {invited ? (
                          <RsvpToggle
                            status={status}
                            onChange={(s) => handleSetRsvp(guest.id, evt.id, s)}
                          />
                        ) : (
                          <div className="relative inline-flex flex-col items-center" title="Not invited to this event">
                            <RsvpToggle disabled />
                            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-300">Not invited</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleBulkRsvp(guest.id, 'accepted')}
                        className="p-1 rounded hover:bg-green-50 text-green-600"
                        title="Accept all"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleBulkRsvp(guest.id, 'declined')}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                        title="Decline all"
                      >
                        <X size={14} />
                      </button>
                      <HouseholdShare wedding={activeWedding} guest={guest} coupleLabel={coupleLabel} />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={99} className="text-center py-8 text-gray-400">
                    {guests.length === 0 ? 'Add guests first to manage RSVPs' : 'No guests match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {filteredGuests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">
            {guests.length === 0 ? 'Add guests first to manage RSVPs' : 'No guests match your filters'}
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <div key={guest.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{guest.firstName} {guest.lastName}</p>
                  <p className="text-xs text-gray-500">{guest.familyName || 'No family'} · <span className="capitalize">{guest.side}</span></p>
                  <div className="mt-1"><ViewedBadge guest={guest} /></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleBulkRsvp(guest.id, 'accepted')} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Accept all">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleBulkRsvp(guest.id, 'declined')} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Decline all">
                    <X size={16} />
                  </button>
                  <HouseholdShare wedding={activeWedding} guest={guest} coupleLabel={coupleLabel} />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedEvent === 'all' ? events : events.filter((e) => e.id === selectedEvent)).map((evt) => {
                  const status = (guest.rsvpStatus || {})[evt.id];
                  const invited = guestInvitedToEvent(evt, guest.id);
                  if (!invited) {
                    return (
                      <span
                        key={evt.id}
                        className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-300 blur-[1px] opacity-60 select-none"
                        title="Not invited to this event"
                      >
                        {evt.name}: Not invited
                      </span>
                    );
                  }
                  return (
                    <button
                      key={evt.id}
                      onClick={() => {
                        const next = status === 'accepted' ? 'declined' : status === 'declined' ? null : 'accepted';
                        handleSetRsvp(guest.id, evt.id, next);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        status === 'accepted' ? 'bg-green-100 text-green-700' :
                        status === 'declined' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {evt.name}: {status === 'accepted' ? 'Yes' : status === 'declined' ? 'No' : '—'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent responses */}
      {responses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Responses</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {responses
              .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
              .slice(0, 20)
              .map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-xs px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800">{r.respondentName}</span>
                  <span className="text-gray-400">via {r.method}</span>
                  {r.message && <span className="text-gray-500 truncate flex-1">"{r.message}"</span>}
                  <span className="text-gray-300">
                    {r.submittedAt?.seconds
                      ? new Date(r.submittedAt.seconds * 1000).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Share modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Share RSVP Link" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this link with your guests. They can RSVP without creating an account.
          </p>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              aria-label="RSVP link"
              readOnly
              value={rsvpLink}
              className="min-w-0 flex-1 bg-transparent text-base text-gray-700 outline-none sm:text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageCircle size={16} /> Share via WhatsApp
            </a>
            <a
              href={rsvpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ExternalLink size={16} /> Preview RSVP Page
            </a>
          </div>

          {/* Reminder templates */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">WhatsApp Reminder Templates</p>
            <div className="space-y-2">
              <ReminderTemplate
                label="Gentle Reminder"
                message={`Namaste! Just a gentle reminder to RSVP for ${activeWedding.coupleName1} & ${activeWedding.coupleName2}'s wedding. It helps us plan seating and food, and takes about 30 seconds:\n${rsvpLink}`}
              />
              <ReminderTemplate
                label="Final Call"
                message={`Last call! We're finalizing the guest list for the wedding. If you haven't RSVP'd yet, please do so today:\n${rsvpLink}\nThank you!`}
              />
              <ReminderTemplate
                label="Family Group"
                message={`Hi family! Please RSVP for ${activeWedding.coupleName1} & ${activeWedding.coupleName2}'s wedding when you get a chance. One person can RSVP for the whole family:\n${rsvpLink}`}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Settings modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="RSVP Settings" size="md">
        <RsvpSettingsForm
          settings={rsvpSettings}
          onSave={async (s) => {
            await saveRsvpSettings(activeWedding.id, s);
            setShowSettings(false);
          }}
        />
      </Modal>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function fmtTimeAgo(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : (ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
  if (isNaN(d?.getTime?.())) return '';
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ViewedBadge({ guest, compact = false }) {
  const viewed = !!guest.rsvpViewedAt;
  if (viewed) {
    const ago = fmtTimeAgo(guest.rsvpViewedAt);
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium text-green-600"
        title={ago ? `Opened their invitation ${ago}` : 'Opened their invitation'}
      >
        <Eye size={13} />
        {!compact && <span>Seen{ago ? ` · ${ago}` : ''}</span>}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-amber-500"
      title="Hasn't opened their invitation yet — a reminder could help"
    >
      <EyeOff size={13} />
      {!compact && <span>Not seen</span>}
    </span>
  );
}

function StatCard({ label, count, color, icon: Icon }) {
  const colors = {
    gray: 'bg-gray-50 text-gray-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${colors[color]}`}>
      <Icon size={14} />
      <span className="text-lg font-bold">{count}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

function RsvpToggle({ status, onChange, disabled = false }) {
  const options = [
    { value: 'accepted', label: '✓', bg: 'bg-green-500 text-white', hover: 'hover:bg-green-100' },
    { value: 'pending', label: '?', bg: 'bg-amber-500 text-white', hover: 'hover:bg-amber-100' },
    { value: 'declined', label: '✗', bg: 'bg-red-500 text-white', hover: 'hover:bg-red-100' },
  ];

  if (disabled) {
    return (
      <div className="inline-flex rounded-full border border-gray-200 overflow-hidden opacity-40 blur-[1.5px] pointer-events-none select-none" aria-hidden="true">
        {options.map((opt) => (
          <span key={opt.value} className="w-7 h-7 flex items-center justify-center text-xs font-bold bg-white text-gray-300">
            {opt.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-full border border-gray-200 overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-7 h-7 text-xs font-bold transition-colors ${
            status === opt.value ? opt.bg : `bg-white text-gray-300 ${opt.hover}`
          }`}
          title={opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function RsvpSettingsForm({ settings, onSave }) {
  const [form, setForm] = useState({
    isOpen: settings?.isOpen || false,
    deadline: settings?.deadline || '',
    allowPlusOne: settings?.allowPlusOne ?? true,
    allowDietary: settings?.allowDietary ?? true,
    allowMessage: settings?.allowMessage ?? true,
    requirePhone: settings?.requirePhone ?? false,
    familyRsvp: settings?.familyRsvp ?? true,
    customMessage: settings?.customMessage || '',
    rsvpPassword: settings?.rsvpPassword || '',
    headcountBufferPct: Number.isFinite(settings?.headcountBufferPct) ? settings.headcountBufferPct : 10,
  });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={form.isOpen}
          onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
          className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
        />
        <span className="text-sm font-medium">RSVPs are open</span>
      </label>

      <div>
        <label htmlFor="rsvp-deadline" className="block text-sm font-medium text-gray-700 mb-1">RSVP Deadline</label>
        <input
          id="rsvp-deadline"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="rsvp-planning-buffer" className="block text-sm font-medium text-gray-700 mb-1">Planning buffer (%)</label>
        <input
          id="rsvp-planning-buffer"
          type="number"
          min={0}
          max={50}
          value={form.headcountBufferPct}
          onChange={(e) => setForm({ ...form, headcountBufferPct: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Extra headcount added on top of confirmed guests for catering and seating (walk-ins, late yeses). Shown as "Plan for ~N".</p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.familyRsvp}
            onChange={(e) => setForm({ ...form, familyRsvp: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <div>
            <span className="text-sm font-medium">Family Group RSVP</span>
            <p className="text-xs text-gray-400">One person can RSVP for the whole family</p>
          </div>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowPlusOne}
            onChange={(e) => setForm({ ...form, allowPlusOne: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Allow plus-ones</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowDietary}
            onChange={(e) => setForm({ ...form, allowDietary: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Ask dietary preferences</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.allowMessage}
            onChange={(e) => setForm({ ...form, allowMessage: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Allow guest messages</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.requirePhone}
            onChange={(e) => setForm({ ...form, requirePhone: e.target.checked })}
            className="rounded border-gray-300 text-wine-700 focus:ring-wine-600"
          />
          <span className="text-sm font-medium">Require phone number</span>
        </label>
      </div>

      <div>
        <label htmlFor="rsvp-custom-message" className="block text-sm font-medium text-gray-700 mb-1">Custom Welcome Message</label>
        <textarea
          id="rsvp-custom-message"
          value={form.customMessage}
          onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
          placeholder="We'd love for you to join us..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="rsvp-password" className="block text-sm font-medium text-gray-700 mb-1">RSVP Password (optional)</label>
        <input
          id="rsvp-password"
          type="text"
          value={form.rsvpPassword}
          onChange={(e) => setForm({ ...form, rsvpPassword: e.target.value })}
          placeholder="Leave blank for no password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">Guests must enter this password before they can RSVP. Share it in your invite.</p>
      </div>

      <Button onClick={() => onSave(form)} className="w-full">Save Settings</Button>
    </div>
  );
}

function HouseholdShare({ wedding, guest, coupleLabel }) {
  const [copied, setCopied] = useState(false);
  const link = getHouseholdRsvpLink(wedding.id, guest.id, wedding.slug);
  const waLink = getWhatsAppRsvpLink(wedding.id, coupleLabel, wedding.slug, {
    guestId: guest.id,
    firstName: guest.firstName,
    phone: guest.phone,
  });
  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1 rounded hover:bg-green-50 text-green-600"
        title="Send this household their personal RSVP link on WhatsApp"
      >
        <MessageCircle size={14} />
      </a>
      <button
        onClick={copy}
        className="p-1 rounded hover:bg-gray-100 text-gray-500"
        title="Copy this household's personal RSVP link"
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
      </button>
    </>
  );
}

function ReminderTemplate({ label, message }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — ignore.
    }
  };
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 bg-white hover:bg-gray-50 transition-colors">
      <span className="text-sm text-gray-700 flex-1 truncate">{label}</span>
      <button onClick={handleCopy} className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 text-gray-600">
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded border border-green-200 bg-green-50 hover:bg-green-100 text-green-700">
        Send
      </a>
    </div>
  );
}
