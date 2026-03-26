import { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue, useTransition } from 'react';
import Select from 'react-select';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import { useRatings, toRestaurantKey, useReviews, submitReview } from './hooks/useRatings';
import { useBookmarks } from './hooks/useBookmarks';
import { useAutoDeals } from './hooks/useAutoDeals';
import StarRating from './components/StarRating';
import AuthModal from './components/AuthModal';
import SubmitDealModal from './components/SubmitDealModal';
import AdminDashboard from './components/AdminDashboard';
import {
  daysOfWeek,
  locationOptions,
  cuisineOptions,
  restaurantsList,
} from './common/commonComponents';

const locationOptionsFormatted = locationOptions.filter(o => o !== 'All').map(o => ({ value: o, label: o }));
const cuisineOptionsFormatted = cuisineOptions.filter(o => o !== 'All').map(o => ({ value: o, label: o }));

const selectStyles = {
  control: (b, s) => ({
    ...b,
    minHeight: 42,
    borderColor: s.isFocused ? '#e8534a' : '#e0e0e0',
    borderWidth: 2,
    borderRadius: 8,
    boxShadow: 'none',
    '&:hover': { borderColor: '#e8534a' },
    fontSize: 16,
  }),
  option: (b, s) => ({
    ...b,
    fontSize: 16,
    backgroundColor: s.isSelected ? '#e8534a' : s.isFocused ? '#fde9e8' : 'white',
    color: s.isSelected ? 'white' : '#1a1a2e',
  }),
  multiValue: (b) => ({ ...b, backgroundColor: '#fde9e8', borderRadius: 4 }),
  multiValueLabel: (b) => ({ ...b, color: '#e8534a', fontSize: 14, fontWeight: 600 }),
  multiValueRemove: (b) => ({ ...b, color: '#e8534a', '&:hover': { background: '#e8534a', color: 'white' } }),
  placeholder: (b) => ({ ...b, color: '#aaa', fontSize: 16 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (b) => ({ ...b, color: '#ccc', padding: '0 6px' }),
  menu: (b) => ({ ...b, fontSize: 16, zIndex: 9999 }),
  menuPortal: (b) => ({ ...b, zIndex: 9999 }),
};

const TODAY = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// ─── Live deal time parsing ───────────────────────────────────────────────────
function toMin24(h, m, mer) {
  let h24 = parseInt(h, 10);
  if (mer === 'PM' && h24 !== 12) h24 += 12;
  if (mer === 'AM' && h24 === 12) h24 = 0;
  return h24 * 60 + parseInt(m || '0', 10);
}

function parseTimeRanges(text) {
  if (!text) return [];
  const results = [];
  // "4–6 PM", "4:30-7:30 PM", "11–2:30 PM"
  const re1 = /(\d{1,2})(?::(\d{2}))?\s*[–\-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
  let m;
  while ((m = re1.exec(text)) !== null) {
    const mer = m[5].toUpperCase();
    const startH = parseInt(m[1], 10), endH = parseInt(m[3], 10);
    // If start hour > end hour in 12h (e.g. 11–2 PM), start must be AM
    const startMer = startH > endH ? 'AM' : mer;
    results.push({ start: toMin24(startH, m[2], startMer), end: toMin24(endH, m[4], mer) });
  }
  // "11 AM to 4 PM", "7 PM to 9 PM"
  const re2 = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s+to\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;
  while ((m = re2.exec(text)) !== null) {
    results.push({
      start: toMin24(m[1], m[2], m[3].toUpperCase()),
      end: toMin24(m[4], m[5], m[6].toUpperCase()),
    });
  }
  return results;
}

function getLiveInfo(text, nowMin) {
  if (!text) return null;
  if (/all.?day/i.test(text)) return 'All day';
  const active = parseTimeRanges(text).find(r => nowMin >= r.start && nowMin < r.end);
  if (!active) return null;
  const rem = active.end - nowMin;
  const h = Math.floor(rem / 60), min = rem % 60;
  return h > 0 ? (min > 0 ? `Ends in ${h}h ${min}m` : `Ends in ${h}h`) : `Ends in ${min}m`;
}
// ─────────────────────────────────────────────────────────────────────────────

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

function DayTabs({ selected, onChange }) {
  const tabRefs = useRef({});
  const [marker, setMarker] = useState({ left: 0, width: 0 });
  const [markerVisible, setMarkerVisible] = useState(false);

  const selectedKey = selected.length > 0 ? selected[0].value.slice(0, 3) : null;

  const getPos = useCallback((key) => {
    const el = tabRefs.current[key];
    if (!el) return null;
    return { left: el.offsetLeft, width: el.offsetWidth };
  }, []);

  useEffect(() => {
    if (selectedKey) {
      const pos = getPos(selectedKey);
      if (pos) { setMarker(pos); setMarkerVisible(true); }
    } else {
      setMarkerVisible(false);
    }
  }, [selectedKey, getPos]);

  useEffect(() => {
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (selectedKey) {
          const pos = getPos(selectedKey);
          if (pos) setMarker(pos);
        }
      }, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [selectedKey, getPos]);

  const handleClick = (key) => {
    const full = DAY_FULL[key];
    onChange(selected.some(d => d.value === full) ? [] : [{ value: full, label: full }]);
  };

  const handleMouseEnter = (key) => {
    const pos = getPos(key);
    if (pos) { setMarker(pos); setMarkerVisible(true); }
  };

  const handleMouseLeave = () => {
    if (selectedKey) {
      const pos = getPos(selectedKey);
      if (pos) setMarker(pos);
    } else {
      setMarkerVisible(false);
    }
  };

  return (
    <div className="day-tabs" onMouseLeave={handleMouseLeave}>
      {markerVisible && (
        <div className="day-tabs-marker" style={{ left: marker.left, width: marker.width }} />
      )}
      {DAY_SHORT.map((key) => {
        const isActive = selected.some(d => d.value === DAY_FULL[key]);
        const isToday = DAY_FULL[key] === TODAY;
        return (
          <button
            key={key}
            ref={(el) => { tabRefs.current[key] = el; }}
            className={`day-tab${isActive ? ' day-tab-active' : ''}${isToday ? ' day-tab-today' : ''}`}
            onClick={() => handleClick(key)}
            onMouseEnter={() => handleMouseEnter(key)}
          >
            {key}
            {isToday && <span className="day-tab-dot" />}
          </button>
        );
      })}
    </div>
  );
}

// Intersection Observer — fade cards in as they enter the viewport
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

function RestaurantCard({ restaurant, selectedDays, rating, onRate, onSignInClick, currentUser, isBookmarked, onBookmark, onShare, nowMinutes, isAutoUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [cardRef, visible] = useReveal();
  const [showingAuto, setShowingAuto] = useState(true);
  const [justRated, setJustRated] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const reviews = useReviews(expanded ? restaurant.name : null);

  function handleRate(restaurantName, stars) {
    onRate(restaurantName, stars);
    setJustRated(true);
  }

  async function handleSubmitReview() {
    await submitReview(currentUser, restaurant.name, rating?.userRating || 0, reviewText);
    setReviewText('');
    setJustRated(false);
  }

  const displaySpecials = (isAutoUpdated && !showingAuto)
    ? restaurant._staticSpecials
    : restaurant.specials;

  // Days matching the filter (used to decide if card shows at all + preview)
  const filteredDays = daysOfWeek.filter(
    (day) => displaySpecials[day] &&
      (selectedDays.length === 0 || selectedDays.some((d) => d.value === day))
  );

  // All days with specials (shown when expanded)
  const allSpecialDays = daysOfWeek.filter((day) => displaySpecials[day]);

  if (filteredDays.length === 0) return null;

  // In collapsed mode: show today's special or the first matching day as preview
  const previewDay = filteredDays.includes(TODAY) ? TODAY : filteredDays[0];
  const previewText = displaySpecials[previewDay];
  const otherCount = allSpecialDays.length - 1;
  const liveText = getLiveInfo(displaySpecials[TODAY], nowMinutes);

  return (
    <div ref={cardRef} className={`card${expanded ? ' card-expanded' : ''}${visible ? ' card-visible' : ''}`}>
      <button className="card-toggle" onClick={() => setExpanded(!expanded)}>
        {restaurant.image && (
          <div className="card-image-wrap">
            <img
              className="card-image"
              src={restaurant.image}
              alt={restaurant.name}
              loading="lazy"
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
            {liveText && liveText !== 'All day' && (
              <span className="live-badge">
                <span className="live-dot" />
                {`LIVE · ${liveText}`}
              </span>
            )}
            {isAutoUpdated && showingAuto && (
              <span className="limited-time-badge">LIMITED TIME</span>
            )}
          </div>
        )}
        <div className="card-top">
          <div className="card-title-row">
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="restaurant-name"
              onClick={(e) => e.stopPropagation()}
            >
              {restaurant.name}
              <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            <div className="card-actions" onClick={(e) => e.stopPropagation()}>
              {/* Share */}
              <button className="card-action-btn" onClick={() => onShare(restaurant, previewText)} aria-label="Share">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              {/* Bookmark */}
              {currentUser && (
                <button
                  className={`card-action-btn${isBookmarked ? ' bookmarked' : ''}`}
                  onClick={() => onBookmark(restaurant.name)}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <svg viewBox="0 0 24 24" fill={isBookmarked ? '#e8534a' : 'none'} stroke={isBookmarked ? '#e8534a' : 'currentColor'} strokeWidth="2" width="15" height="15">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                  </svg>
                </button>
              )}
            </div>
            <svg
              className={`chevron ${expanded ? 'chevron-up' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div className="card-meta">
            <span className="badge cuisine">{restaurant.cuisine}</span>
            {restaurant.location.map((loc) => (
              <span key={loc} className="badge location">{loc}</span>
            ))}
          </div>
          <div className="card-rating-row" onClick={(e) => e.stopPropagation()}>
            <StarRating
              averageRating={rating?.averageRating || 0}
              totalRatings={rating?.totalRatings || 0}
              userRating={rating?.userRating || 0}
              onRate={(stars) => handleRate(restaurant.name, stars)}
              readOnly={!currentUser}
            />
            {!currentUser && (
              <button className="rate-prompt" onClick={onSignInClick}>Sign in to rate</button>
            )}
          </div>
          {justRated && currentUser && (
            <div className="review-input-row" onClick={(e) => e.stopPropagation()}>
              <input
                className="review-input"
                placeholder="Add a note (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={200}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitReview()}
              />
              <button className="review-submit-btn" onClick={handleSubmitReview}>→</button>
            </div>
          )}
        </div>

        {/* Toggle tabs — only for auto-updated cards */}
        {isAutoUpdated && (
          <div className="specials-toggle" onClick={(e) => { e.stopPropagation(); setShowingAuto((v) => !v); }}>
            <span className={`specials-tab${showingAuto ? ' specials-tab-active' : ''}`}>This Week</span>
            <span className={`specials-tab${!showingAuto ? ' specials-tab-active' : ''}`}>Regular</span>
          </div>
        )}

        {/* Preview row — always visible */}
        {!expanded && (
          <div className="card-preview">
            <span className={`day-chip ${previewDay === TODAY ? 'today-chip' : ''}`}>
              {previewDay === TODAY ? 'TODAY' : previewDay.slice(0, 3).toUpperCase()}
            </span>
            <span className="preview-text">{previewText}</span>
            {otherCount > 0 && (
              <span className="more-badge">+{otherCount} more</span>
            )}
          </div>
        )}
      </button>

      {/* Expanded specials list — always show all days */}
      {expanded && (
        <>
          <div className="specials-list">
            {allSpecialDays.map((day) => (
              <div
                key={day}
                className={`special-row ${day === TODAY ? 'today' : ''}`}
              >
                <span className={`day-chip ${day === TODAY ? 'today-chip' : ''}`}>
                  {day === TODAY ? 'TODAY' : day.slice(0, 3).toUpperCase()}
                </span>
                <span className="special-text">{displaySpecials[day]}</span>
              </div>
            ))}
          </div>
          {reviews.length > 0 && (
            <div className="reviews-section">
              <p className="reviews-heading">Reviews</p>
              {reviews.map((r, i) => (
                <div key={i} className="review-row">
                  <div className="review-meta">
                    <span className="review-stars">{'★'.repeat(r.stars)}</span>
                    <span className="review-name">{r.displayName}</span>
                  </div>
                  <span className="review-text">{r.text}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const { currentUser, logout } = useAuth();
  const { ratings, submitRating } = useRatings(currentUser);
  const { isBookmarked, toggleBookmark } = useBookmarks(currentUser);
  const autoDeals = useAutoDeals();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const ADMIN_UID = import.meta.env.VITE_ADMIN_UID;
  const [view, setView] = useState(() => window.location.hash === '#admin' ? 'admin' : 'main');
  useEffect(() => {
    const handler = () => setView(window.location.hash === '#admin' ? 'admin' : 'main');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const [toast, setToast] = useState('');
  const [locationFilter, setLocationFilter] = useState([]);  // {value, label}[]
  const [cuisineFilter, setCuisineFilter] = useState([]);    // {value, label}[]
  const [selectedDay, setSelectedDay] = useState([]);
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  // Re-sort every minute so LIVE badges stay accurate
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const todayIndex = daysOfWeek.indexOf(TODAY);
  const daysUntilNextSpecial = (r) => {
    for (let i = 0; i <= 6; i++) {
      if (r.specials[daysOfWeek[(todayIndex + i) % 7]]) return i;
    }
    return 7;
  };

  const handleShare = useCallback((restaurant, previewText) => {
    const url = 'https://www.atlantaspecials.com';
    const text = `${restaurant.name} has a deal on Atlanta Specials!\n${previewText}`;
    if (navigator.share) {
      navigator.share({ title: restaurant.name, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setToast('Link copied!');
        setTimeout(() => setToast(''), 2000);
      });
    }
  }, []);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return restaurantsList
      .map((r) => {
        const key = toRestaurantKey(r.name);
        const autoSpecials = autoDeals.get(key);
        if (!autoSpecials) return r;
        // Merge auto-detected specials over static ones (auto wins where non-empty)
        const mergedSpecials = { ...r.specials };
        for (const [day, text] of Object.entries(autoSpecials)) {
          if (text) mergedSpecials[day] = text;
        }
        return { ...r, specials: mergedSpecials, _staticSpecials: r.specials, _autoUpdated: true };
      })
      .filter((r) => {
        const matchLoc =
          locationFilter.length === 0 ||
          locationFilter.some((o) => r.location.includes(o.value));
        const matchCuisine =
          cuisineFilter.length === 0 ||
          cuisineFilter.some((o) => o.value === r.cuisine);
        const matchSearch =
          q === '' ||
          r.name.toLowerCase().includes(q) ||
          Object.values(r.specials).some((s) => s && s.toLowerCase().includes(q));
        const matchDay =
          selectedDay.length === 0 ||
          selectedDay.some((o) => r.specials[o.value]);
        const matchSaved = !savedOnly || isBookmarked(r.name);
        const matchOpenNow = !openNowOnly || (() => {
          const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
          return getLiveInfo(r.specials[TODAY], nowMin) !== null;
        })();
        return matchLoc && matchCuisine && matchSearch && matchDay && matchSaved && matchOpenNow;
      })
      .sort((a, b) => {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

        function getSortKey(r) {
          const todayText = r.specials[TODAY];
          const liveResult = getLiveInfo(todayText, nowMin);
          if (liveResult && liveResult !== 'All day') {
            // Tier 1: countdown LIVE — sort by most time remaining first (most actionable)
            const match = liveResult.match(/(\d+)h(?:\s*(\d+)m)?|(\d+)m/);
            let rem = 0;
            if (match) rem = match[3] ? parseInt(match[3]) : (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
            return [0, -rem];
          }
          if (liveResult === 'All day') return [1, 0]; // Tier 2: all-day deal
          if (todayText) return [2, 0];                // Tier 3: today's special but not active now
          return [3, daysUntilNextSpecial(r)];          // Tier 4: upcoming
        }

        const [aTier, aSecondary] = getSortKey(a);
        const [bTier, bSecondary] = getSortKey(b);
        if (aTier !== bTier) return aTier - bTier;
        if (aSecondary !== bSecondary) return aSecondary - bSecondary;
        return a.name.localeCompare(b.name);
      });
  }, [locationFilter, cuisineFilter, selectedDay, deferredSearch, savedOnly, isBookmarked, tick, autoDeals]);

  const clearAll = () => {
    setLocationFilter([]);
    setCuisineFilter([]);
    setSelectedDay([]);
    setSearch('');
  };

  const hasFilters =
    locationFilter.length > 0 ||
    cuisineFilter.length > 0 ||
    selectedDay.length > 0 ||
    search.trim() !== '';

  // Restaurants with a special today
  const todayCount = restaurantsList.filter((r) => r.specials[TODAY]).length;

  return (
    <div className="app">
      <nav className="top-nav">
        <span className="top-nav-logo">Atlanta Specials</span>
        <div className="top-nav-auth">
          {currentUser ? (
            <>
              <span className="top-nav-username">👋 {currentUser.displayName || currentUser.email}</span>
              <button className="top-nav-btn" onClick={logout}>Sign Out</button>
            </>
          ) : (
            <button className="top-nav-btn" onClick={() => setAuthModalOpen(true)}>Sign In</button>
          )}
          <button className="top-nav-btn theme-toggle" onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {view === 'admin' && ADMIN_UID && currentUser?.uid === ADMIN_UID ? <AdminDashboard /> : <>

      <header className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">Atlanta&apos;s Best Deals</p>
          <h1>Atlanta<br />Specials</h1>
          <p className="subtitle">Daily restaurant deals, curated for you</p>
          <div className="hero-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <strong>{todayCount} restaurants</strong>&nbsp;with deals today ({TODAY})
          </div>
        </div>

        <a className="scroll-hint" href="#explore">
          <span>Explore deals</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>

        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </header>

      {/* Sticky filter bar */}
      <div id="explore" className={`filters-section${filtersOpen ? '' : ' filters-collapsed'}`}>
        {/* Collapse toggle row */}
        <div className="filters-header">
          <div className="filters-header-left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
            <span>Filters</span>
            {hasFilters && <span className="filters-active-dot" />}
          </div>
          <div className="filters-header-right">
            <button
              className={`saved-filter-btn${openNowOnly ? ' saved-filter-active' : ''}`}
              onClick={() => setOpenNowOnly(o => !o)}
            >
              <span className="open-now-dot" />
              Open Now
            </button>
            {currentUser && (
              <button
                className={`saved-filter-btn${savedOnly ? ' saved-filter-active' : ''}`}
                onClick={() => setSavedOnly(o => !o)}
              >
                <svg viewBox="0 0 24 24" fill={savedOnly ? '#e8534a' : 'none'} stroke={savedOnly ? '#e8534a' : 'currentColor'} strokeWidth="2" width="13" height="13">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
                Saved
              </button>
            )}
            <span className="results-count">
              {filtered.length === restaurantsList.length
                ? `${filtered.length} restaurants`
                : `${filtered.length} / ${restaurantsList.length}`}
            </span>
            <button className="filters-toggle-btn" onClick={() => setFiltersOpen(o => !o)}>
              <svg
                className={`filters-chevron${filtersOpen ? ' filters-chevron-up' : ''}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                width="16" height="16"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible body */}
        <div className="filters-body">
          <div className="filters-search-row">
            <input
              className="search-input"
              type="text"
              placeholder="Search by name or deal…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {hasFilters && (
              <button className="clear-btn" onClick={clearAll}>Clear</button>
            )}
          </div>
          <div className="filters-controls-row">
            <div className="filters-selects">
              <Select
                options={locationOptionsFormatted}
                value={locationFilter}
                onChange={(v) => startTransition(() => setLocationFilter(v))}
                isMulti
                isSearchable={false}
                placeholder="Location"
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                closeMenuOnScroll={true}
              />
              <Select
                options={cuisineOptionsFormatted}
                value={cuisineFilter}
                onChange={(v) => startTransition(() => setCuisineFilter(v))}
                isMulti
                isSearchable={false}
                placeholder="Cuisine"
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                closeMenuOnScroll={true}
              />
            </div>
            <DayTabs selected={selectedDay} onChange={setSelectedDay} />
          </div>
        </div>
      </div>

      <main className="main">
        <div className={`cards-grid${isPending ? ' grid-pending' : ''}`}>
          {filtered.map((r) => (
            <RestaurantCard
              key={r.name}
              restaurant={r}
              selectedDays={selectedDay}
              rating={ratings.get(toRestaurantKey(r.name))}
              onRate={submitRating}
              onSignInClick={() => setAuthModalOpen(true)}
              currentUser={currentUser}
              isBookmarked={isBookmarked(r.name)}
              onBookmark={toggleBookmark}
              onShare={handleShare}
              nowMinutes={new Date().getHours() * 60 + new Date().getMinutes()}
              isAutoUpdated={!!r._autoUpdated}
            />
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>No restaurants match your filters.</p>
              <button className="clear-btn" onClick={clearAll}>Clear filters</button>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p className="footer-cta">Know a spot we&apos;re missing?</p>
        <p className="footer-sub">Help us keep Atlanta Specials up to date.</p>
        <button className="footer-suggest-btn" onClick={() => setSubmitModalOpen(true)}>
          Submit a Deal
        </button>
        <p className="footer-fine">Always verify deals directly with the restaurant before visiting &mdash; specials may change without notice.</p>
        <p className="footer-fine">Atlanta Specials &mdash; Updated regularly &mdash; Free to use, forever.</p>
      </footer>

      </>}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {submitModalOpen && <SubmitDealModal onClose={() => setSubmitModalOpen(false)} currentUser={currentUser} onSignInClick={() => setAuthModalOpen(true)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
