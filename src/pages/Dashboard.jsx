import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { Button, Card, Modal, Input, SkeletonDashboard } from '../components/ui';
import { Plus, Users, Calendar, Grid3X3, Mail } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';
import { subscribeToGuests } from '../services/guestService';
import { subscribeToEvents } from '../services/eventService';
import { subscribeToRsvpSettings } from '../services/rsvpService';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import ActivityFeed from '../components/dashboard/ActivityFeed';

export default function Dashboard() {
  const { activeWedding, weddings, loading } = useWedding();
  const [showCreate, setShowCreate] = useState(false);
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    const unsub3 = subscribeToRsvpSettings(activeWedding.id, (settings) => {
      setRsvpOpen(settings?.isOpen || false);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [activeWedding]);

  const guestCount = guests.length;
  const eventCount = events.length;
  const seatedCount = guests.filter((g) => g.tableNumber != null).length;
  const rsvpRate = guestCount > 0
    ? Math.round(guests.filter((g) => {
        const statuses = Object.values(g.rsvpStatus || {});
        return statuses.some((s) => s === 'accepted' || s === 'declined');
      }).length / guestCount * 100)
    : 0;

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (!activeWedding) {
    return <CreateWeddingPrompt onOpen={() => setShowCreate(true)} showModal={showCreate} onClose={() => setShowCreate(false)} />;
  }

  const daysUntilWedding = activeWedding.weddingDate
    ? Math.ceil((new Date(activeWedding.weddingDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 sm:mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-900">
            {activeWedding.coupleName1} & {activeWedding.coupleName2}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Your wedding at a glance</p>
        </div>
        {daysUntilWedding !== null && daysUntilWedding > 0 && (
          <div className="text-right">
            <p className="text-2xl sm:text-3xl font-display font-bold text-wine-700">{daysUntilWedding}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">days to go</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <QuickStat icon={Users} label="Guests" value={guestCount} to="/guests" />
        <QuickStat icon={Calendar} label="Events" value={eventCount} to="/events" />
        <QuickStat icon={Grid3X3} label="Seated" value={seatedCount} to="/seating" />
        <QuickStat icon={Mail} label="RSVP Rate" value={`${rsvpRate}%`} to="/rsvp" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Jump to">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/guests')}>
              <Users size={18} /> Guest List
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/events')}>
              <Calendar size={18} /> Events
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/seating')}>
              <Grid3X3 size={18} /> Seating Chart
            </Button>
          </div>
        </Card>

        <Card title="Setup checklist">
          {(() => {
            const checks = [eventCount > 0, guestCount > 0, guestCount > 0 && events.some((e) => !e.inviteAll && (e.guestIds || []).length > 0), seatedCount > 0, rsvpOpen];
            const done = checks.filter(Boolean).length;
            const pct = Math.round((done / checks.length) * 100);
            return (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500">{done}/5</span>
                </div>
                {pct === 100 && <p className="text-sm text-green-600 font-medium mb-2">All done! You're ready to go. 🎉</p>}
              </>
            );
          })()}
          <div className="space-y-1">
            <ChecklistItem done={eventCount > 0} label="Add your events (Mehndi, Sangeet, Ceremony, etc.)" to="/events" />
            <ChecklistItem done={guestCount > 0} label="Import or add your guest list" to="/guests" />
            <ChecklistItem done={guestCount > 0 && events.some((e) => !e.inviteAll && (e.guestIds || []).length > 0)} label="Assign guests to events" to="/events" />
            <ChecklistItem done={seatedCount > 0} label="Arrange seating for at least one event" to="/seating" />
            <ChecklistItem done={rsvpOpen} label="Open RSVPs for guests" to="/rsvp" />
          </div>
        </Card>
      </div>

      {/* Activity feed */}
      {activeWedding && (
        <Card title="Recent Activity" className="mt-6">
          <ActivityFeed weddingId={activeWedding.id} />
        </Card>
      )}

      {/* Guest analytics — shows after guests are added */}
      {guestCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card title="Dietary Breakdown">
            <div className="space-y-2">
              {(() => {
                const dietary = {};
                guests.forEach((g) => {
                  const d = g.dietary || 'unspecified';
                  dietary[d] = (dietary[d] || 0) + 1;
                });
                return Object.entries(dietary).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-wine-500 rounded-full" style={{ width: `${(count / guestCount) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>

          <Card title="Side Split">
            <div className="space-y-2">
              {(() => {
                const bride = guests.filter((g) => g.side === 'bride').length;
                const groom = guests.filter((g) => g.side === 'groom').length;
                const other = guestCount - bride - groom;
                return [
                  { label: "Bride's side", count: bride, color: 'bg-pink-500' },
                  { label: "Groom's side", count: groom, color: 'bg-blue-500' },
                  ...(other > 0 ? [{ label: 'Unassigned', count: other, color: 'bg-gray-400' }] : []),
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / guestCount) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      )}

      {/* Family RSVP completion */}
      {guestCount > 0 && events.length > 0 && (
        <Card title="Family RSVP Progress" className="mt-6">
          <div className="space-y-2 max-h-48 overflow-auto">
            {(() => {
              const families = {};
              guests.forEach((g) => {
                const fam = g.familyName || 'No Family';
                if (!families[fam]) families[fam] = { total: 0, responded: 0 };
                families[fam].total++;
                const hasResponded = Object.values(g.rsvpStatus || {}).some((s) => s === 'accepted' || s === 'declined');
                if (hasResponded) families[fam].responded++;
              });
              return Object.entries(families)
                .filter(([, v]) => v.total > 1)
                .sort((a, b) => (b[1].responded / b[1].total) - (a[1].responded / a[1].total))
                .slice(0, 10)
                .map(([name, { total, responded }]) => {
                  const pct = Math.round((responded / total) * 100);
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 truncate w-32">{name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-wine-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{responded}/{total}</span>
                    </div>
                  );
                });
            })()}
          </div>
        </Card>
      )}

      {/* Per-event RSVP response rates */}
      {events.length > 0 && guestCount > 0 && (
        <Card title="RSVP by Event" className="mt-6">
          <div className="space-y-3">
            {events.map((evt) => {
              const invitedGuests = evt.inviteAll ? guests : guests.filter((g) => (evt.guestIds || []).includes(g.id));
              const responded = invitedGuests.filter((g) => {
                const status = (g.rsvpStatus || {})[evt.id];
                return status === 'accepted' || status === 'declined';
              });
              const accepted = invitedGuests.filter((g) => (g.rsvpStatus || {})[evt.id] === 'accepted');
              const rate = invitedGuests.length > 0 ? Math.round((responded.length / invitedGuests.length) * 100) : 0;
              return (
                <div key={evt.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{evt.name}</span>
                    <span className="text-xs text-gray-500">
                      {accepted.length} attending • {responded.length}/{invitedGuests.length} responded ({rate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <CreateWeddingModal open={showCreate} onClose={() => setShowCreate(false)} />
      <OnboardingTour show={!!activeWedding} />
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-card hover:shadow-lifted hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200 text-left"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-wine-50 to-phera-50 group-hover:from-wine-100 group-hover:to-phera-100 transition-colors">
        <Icon size={20} className="text-wine-700" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </button>
  );
}

function ChecklistItem({ done, label, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => !done && to && navigate(to)}
      className={`flex items-center gap-3 w-full text-left rounded-lg px-2 py-1.5 transition-colors ${!done && to ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
      disabled={done}
    >
      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
        {done && <span className="text-white text-xs">✓</span>}
      </div>
      <span className={`text-sm flex-1 ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{label}</span>
      {!done && to && <span className="text-xs text-wine-600 font-medium">Go →</span>}
    </button>
  );
}

function CreateWeddingPrompt({ onOpen, showModal, onClose }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-wine-100 to-phera-100">
        <Calendar size={28} className="text-wine-700" />
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Let's get started</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Create your wedding to start managing guests, events, seating, and RSVPs in one place.
      </p>
      <Button onClick={onOpen}>
        <Plus size={18} /> Create Wedding
      </Button>
      <CreateWeddingModal open={showModal} onClose={onClose} />
    </div>
  );
}

function CreateWeddingModal({ open, onClose }) {
  const { user } = useAuth();
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const slug = `${name1}-and-${name2}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await addDoc(collection(db, COLLECTIONS.WEDDINGS), {
        ownerId: user.uid,
        coupleName1: name1,
        coupleName2: name2,
        weddingDate: date || null,
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to create wedding:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Wedding">
      <form onSubmit={handleCreate} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <Input label="Partner 1 Name" value={name1} onChange={(e) => setName1(e.target.value)} placeholder="Anjali" required />
        <Input label="Partner 2 Name" value={name2} onChange={(e) => setName2(e.target.value)} placeholder="Arjun" required />
        <Input label="Wedding Date (optional)" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Wedding'}</Button>
        </div>
      </form>
    </Modal>
  );
}
