import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  getPublicWeddingData,
  submitRsvpResponse,
} from '../services/rsvpService';
import { resolveWeddingId } from '../services/weddingService';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, DIETARY_OPTIONS, APP_NAME } from '../config/constants';
import { Search, Check, X, ChevronRight, Heart, Users } from 'lucide-react';

/**
 * Simple fuzzy match: returns true if the query and target differ by ≤ 2 edits,
 * or if the query is a prefix/suffix of the target (handles Indian name variants
 * like Priya/Priyah, Rushi/Rushi, Patel/Patell).
 */
function fuzzyMatch(query, target) {
  if (!query || !target) return false;
  if (query.length < 3) return false; // too short to fuzzy match safely
  if (target.startsWith(query) || query.startsWith(target)) return true;
  // Levenshtein distance (simplified, max 2)
  const maxDist = query.length <= 4 ? 1 : 2;
  if (Math.abs(query.length - target.length) > maxDist) return false;
  let prev = Array.from({ length: target.length + 1 }, (_, i) => i);
  for (let i = 1; i <= query.length; i++) {
    const curr = [i];
    for (let j = 1; j <= target.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (query[i - 1] === target[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[target.length] <= maxDist;
}

const TRANSLATIONS = {
  en: {
    findFamily: 'Find your family',
    searchPlaceholder: 'Enter your first or last name',
    search: 'Search',
    respondingFor: 'Responding for',
    events: 'Events',
    accept: 'Accept',
    decline: 'Decline',
    acceptAll: 'Accept all',
    declineAll: 'Decline all',
    dietary: 'Dietary preference',
    message: 'Message to the couple (optional)',
    submit: 'Submit RSVP',
    submitting: 'Submitting...',
    thankYou: 'Thank you!',
    responseRecorded: 'Your response has been recorded.',
    noResults: 'No match found. Try a different spelling or your phone number.',
    enterPassword: 'Enter the password to access the RSVP',
    unlock: 'Unlock',
    wrongPassword: 'Incorrect password',
  },
  hi: {
    findFamily: 'अपना परिवार खोजें',
    searchPlaceholder: 'अपना नाम दर्ज करें',
    search: 'खोजें',
    respondingFor: 'जवाब दे रहे हैं',
    events: 'कार्यक्रम',
    accept: 'स्वीकार',
    decline: 'अस्वीकार',
    acceptAll: 'सभी स्वीकार',
    declineAll: 'सभी अस्वीकार',
    dietary: 'भोजन वरीयता',
    message: 'जोड़े के लिए संदेश (वैकल्पिक)',
    submit: 'RSVP जमा करें',
    submitting: 'जमा हो रहा है...',
    thankYou: 'धन्यवाद!',
    responseRecorded: 'आपका जवाब दर्ज हो गया है।',
    noResults: 'कोई मिलान नहीं मिला। कृपया अलग वर्तनी या फ़ोन नंबर आज़माएं।',
    enterPassword: 'RSVP एक्सेस करने के लिए पासवर्ड दर्ज करें',
    unlock: 'अनलॉक',
    wrongPassword: 'गलत पासवर्ड',
  },
  gu: {
    findFamily: 'તમારું કુટુંબ શોધો',
    searchPlaceholder: 'તમારું નામ દાખલ કરો',
    search: 'શોધો',
    respondingFor: 'જવાબ આપી રહ્યા છો',
    events: 'કાર્યક્રમો',
    accept: 'સ્વીકાર',
    decline: 'અસ્વીકાર',
    acceptAll: 'બધા સ્વીકારો',
    declineAll: 'બધા અસ્વીકારો',
    dietary: 'ભોજન પસંદગી',
    message: 'યુગલ માટે સંદેશ (વૈકલ્પિક)',
    submit: 'RSVP સબમિટ કરો',
    submitting: 'સબમિટ થઈ રહ્યું છે...',
    thankYou: 'આભાર!',
    responseRecorded: 'તમારો જવાબ નોંધાયો છે.',
    noResults: 'કોઈ મેળ મળ્યો નથી. કૃપા કરી અલગ જોડણી અથવા ફોન નંબર અજમાવો.',
    enterPassword: 'RSVP ઍક્સેસ કરવા માટે પાસવર્ડ દાખલ કરો',
    unlock: 'અનલૉક',
    wrongPassword: 'ખોટો પાસવર્ડ',
  },
};

export default function PublicRSVP() {
  const { weddingId: rawParam } = useParams();
  const [searchParams] = useSearchParams();
  const [weddingId, setWeddingId] = useState(null);
  const [weddingData, setWeddingData] = useState(null);
  const [allGuests, setAllGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Flow states
  const [step, setStep] = useState('search'); // search → family → done
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState([]);
  const [eventResponses, setEventResponses] = useState({});
  const [dietaryChoices, setDietaryChoices] = useState({});
  const [message, setMessage] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [lang, setLang] = useState('en'); // 'en' | 'hi' | 'gu'
  const [seniorMode, setSeniorMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const textScale = seniorMode ? 'text-lg' : 'text-sm';
  const headingScale = seniorMode ? 'text-2xl' : 'text-lg';
  const darkBg = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-rose-50 via-white to-amber-50';
  const darkCard = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm border-white/40';
  const darkText = darkMode ? 'text-gray-100' : 'text-gray-900';
  const darkMuted = darkMode ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    async function load() {
      try {
        const resolvedId = await resolveWeddingId(rawParam);
        if (!resolvedId) { setError('Wedding not found'); setLoading(false); return; }
        setWeddingId(resolvedId);
        const data = await getPublicWeddingData(resolvedId);
        if (!data) { setError('Wedding not found'); setLoading(false); return; }
        setWeddingData(data);
        const guestsSnap = await getDocs(
          collection(db, COLLECTIONS.WEDDINGS, resolvedId, COLLECTIONS.PUBLIC_GUESTS)
        );
        setAllGuests(guestsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setError('Unable to load wedding details');
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [rawParam]);

  // Search — match by name/phone/family, then group by family
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');

    const matches = allGuests.filter((g) => {
      const full = `${g.firstName} ${g.lastName}`.toLowerCase();
      const phone = g.phoneLast4 || '';
      // Exact/substring match
      if (full.includes(q) || q.includes(full)) return true;
      if (g.familyName && g.familyName.toLowerCase().includes(q)) return true;
      if (qDigits.length >= 4 && phone.includes(qDigits)) return true;
      // Fuzzy: match if query is close to first or last name (handles typos/spelling variants)
      if (fuzzyMatch(q, (g.firstName || '').toLowerCase())) return true;
      if (fuzzyMatch(q, (g.lastName || '').toLowerCase())) return true;
      return false;
    });

    // Sort: exact matches first, then fuzzy
    matches.sort((a, b) => {
      const aFull = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bFull = `${b.firstName} ${b.lastName}`.toLowerCase();
      const aExact = aFull.includes(q) || q.includes(aFull) ? 0 : 1;
      const bExact = bFull.includes(q) || q.includes(bFull) ? 0 : 1;
      return aExact - bExact || aFull.localeCompare(bFull);
    });

    setSearchResults(matches);
  };

  // Select a guest → pull whole family
  const handleSelectGuest = (guest) => {
    let family = guest.familyName
      ? allGuests.filter((g) => g.familyName === guest.familyName)
      : [guest];

    // Sort: adults first, then alphabetical
    family.sort((a, b) => {
      const aKid = a.isChild ? 1 : 0;
      const bKid = b.isChild ? 1 : 0;
      return aKid !== bKid ? aKid - bKid : a.firstName.localeCompare(b.firstName);
    });

    setSelectedFamily(family);
    setRespondentName(`${guest.firstName} ${guest.lastName}`);

    // Pre-fill existing data
    const responses = {};
    const dietary = {};
    family.forEach((g) => {
      responses[g.id] = {};
      dietary[g.id] = 'vegetarian';
    });
    setEventResponses(responses);
    setDietaryChoices(dietary);
    setStep('family');
  };

  // Personalized household link (`?g=<guestId>`): skip name search and open
  // this household's invitation directly.
  useEffect(() => {
    const gid = searchParams.get('g');
    if (!gid || step !== 'search' || allGuests.length === 0) return;
    const found = allGuests.find((x) => x.id === gid);
    if (found) handleSelectGuest(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGuests, searchParams]);

  // Toggle a single guest+event
  const toggleRsvp = (guestId, eventId, status) => {
    setEventResponses((prev) => ({
      ...prev,
      [guestId]: {
        ...(prev[guestId] || {}),
        [eventId]: (prev[guestId] || {})[eventId] === status ? null : status,
      },
    }));
  };

  // Accept/decline all events for a guest
  const setAllEvents = (guestId, status) => {
    const evts = getEventsForGuest(guestId);
    const responses = {};
    evts.forEach((evt) => { responses[evt.id] = status; });
    setEventResponses((prev) => ({ ...prev, [guestId]: responses }));
  };

  // Only show events a guest is invited to (like WithJoy)
  const getEventsForGuest = (guestId) => {
    return (weddingData?.events || []).filter((evt) => {
      if (evt.inviteAll) return true;
      return (evt.guestIds || []).includes(guestId);
    });
  };

  // Submit
  const handleSubmit = async () => {
    const unansweredEvents = selectedFamily.flatMap((guest) =>
      getEventsForGuest(guest.id)
        .filter((event) => !eventResponses[guest.id]?.[event.id])
        .map((event) => `${guest.firstName}: ${event.name}`)
    );
    if (unansweredEvents.length > 0) {
      setError('Please answer Yes or No for every event before submitting.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      for (const guest of selectedFamily) {
        await submitRsvpResponse(weddingId, {
          guestId: guest.id,
          familyName: guest.familyName || '',
          respondentName,
          phone: '',
          email: '',
          eventResponses: eventResponses[guest.id] || {},
          dietary: dietaryChoices[guest.id] || 'vegetarian',
          message,
          method: 'web',
        });

        // Update guest doc directly
        await updateDoc(
          doc(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.GUESTS, guest.id),
          {
            rsvpStatus: eventResponses[guest.id] || {},
            dietary: dietaryChoices[guest.id] || 'vegetarian',
            rsvpMethod: 'web',
          }
        );
      }
      setStep('done');
    } catch (err) {
      console.error('RSVP submit error:', err);
      setError('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const events = weddingData?.events || [];
  const wedding = weddingData?.wedding || {};
  const settings = weddingData?.rsvpSettings || {};

  // ─── Loading / Error / Closed states ─────────────────────────────
  if (loading) {
    return (
      <CenteredPage>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-wine-100 flex items-center justify-center">
            <Heart size={20} className="text-wine-600 animate-pulse" />
          </div>
          <p className="text-wine-700 font-medium">Loading your invitation...</p>
          <div className="flex flex-wrap justify-end gap-2">
            <div className="w-2 h-2 rounded-full bg-wine-300 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-wine-300 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 rounded-full bg-wine-300 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </CenteredPage>
    );
  }
  if (error && !weddingData) {
    return <CenteredPage><p className="text-red-600 text-lg mb-2">{error}</p><p className="text-gray-500 text-sm">This link may be invalid or expired.</p></CenteredPage>;
  }
  if (settings.isOpen === false) {
    return (
      <CenteredPage>
        <Heart className="mx-auto text-wine-400 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{wedding.coupleName}</h1>
        <p className="text-gray-600">RSVPs are currently closed.</p>
      </CenteredPage>
    );
  }

  // Password gate — if a password is set and not yet unlocked
  if (settings.rsvpPassword && !passwordUnlocked) {
    return (
      <CenteredPage>
        <div className="w-12 h-12 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center mx-auto mb-4">
          <Heart size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{wedding.coupleName || 'Wedding RSVP'}</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the password from your invitation to continue.</p>
        <div className="w-full max-w-xs mx-auto space-y-3">
          <input
            type="text"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput.trim().toLowerCase() === settings.rsvpPassword.trim().toLowerCase()) {
                  setPasswordUnlocked(true);
                } else {
                  setPasswordError('Incorrect password. Check your invitation and try again.');
                }
              }
            }}
            placeholder="Enter password"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-center focus:border-wine-600 focus:ring-2 focus:ring-wine-100 transition-all"
            autoFocus
          />
          {passwordError && <p className="text-xs text-red-600 text-center">{passwordError}</p>}
          <button
            onClick={() => {
              if (passwordInput.trim().toLowerCase() === settings.rsvpPassword.trim().toLowerCase()) {
                setPasswordUnlocked(true);
              } else {
                setPasswordError('Incorrect password. Check your invitation and try again.');
              }
            }}
            className="w-full py-3 bg-wine-700 text-white rounded-xl text-sm font-medium hover:bg-wine-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </CenteredPage>
    );
  }

  return (
    <div className={`min-h-screen ${darkBg}`}>
      {/* Header */}
      <header className="text-center pt-10 pb-6 px-4">
        {/* Language toggle */}
        <div className="flex justify-center gap-1.5 mb-4">
          {[{ code: 'en', label: 'EN' }, { code: 'hi', label: 'हिं' }, { code: 'gu', label: 'ગુ' }].map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`min-h-10 rounded-xl px-3 py-2 text-xs font-semibold transition-colors active:scale-[0.98] ${
                lang === code ? 'bg-wine-700 text-white' : 'bg-white/70 text-gray-600 hover:bg-wine-50'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="w-px bg-gray-300 mx-1" />
          <button
            onClick={() => setSeniorMode(!seniorMode)}
            className={`min-h-10 rounded-xl px-3 py-2 text-xs font-semibold transition-colors active:scale-[0.98] ${
              seniorMode ? 'bg-wine-700 text-white' : 'bg-white/70 text-gray-600 hover:bg-wine-50'
            }`}
            title="Large text mode for easier reading"
          >
            {seniorMode ? 'Aa−' : 'Aa+'}
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              darkMode ? 'bg-wine-700 text-white' : 'bg-white/70 text-gray-600 hover:bg-wine-50'
            }`}
            title="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="w-12 h-12 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center mx-auto mb-3">
          <Heart size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{wedding.coupleName || 'Wedding RSVP'}</h1>
        {settings.customMessage && (
          <p className="text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">{settings.customMessage}</p>
        )}
        {settings.deadline && (() => {
          const daysLeft = Math.ceil((new Date(settings.deadline) - new Date()) / (1000 * 60 * 60 * 24));
          return (
            <div className="mt-3">
              <p className="text-sm text-wine-700 font-medium">
                {lang === 'en' ? 'Please respond by' : lang === 'hi' ? 'कृपया इस तारीख तक जवाब दें' : 'કૃપા કરી આ તારીખ સુધીમાં જવાબ આપો'}{' '}
                {new Date(settings.deadline).toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              {daysLeft > 0 && daysLeft <= 14 && (
                <p className="text-xs text-wine-600 mt-1 animate-pulse">
                  ⏰ {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to respond!
                </p>
              )}
              {daysLeft <= 0 && (
                <p className="text-xs text-red-600 mt-1 font-semibold">
                  ⚠️ {lang === 'en' ? 'Deadline has passed. Please respond ASAP' : lang === 'hi' ? 'समय सीमा बीत चुकी है। कृपया जल्दी जवाब दें' : 'સમય મર્યાદા પસાર થઈ ગઈ છે। કૃપા કરી જલ્દી જવાબ આપો'}
                </p>
              )}
            </div>
          );
        })()}
      </header>

      <main className="max-w-xl mx-auto px-4 pb-20">
        {/* ── STEP: Search ──────────────────────────────────────────── */}
        {step === 'search' && (
          <RsvpCard>
            <h2 className={`${headingScale} font-semibold text-gray-900 mb-1`}>{t.findFamily}</h2>
            <p className={`${textScale} text-gray-500 mb-5`}>
              {lang === 'en' ? 'Search for any family member and we\'ll pull up your whole household.' : lang === 'hi' ? 'किसी भी सदस्य का नाम खोजें। हम पूरा परिवार दिखाएंगे।' : 'કોઈપણ સભ્યનું નામ શોધો. અમે આખું ઘર બતાવીશું.'}
            </p>

            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={t.searchPlaceholder}
                  className={`w-full pl-10 pr-4 ${seniorMode ? 'py-4 text-lg' : 'py-3 text-sm'} rounded-xl border border-gray-200 focus:border-wine-600 focus:ring-2 focus:ring-wine-100 transition-all`}
                  autoFocus
                />
              </div>
              <button onClick={handleSearch} className={`${seniorMode ? 'px-6 py-4 text-base' : 'px-5 py-3 text-sm'} bg-wine-700 text-white rounded-xl font-medium hover:bg-wine-800 transition-colors flex-shrink-0`}>
                {t.search}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Select your household</p>
                {groupByFamily(searchResults, allGuests).map(({ familyName, members }) => (
                  <button
                    key={(familyName || '') + members[0].id}
                    onClick={() => handleSelectGuest(members[0])}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-wine-50 hover:border-wine-300 transition-all active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-wine-100 text-wine-700 flex items-center justify-center flex-shrink-0">
                      {members.length > 1 ? <Users size={18} /> : <span className="text-sm font-bold">{members[0]?.firstName?.[0] || '?'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {familyName ? `The ${familyName} Family` : `${members[0]?.firstName || ''} ${members[0]?.lastName || ''}`.trim()}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {members.map((m) => `${m.firstName} ${m.lastName}`).join(', ')}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.trim().length > 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-1">We couldn't find that name.</p>
                <p className="text-xs text-gray-400">Try the exact name from your invitation, or contact the couple.</p>
              </div>
            )}
          </RsvpCard>
        )}

        {/* ── STEP: Family RSVP (card per person, like Joy/Zola) ──── */}
        {step === 'family' && (
          <div className="space-y-4">
            {/* Back button */}
            <button
              onClick={() => { setStep('search'); setSearchResults([]); setSearchQuery(''); }}
              className="text-sm text-wine-700 hover:text-wine-800 font-medium"
            >
              ← Search again
            </button>

            {/* Greeting */}
            <RsvpCard>
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedFamily[0]?.familyName
                  ? `Welcome, ${selectedFamily[0].familyName} Family! 🎉`
                  : `Welcome, ${selectedFamily[0]?.firstName}! 🎉`
                }
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedFamily.length > 1
                  ? `RSVP for each person below. They may be invited to different events.`
                  : `Let us know which events you'll be attending.`
                }
              </p>
            </RsvpCard>

            {/* One card per family member */}
            {selectedFamily.map((guest) => {
              const guestEvents = getEventsForGuest(guest.id);
              const responses = eventResponses[guest.id] || {};
              const allAccepted = guestEvents.length > 0 && guestEvents.every((e) => responses[e.id] === 'accepted');
              const allDeclined = guestEvents.length > 0 && guestEvents.every((e) => responses[e.id] === 'declined');

              return (
                <RsvpCard key={guest.id}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {guest.firstName} {guest.lastName}
                      </h3>
                      {guest.isChild && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">Child</span>
                      )}
                    </div>
                    {/* Quick accept/decline all */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAllEvents(guest.id, 'accepted')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          allAccepted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        Accept All
                      </button>
                      <button
                        onClick={() => setAllEvents(guest.id, 'declined')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          allDeclined ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        Decline All
                      </button>
                    </div>
                  </div>

                  {/* Events this guest is invited to */}
                  <div className="space-y-2">
                    {guestEvents.map((evt) => {
                      const s = responses[evt.id];
                      return (
                        <div key={evt.id} className="flex items-center gap-3 py-2 border-t border-gray-100 first:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{evt.name}</div>
                            <div className="text-xs text-gray-400">
                              {[evt.date && formatDate(evt.date), evt.startTime, evt.venue].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleRsvp(guest.id, evt.id, 'accepted')}
                              aria-pressed={s === 'accepted'}
                              className={`flex min-h-11 min-w-16 items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                                s === 'accepted'
                                  ? 'bg-green-500 text-white shadow-sm scale-105'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'
                              }`}
                            >
                              <Check size={12} /> Yes
                            </button>
                            <button
                              onClick={() => toggleRsvp(guest.id, evt.id, 'declined')}
                              aria-pressed={s === 'declined'}
                              className={`flex min-h-11 min-w-16 items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                                s === 'declined'
                                  ? 'bg-red-500 text-white shadow-sm scale-105'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-700'
                              }`}
                            >
                              <X size={12} /> No
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dietary — only show if guest accepted at least one event */}
                  {settings.allowDietary !== false && guestEvents.some((e) => responses[e.id] === 'accepted') && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <label className="text-xs font-medium text-gray-500 block mb-1">Dietary Preference</label>
                      <select
                        value={dietaryChoices[guest.id] || 'vegetarian'}
                        onChange={(e) => setDietaryChoices((prev) => ({ ...prev, [guest.id]: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-wine-600"
                      >
                        {DIETARY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </RsvpCard>
              );
            })}

            {/* Message */}
            {settings.allowMessage !== false && (
              <RsvpCard>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Leave a message for the couple (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Congratulations! We can't wait to celebrate with you..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-wine-600 focus:ring-2 focus:ring-wine-100"
                />
              </RsvpCard>
            )}

            {error && <p role="alert" aria-live="assertive" className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-wine-700 text-white rounded-2xl font-semibold hover:bg-wine-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        )}

        {/* ── STEP: Done ────────────────────────────────────────────── */}
        {step === 'done' && (
          <RsvpCard className="text-center relative overflow-hidden">
            {/* Confetti celebration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10%',
                    width: `${6 + Math.random() * 6}px`,
                    height: `${6 + Math.random() * 6}px`,
                    backgroundColor: ['#ab204d', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#f97316'][i % 6],
                    animation: `confettiFall ${2 + Math.random() * 3}s ${Math.random() * 2}s ease-in forwards`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
            <style>{`
              @keyframes confettiFall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
              }
            `}</style>
            <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.thankYou}</h2>
            <p className="text-gray-600 mb-6">
              {t.responseRecorded}
            </p>

            {/* Summary */}
            <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-1">
              {selectedFamily.map((guest) => {
                const responses = eventResponses[guest.id] || {};
                const accepted = Object.entries(responses)
                  .filter(([, s]) => s === 'accepted')
                  .map(([eid]) => events.find((e) => e.id === eid)?.name)
                  .filter(Boolean);
                return (
                  <div key={guest.id} className="flex items-baseline gap-2 py-0.5">
                    <span className="text-sm font-medium text-gray-800 w-28 truncate">{guest.firstName}</span>
                    <span className="text-sm text-gray-500">
                      {accepted.length > 0 ? accepted.join(', ') : 'Not attending any events'}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { setStep('search'); setSearchQuery(''); setSearchResults([]); setSelectedFamily([]); setMessage(''); }}
              className="text-sm text-wine-700 hover:text-wine-800 font-medium"
            >
              RSVP for another family →
            </button>
            </div>
          </RsvpCard>
        )}
      </main>

      <footer className="text-center pb-6 text-xs text-gray-400">
        <p>Powered by <span className="font-medium text-gray-500">{APP_NAME}</span></p>
        <p className="mt-2">
          <Link className="hover:text-wine-700" to="/privacy">Privacy</Link>
          {' · '}
          <Link className="hover:text-wine-700" to="/terms">Terms</Link>
        </p>
      </footer>
    </div>
  );
}

// ─── Reusable components ────────────────────────────────────────────────────

function CenteredPage({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wine-50 to-amber-50 px-4">
      <div className="text-center max-w-md">{children}</div>
    </div>
  );
}

function RsvpCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function groupByFamily(matches, allGuests) {
  const families = {};
  matches.forEach((g) => {
    if (!g.familyName) {
      families[`__solo_${g.id}`] = { familyName: null, members: [g] };
      return;
    }

    const key = g.familyName;
    if (!families[key]) {
      const members = allGuests
        .filter((ag) => ag.familyName === g.familyName)
        .sort((a, b) => a.firstName.localeCompare(b.firstName));
      families[key] = { familyName: g.familyName, members };
    }
  });
  return Object.values(families);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}
