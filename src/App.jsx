import { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue, useTransition } from 'react';
import './App.css';
import {
  daysOfWeek,
  locationOptions,
  cuisineOptions,
  restaurantsList,
} from './common/commonComponents';

const TODAY = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// Horizontally-scrollable toggle chip row
function FilterChips({ options, selected, onChange }) {
  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  return (
    <div className="filter-chips">
      {options.filter((o) => o !== 'All').map((opt) => (
        <button
          key={opt}
          className={`filter-chip${selected.includes(opt) ? ' filter-chip-on' : ''}`}
          onClick={() => toggle(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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

  // Move marker to selected tab on mount + selection change
  useEffect(() => {
    if (selectedKey) {
      const pos = getPos(selectedKey);
      if (pos) { setMarker(pos); setMarkerVisible(true); }
    } else {
      setMarkerVisible(false);
    }
  }, [selectedKey, getPos]);

  // Reposition on window resize (debounced)
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

function RestaurantCard({ restaurant, selectedDays }) {
  const [expanded, setExpanded] = useState(false);
  const [cardRef, visible] = useReveal();

  const showDay = (day) =>
    selectedDays.length === 0 || selectedDays.some((d) => d.value === day);

  const visibleDays = daysOfWeek.filter(
    (day) => showDay(day) && restaurant.specials[day]
  );

  if (visibleDays.length === 0) return null;

  // In collapsed mode: show today's special or the first available special as preview
  const previewDay = visibleDays.includes(TODAY) ? TODAY : visibleDays[0];
  const previewText = restaurant.specials[previewDay];
  const otherCount = visibleDays.length - 1;

  return (
    <div ref={cardRef} className={`card${expanded ? ' card-expanded' : ''}${visible ? ' card-visible' : ''}`}>
      <button className="card-toggle" onClick={() => setExpanded(!expanded)}>
        {restaurant.image && (
          <img
            className="card-image"
            src={restaurant.image}
            alt={restaurant.name}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
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
        </div>

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

      {/* Expanded specials list */}
      {expanded && (
        <div className="specials-list">
          {visibleDays.map((day) => (
            <div
              key={day}
              className={`special-row ${day === TODAY ? 'today' : ''}`}
            >
              <span className={`day-chip ${day === TODAY ? 'today-chip' : ''}`}>
                {day === TODAY ? 'TODAY' : day.slice(0, 3).toUpperCase()}
              </span>
              <span className="special-text">{restaurant.specials[day]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [locationFilter, setLocationFilter] = useState([]);
  const [cuisineFilter, setCuisineFilter] = useState([]);
  const [selectedDay, setSelectedDay] = useState([]);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);
const todayIndex = daysOfWeek.indexOf(TODAY);
  const daysUntilNextSpecial = (r) => {
    for (let i = 0; i <= 6; i++) {
      if (r.specials[daysOfWeek[(todayIndex + i) % 7]]) return i;
    }
    return 7;
  };

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return restaurantsList
      .filter((r) => {
        const matchLoc =
          locationFilter.length === 0 ||
          locationFilter.some((loc) => r.location.includes(loc));
        const matchCuisine =
          cuisineFilter.length === 0 ||
          cuisineFilter.includes(r.cuisine);
        const matchSearch =
          q === '' ||
          r.name.toLowerCase().includes(q) ||
          Object.values(r.specials).some((s) => s && s.toLowerCase().includes(q));
        const matchDay =
          selectedDay.length === 0 ||
          selectedDay.some((o) => r.specials[o.value]);
        return matchLoc && matchCuisine && matchSearch && matchDay;
      })
      .sort((a, b) => daysUntilNextSpecial(a) - daysUntilNextSpecial(b));
  }, [locationFilter, cuisineFilter, selectedDay, deferredSearch]);

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
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white"/>
          </svg>
        </div>
      </header>

      {/* Sticky filter bar */}
      <div id="explore" className="filters-section">
        {/* Row 1: Search */}
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
        {/* Row 2: Filter chips */}
        <div className="filters-chips-row">
          <FilterChips
            options={locationOptions}
            selected={locationFilter}
            onChange={(v) => startTransition(() => setLocationFilter(v))}
          />
          <FilterChips
            options={cuisineOptions}
            selected={cuisineFilter}
            onChange={(v) => startTransition(() => setCuisineFilter(v))}
          />
        </div>
        {/* Row 3: Day tabs */}
        <DayTabs selected={selectedDay} onChange={setSelectedDay} />
        <div className="results-count">
          {filtered.length === restaurantsList.length
            ? `${filtered.length} restaurants with deals`
            : `${filtered.length} of ${restaurantsList.length} restaurants match`}
          {' '}— tap any card to expand
        </div>
      </div>

      <main className="main">
        <div className={`cards-grid${isPending ? ' grid-pending' : ''}`}>
          {filtered.map((r) => (
            <RestaurantCard key={r.name} restaurant={r} selectedDays={selectedDay} />
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
        <a href="mailto:atlantaspecials@gmail.com" className="footer-suggest-btn">
          Suggest a Restaurant
        </a>
        <p className="footer-fine">Atlanta Specials &mdash; Updated regularly &mdash; Free to use, forever.</p>
      </footer>
    </div>
  );
}
