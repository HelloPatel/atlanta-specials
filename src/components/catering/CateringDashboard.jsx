import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { Button, Card, Badge } from '../ui';
import { guestInvitedToEvent } from '../../utils/eventInvites';
import {
  UtensilsCrossed, Download, AlertTriangle, Baby, Users, Salad, Leaf, Drumstick,
  Sparkles, HelpCircle, Copy, Check,
} from 'lucide-react';

// Visual identity for each dietary type — colour + icon so the caterer can scan
// the breakdown quickly. Keys match DIETARY_OPTIONS `value`.
const DIET_META = {
  vegetarian: { label: 'Vegetarian', color: 'bg-green-500', text: 'text-green-700', soft: 'bg-green-50', icon: Salad },
  vegan:      { label: 'Vegan',      color: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50', icon: Leaf },
  'non-veg':  { label: 'Non-Veg',    color: 'bg-rose-500', text: 'text-rose-700', soft: 'bg-rose-50', icon: Drumstick },
  jain:       { label: 'Jain',       color: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-50', icon: Sparkles },
  other:      { label: 'Other',      color: 'bg-slate-400', text: 'text-slate-700', soft: 'bg-slate-50', icon: HelpCircle },
  unspecified:{ label: 'Not set',    color: 'bg-gray-300', text: 'text-gray-600', soft: 'bg-gray-50', icon: HelpCircle },
};

const DIET_ORDER = ['vegetarian', 'non-veg', 'jain', 'vegan', 'other', 'unspecified'];

const dietKey = (guest) => {
  const d = (guest?.dietary || '').trim();
  return DIET_META[d] ? d : (d ? 'other' : 'unspecified');
};

const isKid = (guest) => (guest?.tags || []).some((t) => String(t).toLowerCase() === 'kids');

// Heads a guest brings to an event they've accepted: themselves + a plus-one if
// they have one. Plus-ones inherit the primary guest's dietary (we don't collect
// a separate diet for them), which keeps totals aligned with RSVP + seating.
const headsFor = (guest) => 1 + (guest?.plusOne ? 1 : 0);

/**
 * Build catering counts for a set of attending guests.
 * Returns { total, byDiet: {key: count}, kids, plusOnes, notes: [...] }
 */
function tallyGuests(attendees) {
  const byDiet = {};
  let total = 0;
  let kids = 0;
  let plusOnes = 0;
  const notes = [];

  attendees.forEach((g) => {
    const heads = headsFor(g);
    const key = dietKey(g);
    byDiet[key] = (byDiet[key] || 0) + heads;
    total += heads;
    if (g.plusOne) plusOnes += 1;
    if (isKid(g)) kids += 1;
    const note = (g.dietaryNotes || '').trim();
    if (note) {
      notes.push({
        name: `${g.firstName || ''} ${g.lastName || ''}`.trim() || g.familyName || 'Guest',
        diet: key,
        note,
      });
    }
  });

  return { total, byDiet, kids, plusOnes, notes };
}

export default function CateringDashboard() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [events],
  );

  // Attendees for the currently-selected scope.
  const attendees = useMemo(() => {
    if (selectedEvent === 'all') {
      // Anyone attending at least one event — de-duplicated headcount for a
      // rough overall total. Per-event is the accurate planning view below.
      return guests.filter((g) =>
        Object.values(g.rsvpStatus || {}).some((s) => s === 'accepted'),
      );
    }
    const evt = events.find((e) => e.id === selectedEvent);
    if (!evt) return [];
    return guests.filter(
      (g) => guestInvitedToEvent(evt, g.id) && (g.rsvpStatus || {})[selectedEvent] === 'accepted',
    );
  }, [guests, events, selectedEvent]);

  const summary = useMemo(() => tallyGuests(attendees), [attendees]);

  // Per-event matrix (event × diet) for the caterer handoff.
  const perEvent = useMemo(() => {
    return orderedEvents.map((evt) => {
      const evtAttendees = guests.filter(
        (g) => guestInvitedToEvent(evt, g.id) && (g.rsvpStatus || {})[evt.id] === 'accepted',
      );
      return { event: evt, ...tallyGuests(evtAttendees) };
    });
  }, [orderedEvents, guests]);

  const dietRows = DIET_ORDER
    .map((key) => ({ key, count: summary.byDiet[key] || 0, meta: DIET_META[key] }))
    .filter((r) => r.count > 0);

  const scopeLabel = selectedEvent === 'all'
    ? 'All events'
    : (events.find((e) => e.id === selectedEvent)?.name || 'Event');

  const showUnspecifiedCol = perEvent.some((p) => p.byDiet.unspecified);
  const matrixDiets = DIET_ORDER.filter((k) => k !== 'unspecified' || showUnspecifiedCol);

  // Build a plain-text caterer summary that's easy to paste into WhatsApp/email.
  const buildText = () => {
    const lines = [];
    lines.push(`${activeWedding?.coupleName1 || ''} & ${activeWedding?.coupleName2 || ''} — Catering counts`.trim());
    lines.push('');
    perEvent.forEach(({ event, total, byDiet, kids }) => {
      if (total === 0) return;
      const parts = DIET_ORDER
        .filter((k) => byDiet[k])
        .map((k) => `${DIET_META[k].label} ${byDiet[k]}`);
      lines.push(`${event.name}: ${total} meals (${parts.join(', ')})${kids ? ` — incl. ${kids} kids` : ''}`);
    });
    const allNotes = perEvent.flatMap((p) => p.notes);
    const uniqueNotes = [...new Map(allNotes.map((n) => [`${n.name}|${n.note}`, n])).values()];
    if (uniqueNotes.length) {
      lines.push('');
      lines.push('Allergies / special requests:');
      uniqueNotes.forEach((n) => lines.push(`- ${n.name}: ${n.note}`));
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — fall back to CSV download instead.
      handleCsv();
    }
  };

  const handleCsv = () => {
    const header = ['Event', 'Total meals', ...DIET_ORDER.map((k) => DIET_META[k].label), 'Kids', 'Plus-ones'];
    const rows = perEvent
      .filter((p) => p.total > 0)
      .map((p) => [
        p.event.name,
        p.total,
        ...DIET_ORDER.map((k) => p.byDiet[k] || 0),
        p.kids,
        p.plusOnes,
      ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catering-counts-${activeWedding?.id || 'wedding'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = guests.length > 0 && events.length > 0;

  if (!hasData) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-wine-50">
            <UtensilsCrossed size={26} className="text-wine-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Meal counts will appear here</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add your events and guests (with dietary preferences), then open RSVPs.
            As guests accept, we'll total up veg, non-veg, Jain and vegan meals per event for your caterer.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope selector + export actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEvent('all')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              selectedEvent === 'all' ? 'bg-wine-700 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            All events
          </button>
          {orderedEvents.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setSelectedEvent(evt.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedEvent === evt.id ? 'bg-wine-700 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {evt.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy for caterer'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCsv}>
            <Download size={16} /> CSV
          </Button>
        </div>
      </div>

      {/* Headline total */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={UtensilsCrossed} label={`Meals — ${scopeLabel}`} value={summary.total} accent="wine" />
        <StatTile icon={Baby} label="Kids" value={summary.kids} accent="amber" />
        <StatTile icon={Users} label="Plus-ones" value={summary.plusOnes} accent="blue" />
        <StatTile icon={AlertTriangle} label="Allergy notes" value={summary.notes.length} accent="rose" />
      </div>

      {/* Dietary breakdown for the selected scope */}
      <Card title={`Meal breakdown — ${scopeLabel}`}>
        {dietRows.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">No accepted RSVPs yet for this scope.</p>
        ) : (
          <div className="space-y-4">
            {/* Proportion bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              {dietRows.map(({ key, count, meta }) => (
                <div
                  key={key}
                  className={meta.color}
                  style={{ width: `${(count / summary.total) * 100}%` }}
                  title={`${meta.label}: ${count}`}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dietRows.map(({ key, count, meta }) => {
                const Icon = meta.icon;
                const pct = Math.round((count / summary.total) * 100);
                return (
                  <div key={key} className={`flex items-center gap-3 rounded-xl p-3 ${meta.soft}`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.color} bg-opacity-15`}>
                      <Icon size={20} className={meta.text} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">{meta.label}</p>
                      <p className="text-xs text-gray-500">{pct}% of meals</p>
                    </div>
                    <p className={`text-2xl font-bold ${meta.text}`}>{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Per-event matrix — the actual caterer handoff */}
      <Card title="Per-event meal counts">
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-4 font-medium">Event</th>
                {matrixDiets.map((k) => (
                  <th key={k} className="px-2 py-2 text-center font-medium">{DIET_META[k].label}</th>
                ))}
                <th className="px-2 py-2 text-center font-medium">Kids</th>
                <th className="pl-2 py-2 text-right font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {perEvent.map(({ event, total, byDiet, kids }) => (
                <tr key={event.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-gray-800">{event.name}</td>
                  {matrixDiets.map((k) => (
                    <td key={k} className="px-2 py-2.5 text-center text-gray-600">
                      {byDiet[k] ? byDiet[k] : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center text-gray-600">
                    {kids ? kids : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="pl-2 py-2.5 text-right font-bold text-wine-700">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Counts reflect guests who accepted each event, including plus-ones. Plus-ones use the primary guest's dietary.
        </p>
      </Card>

      {/* Allergies & special requests */}
      {summary.notes.length > 0 && (
        <Card title={`Allergies & special requests — ${scopeLabel}`}>
          <div className="space-y-2">
            {summary.notes.map((n, i) => {
              const meta = DIET_META[n.diet] || DIET_META.other;
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{n.name}</span>
                      <Badge variant="warning">{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{n.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, accent = 'wine' }) {
  const accents = {
    wine: 'from-wine-50 to-phera-50 text-wine-700',
    amber: 'from-amber-50 to-orange-50 text-amber-600',
    blue: 'from-blue-50 to-sky-50 text-blue-600',
    rose: 'from-rose-50 to-pink-50 text-rose-600',
  };
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${accents[accent]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
