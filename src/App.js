// Import necessary React Router components
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import the donation component
import DonatePage from './DonatePage'; // Assuming your donation page is the current App component

function App() {
  return (
    <Router>
      <Routes>
        {/* Define the route for the /donate page */}
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/" element={<DonatePage />} />

        {/* Add any other routes for other pages */}
      </Routes>
    </Router>
  );
}

export default App;