import { useState, useMemo } from 'react';
import Select from 'react-select';
import './App.css';
import {
  daysOfWeek,
  locationOptions,
  cuisineOptions,
  restaurantsList,
} from './common/commonComponents';

const TODAY = daysOfWeek[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '8px',
    border: state.isFocused ? '2px solid #e8534a' : '2px solid #e0e0e0',
    boxShadow: 'none',
    minHeight: '42px',
    fontSize: '13px',
    background: 'white',
    '&:hover': { borderColor: '#e8534a' },
  }),
  multiValue: (base) => ({ ...base, backgroundColor: '#fde9e8', borderRadius: '5px' }),
  multiValueLabel: (base) => ({ ...base, color: '#c0392b', fontWeight: 600, fontSize: '12px' }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#c0392b',
    '&:hover': { backgroundColor: '#e8534a', color: '#fff' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#e8534a' : state.isFocused ? '#fde9e8' : 'white',
    color: state.isSelected ? 'white' : '#333',
    fontSize: '13px',
  }),
  placeholder: (base) => ({ ...base, color: '#aaa', fontSize: '13px' }),
  menu: (base) => ({ ...base, zIndex: 200 }),
};

function RestaurantCard({ restaurant, selectedDays }) {
  const [expanded, setExpanded] = useState(false);

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
    <div className={`card ${expanded ? 'card-expanded' : ''}`}>
      <button className="card-toggle" onClick={() => setExpanded(!expanded)}>
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

  const locationOptionsFormatted = locationOptions
    .filter((o) => o !== 'All')
    .map((o) => ({ value: o, label: o }));
  const cuisineOptionsFormatted = cuisineOptions
    .filter((o) => o !== 'All')
    .map((o) => ({ value: o, label: o }));
  const daysFormatted = daysOfWeek.map((d) => ({ value: d, label: d }));

  const filtered = useMemo(() => {
    return restaurantsList.filter((r) => {
      const matchLoc =
        locationFilter.length === 0 ||
        locationFilter.some((o) => r.location.includes(o.value));
      const matchCuisine =
        cuisineFilter.length === 0 ||
        cuisineFilter.some((o) => r.cuisine === o.value);
      const matchSearch =
        search.trim() === '' ||
        r.name.toLowerCase().includes(search.toLowerCase());
      const matchDay =
        selectedDay.length === 0 ||
        selectedDay.some((o) => r.specials[o.value]);
      return matchLoc && matchCuisine && matchSearch && matchDay;
    });
  }, [locationFilter, cuisineFilter, selectedDay, search]);

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
          <h1>Atlanta Specials</h1>
          <p className="subtitle">Discover the best daily deals at Atlanta restaurants</p>
          <div className="hero-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <strong>{todayCount} restaurants</strong>&nbsp;have deals today ({TODAY})
          </div>
        </div>
      </header>

      <div className="hero-wave">
        <svg viewBox="0 0 1440 32" preserveAspectRatio="none">
          <path d="M0,16 C360,32 1080,0 1440,16 L1440,32 L0,32 Z" fill="white"/>
        </svg>
      </div>

      {/* Sticky filter bar */}
      <div className="filters-section">
        <div className="filters-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={locationOptionsFormatted}
            value={locationFilter}
            onChange={setLocationFilter}
            isMulti
            isSearchable={false}
            placeholder="Location"
            styles={selectStyles}
          />
          <Select
            options={cuisineOptionsFormatted}
            value={cuisineFilter}
            onChange={setCuisineFilter}
            isMulti
            isSearchable={false}
            placeholder="Cuisine"
            styles={selectStyles}
          />
          <Select
            options={daysFormatted}
            value={selectedDay}
            onChange={setSelectedDay}
            isMulti
            isSearchable={false}
            placeholder="Day"
            styles={selectStyles}
          />
          {hasFilters && (
            <button className="clear-btn" onClick={clearAll}>Clear</button>
          )}
        </div>
        <div className="results-count">
          {filtered.length === restaurantsList.length
            ? `${filtered.length} restaurants with deals`
            : `${filtered.length} of ${restaurantsList.length} restaurants match`}
          {' '}— tap any card to expand
        </div>
      </div>

      <main className="main">
        <div className="cards-grid">
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
