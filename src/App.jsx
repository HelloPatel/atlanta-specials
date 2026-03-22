import React, { useState, useMemo } from 'react';
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
    borderRadius: '10px',
    border: state.isFocused ? '2px solid #e8534a' : '2px solid #e0e0e0',
    boxShadow: 'none',
    minHeight: '44px',
    fontSize: '14px',
    '&:hover': { borderColor: '#e8534a' },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#fde9e8',
    borderRadius: '6px',
  }),
  multiValueLabel: (base) => ({ ...base, color: '#c0392b', fontWeight: 600 }),
  multiValueRemove: (base) => ({
    ...base,
    color: '#c0392b',
    '&:hover': { backgroundColor: '#e8534a', color: '#fff' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#e8534a'
      : state.isFocused
      ? '#fde9e8'
      : 'white',
    color: state.isSelected ? 'white' : '#333',
    fontSize: '14px',
  }),
};

function SpecialsRow({ day, text, isToday, isVisible }) {
  if (!isVisible || !text) return null;
  return (
    <div className={`special-row ${isToday ? 'today' : ''}`}>
      <span className="day-chip">{day.slice(0, 3)}</span>
      <span className="special-text">{text}</span>
    </div>
  );
}

function RestaurantCard({ restaurant, selectedDays }) {
  const showDay = (day) =>
    selectedDays.length === 0 || selectedDays.some((d) => d.value === day);

  const hasVisibleSpecials = daysOfWeek.some(
    (day) => showDay(day) && restaurant.specials[day]
  );

  if (!hasVisibleSpecials) return null;

  return (
    <div className="card">
      <div className="card-header">
        <a
          href={restaurant.website}
          target="_blank"
          rel="noopener noreferrer"
          className="restaurant-name"
        >
          {restaurant.name}
          <svg className="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <div className="card-meta">
          <span className="badge cuisine">{restaurant.cuisine}</span>
          {restaurant.location.map((loc) => (
            <span key={loc} className="badge location">{loc}</span>
          ))}
        </div>
      </div>
      <div className="specials-list">
        {daysOfWeek.map((day) => (
          <SpecialsRow
            key={day}
            day={day}
            text={restaurant.specials[day]}
            isToday={day === TODAY}
            isVisible={showDay(day)}
          />
        ))}
      </div>
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

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <h1>Atlanta Specials</h1>
          <p className="subtitle">Find the best daily deals at Atlanta restaurants</p>
          <div className="today-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Today is <strong>{TODAY}</strong>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="filters-bar">
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
            placeholder="Filter by location"
            styles={selectStyles}
          />
          <Select
            options={cuisineOptionsFormatted}
            value={cuisineFilter}
            onChange={setCuisineFilter}
            isMulti
            isSearchable={false}
            placeholder="Filter by cuisine"
            styles={selectStyles}
          />
          <Select
            options={daysFormatted}
            value={selectedDay}
            onChange={setSelectedDay}
            isMulti
            isSearchable={false}
            placeholder="Filter by day"
            styles={selectStyles}
          />
          {hasFilters && (
            <button className="clear-btn" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        <div className="results-count">
          {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found
        </div>

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
        <p>Atlanta Specials &mdash; Updated regularly. Know a spot we&apos;re missing? Let us know!</p>
      </footer>
    </div>
  );
}
