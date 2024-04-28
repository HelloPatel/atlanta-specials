import React, { useState } from 'react';
import './App.css'; // Import CSS file for styling
import restaurantImage from './img/restaurant-image.jpg'; // Import your restaurant image

function App() {
  // Sample restaurant data
  const restaurants = [
    { name: 'Postinos', location: ['Buckhead', 'West Midtown'], cuisine: 'American', specials: { Monday: '$25 for wine and bruschetta board after 8PM', Tuesday: '$25 for wine and bruschetta board after 8PM', Wednesday: '', Thursday: '', Friday: '', Saturday: 'Brunch', Sunday: 'Brunch' }, website: 'https://www.postinowinecafe.com' },
    { name: 'Pachengos', location: ['Buckhead'], cuisine: 'Mexican', specials: { Monday: '', Tuesday: 'Dive into the deliciousness of $2 Taco Tuesday, all day long! Indulge in mouthwatering options including pollo, asada, pastor, and rajas (veggie). Please note, that this special is exclusive for dine-in only.', Wednesday: 'Calling all industry folks! It\'s Industry Night at Pachengo! Enjoy $5 house tequila shots and complimentary chips & salsa from 5 pm to closing.', Thursday: 'Ladies, gather your squad for Tequila Thursday! Sip on $9 Margaritas, $5 Beer, and $8 Wine from 5 pm to closing. ', Friday: 'Get ready to groove at Pachengo\'s Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It\'s a weekend party you won\'t want to miss!', Saturday: 'Get ready to groove at Pachengo\'s Latino Night! From 6 pm to 10 pm, a live DJ will set the perfect vibe. Plus, enjoy free chips & salsa from 9 pm until closing. It\'s a weekend party you won\'t want to miss!', Sunday: 'Sunday Brunch' }, website: 'https://www.pachengos.com/' },
    { name: 'Restaurant C', location: ['Atlanta'], cuisine: 'American', specials: { Monday: 'Burger Monday', Tuesday: 'Steak Tuesday', Wednesday: 'Seafood Wednesday', Thursday: 'Wine Thursday', Friday: 'Fish Fryday', Saturday: 'BBQ Night', Sunday: 'Family Dinner' }, website: 'https://restaurantC.com' },
    // Add more restaurant objects as needed
  ];

  // Options for location filter dropdown
  const locationOptions = ['All', 'Atlanta', 'New York', 'Los Angeles', 'Chicago']; // Sample options

  // Options for cuisine filter dropdown
  const cuisineOptions = ['All', 'Italian', 'Mexican', 'American', 'Japanese']; // Sample options

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // States for filters
  const [locationFilter, setLocationFilter] = useState('All');
  const [cuisineFilter, setCuisineFilter] = useState('All');

  // Filtered restaurants based on location and cuisine
  const filteredRestaurants = restaurants.filter((restaurant) => {
    return (
      (locationFilter === 'All' || restaurant.location.includes(locationFilter)) &&
      (cuisineFilter === 'All' || restaurant.cuisine === cuisineFilter)
    );
  });

  return (
    <div className="container">
      <h1 className="title">Atlanta Specials Review</h1>
      <img src={restaurantImage} alt="Restaurant" className="restaurant-image" />
      <div className="filters">
        <label>Location Filter:</label>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          {locationOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
        <label>Cuisine Type Filter:</label>
        <select value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}>
          {cuisineOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
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
                        <tr key={day}>
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
