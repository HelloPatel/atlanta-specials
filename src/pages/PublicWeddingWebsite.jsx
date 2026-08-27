import { useEffect, useMemo, useState } from 'react';
import { Heart, Users } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';
import { subscribeToPublicEvents } from '../services/eventService';
import { subscribeToWebsite } from '../services/websiteService';
import { resolveWeddingId } from '../services/weddingService';
import WeddingWebsitePreview from '../components/website/WeddingWebsitePreview';
import GuestGate from '../components/website/GuestGate';
import { getCoupleDisplayName, normalizeWebsiteConfig } from '../components/website/websiteThemes';
import { filterInvitedEvents, householdLabel } from '../utils/guestDirectory';

function CenteredState({ title, message, error = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wine-50 via-white to-amber-50 px-4">
      <div className="max-w-md rounded-[2rem] border border-white/60 bg-white/90 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${error ? 'bg-red-100 text-red-600' : 'bg-wine-100 text-wine-700'}`}>
          <Heart size={24} />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-gray-500">{message}</p>
      </div>
    </div>
  );
}

export default function PublicWeddingWebsite() {
  const { weddingId: rawParam } = useParams();
  const [searchParams] = useSearchParams();
  const [resolvedId, setResolvedId] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Guest identification
  const [allGuests, setAllGuests] = useState([]);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [household, setHousehold] = useState(null); // array of guests, or [] for general view

  const storageKey = resolvedId ? `phera:guest:${resolvedId}` : null;

  useEffect(() => {
    if (!rawParam) return undefined;

    let cancelled = false;
    async function resolve() {
      try {
        const id = await resolveWeddingId(rawParam);
        if (cancelled) return;
        if (!id) { setNotFound(true); setLoading(false); return; }
        setResolvedId(id);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to resolve wedding id:', error);
        setNotFound(true);
        setLoading(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [rawParam]);

  useEffect(() => {
    if (!resolvedId) return undefined;

    let loadedWedding = false;
    const unsubscribeWebsite = subscribeToWebsite(resolvedId, (data) => {
      loadedWedding = true;
      if (!data) {
        setNotFound(true);
        setWedding(null);
      } else {
        setNotFound(false);
        setWedding(data);
      }
      setLoading(false);
    });

    const unsubscribeEvents = subscribeToPublicEvents(resolvedId, setEvents);

    return () => {
      if (!loadedWedding) setLoading(false);
      unsubscribeWebsite();
      unsubscribeEvents();
    };
  }, [resolvedId]);

  // Load the public guest directory for name matching.
  useEffect(() => {
    if (!resolvedId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(
          collection(db, COLLECTIONS.WEDDINGS, resolvedId, COLLECTIONS.PUBLIC_GUESTS)
        );
        if (cancelled) return;
        setAllGuests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to load guest directory', err);
      } finally {
        if (!cancelled) setGuestsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [resolvedId]);

  // Restore a previously identified household (persisted per wedding), or
  // auto-select from a personalized `?g=<guestId>` link.
  useEffect(() => {
    if (!guestsLoaded || household !== null) return;

    const gid = searchParams.get('g');
    if (gid) {
      const found = allGuests.find((g) => g.id === gid);
      if (found) {
        const fam = found.familyName
          ? allGuests.filter((g) => g.familyName === found.familyName)
          : [found];
        setHousehold(fam);
        return;
      }
    }

    if (!storageKey) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.general) { setHousehold([]); return; }
      const ids = parsed?.ids || [];
      const restored = allGuests.filter((g) => ids.includes(g.id));
      if (restored.length > 0) setHousehold(restored);
    } catch {
      /* ignore malformed cache */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestsLoaded, allGuests, searchParams, storageKey]);

  const identify = (members) => {
    setHousehold(members);
    if (storageKey) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ ids: members.map((m) => m.id) }));
      } catch { /* storage may be unavailable */ }
    }
  };

  const viewGeneral = () => {
    setHousehold([]);
    if (storageKey) {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ general: true })); }
      catch { /* ignore */ }
    }
  };

  const switchGuest = () => {
    setHousehold(null);
    if (storageKey) {
      try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  };

  const invitedEvents = useMemo(() => {
    if (!household || household.length === 0) {
      // General view: only events open to everyone.
      return events.filter((e) => e.inviteAll);
    }
    return filterInvitedEvents(events, household);
  }, [events, household]);

  if (loading) {
    return <CenteredState title="Loading wedding website" message="Gathering all the celebration details for you..." />;
  }

  if (notFound || !wedding) {
    return <CenteredState title="Wedding website not found" message="This link may be incorrect, expired, or not available yet." error />;
  }

  const coupleName = getCoupleDisplayName(wedding);

  if (!normalizeWebsiteConfig(wedding, []).websitePublished) {
    return (
      <CenteredState
        title={`${coupleName} wedding website`}
        message="This wedding website is still being prepared. Please check back soon for celebration details and RSVP access."
      />
    );
  }

  // Password protection gate
  if (wedding.websitePassword && !passwordUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wine-50 to-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <Heart size={32} className="text-wine-600 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-gray-900 mb-2">{coupleName}</h2>
          <p className="text-sm text-gray-500 mb-6">This wedding website is password protected.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (passwordInput === wedding.websitePassword) {
              setPasswordUnlocked(true);
            } else {
              setPasswordInput('');
            }
          }}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600 mb-4"
            />
            <button type="submit" className="w-full bg-wine-700 text-white rounded-lg py-3 text-sm font-medium hover:bg-wine-800 transition-colors">
              View Website
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Guest identification gate — required before showing the site.
  if (household === null) {
    if (!guestsLoaded) {
      return <CenteredState title="Loading wedding website" message="Just a moment while we prepare your invitation..." />;
    }
    return (
      <GuestGate
        coupleName={coupleName}
        guests={allGuests}
        onIdentify={identify}
        onGeneral={viewGeneral}
      />
    );
  }

  const config = normalizeWebsiteConfig(wedding, invitedEvents.map((event) => event.id));
  const isGeneral = household.length === 0;
  const label = householdLabel(household);

  return (
    <div>
      <div className="flex items-center justify-center gap-2 bg-wine-900 px-4 py-2 text-center text-xs text-white/90">
        <Users size={14} className="shrink-0 text-white/70" />
        <span className="truncate">
          {isGeneral ? 'Viewing the general schedule' : `Viewing as ${label}`}
        </span>
        <span className="text-white/40">·</span>
        <button onClick={switchGuest} className="font-semibold text-white underline underline-offset-2 hover:text-amber-200">
          Not you?
        </button>
      </div>
      <WeddingWebsitePreview wedding={wedding} config={config} events={invitedEvents} />
    </div>
  );
}
