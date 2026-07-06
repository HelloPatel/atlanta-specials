import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { subscribeToEvents } from '../services/eventService';
import { subscribeToWebsite } from '../services/websiteService';
import { resolveWeddingId } from '../services/weddingService';
import WeddingWebsitePreview from '../components/website/WeddingWebsitePreview';
import { getCoupleDisplayName, normalizeWebsiteConfig } from '../components/website/websiteThemes';

function CenteredState({ title, message, error = false }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-wine-50 via-white to-amber-50 px-4">
      <div className="max-w-md rounded-[2rem] border border-white/60 bg-white/90 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-content rounded-full ${error ? 'bg-red-100 text-red-600' : 'bg-wine-100 text-wine-700'}`}>
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
  const [resolvedId, setResolvedId] = useState(null);
  const [wedding, setWedding] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (!rawParam) return undefined;

    let cancelled = false;
    async function resolve() {
      const id = await resolveWeddingId(rawParam);
      if (cancelled) return;
      if (!id) { setNotFound(true); setLoading(false); return; }
      setResolvedId(id);
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

    const unsubscribeEvents = subscribeToEvents(resolvedId, setEvents);

    return () => {
      if (!loadedWedding) setLoading(false);
      unsubscribeWebsite();
      unsubscribeEvents();
    };
  }, [resolvedId]);

  if (loading) {
    return <CenteredState title="Loading wedding website" message="Gathering all the celebration details for you..." />;
  }

  if (notFound || !wedding) {
    return <CenteredState title="Wedding website not found" message="This link may be incorrect, expired, or not available yet." error />;
  }

  const config = normalizeWebsiteConfig(wedding, events.map((event) => event.id));
  const coupleName = getCoupleDisplayName(wedding);

  if (!config.websitePublished) {
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

  return <WeddingWebsitePreview wedding={wedding} config={config} events={events} />;
}
