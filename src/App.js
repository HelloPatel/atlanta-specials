// App.js

import React, { useState } from 'react';
import './App.css'; // Import CSS file for styling
import restaurantImage from './img/restaurant-image.jpg'; // Import your restaurant image
import { daysOfWeek, locationOptions, cuisineOptions, restaurantsList } from './common/commonComponents'; // Import common function and properties
import Select from 'react-select'; // Import react-select component

function App() {
  // Sample restaurant data
  const restaurants = restaurantsList;

  // States for filters
  const [locationFilter, setLocationFilter] = useState([]);
  const [cuisineFilter, setCuisineFilter] = useState([]);
  const [selectedDay, setSelectedDay] = useState([]);

  // Convert options to react-select format
  const locationOptionsFormatted = locationOptions.map(option => ({ value: option, label: option }));
  const cuisineOptionsFormatted = cuisineOptions.map(option => ({ value: option, label: option }));
  const daysOfWeekFormatted = daysOfWeek.map(day => ({ value: day, label: day }));

  // Filtered restaurants based on location, cuisine, and selected day
  const filteredRestaurants = restaurants.filter((restaurant) => {
    return (
      (locationFilter.length === 0 || locationFilter.some(option => restaurant.location.includes(option.value))) &&
      (cuisineFilter.length === 0 || cuisineFilter.some(option => restaurant.cuisine === option.value)) &&
      (selectedDay.length === 0 || selectedDay.some(option => restaurant.specials[option.value] !== undefined))
    );
  });

  return (
    <div className="container">
      <h1 className="title">Atlanta Specials</h1>
      <div className="filters">
        <label>Location:</label>
        <div className="select-wrapper">
          <Select
            options={locationOptionsFormatted}
            value={locationFilter}
            onChange={(selectedOptions) => setLocationFilter(selectedOptions)}
            isMulti
          />
        </div>
        <label>Cuisine Type:</label>
        <div className="select-wrapper">
          <Select
            options={cuisineOptionsFormatted}
            value={cuisineFilter}
            onChange={(selectedOptions) => setCuisineFilter(selectedOptions)}
            isMulti
          />
        </div>
        <label>Day of the Week:</label>
        <div className="select-wrapper">
          <Select
            options={daysOfWeekFormatted}
            value={selectedDay}
            onChange={(selectedOptions) => setSelectedDay(selectedOptions)}
            isMulti
          />
        </div>
      </div>
      <div className="table-container">
        <table className="restaurant-table">
          <thead>
            <tr>
              <th>Restaurant Name</th>
              <th>Location</th>
              <th>Cuisine Type</th>
              <th>Specials</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestaurants.map((restaurant, index) => (
              <tr key={index}>
                <td><a href={restaurant.website} target="_blank" rel="noopener noreferrer">{restaurant.name}</a></td>
                <td>{restaurant.location.join(', ')}</td>
                <td>{restaurant.cuisine}</td>
                <td>
                  <table className="specials-table">
                    <tbody>
                      {daysOfWeek.map((day) => (
                        <tr key={day} style={{ display: selectedDay.length === 0 || selectedDay.some(option => option.value === day) ? 'table-row' : 'none' }}>
                          <td className="day-of-week">{day}</td>
                          <td>{restaurant.specials[day]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
