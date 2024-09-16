import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedDonation, setSelectedDonation] = useState("");
  const [customDonation, setCustomDonation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleCustomDonationChange = (e) => {
    setCustomDonation(e.target.value);
    if (e.target.value === "") {
      setSelectedDonation("0");
    } else {
      setSelectedDonation(e.target.value);
    }
  };

  const handleDonationSelect = (amount) => {
    setSelectedDonation(amount);
    setCustomDonation("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log({
      selectedDonation,
      customDonation,
      name,
      email,
      cardNumber,
      expiryDate,
      cvv
    });
  };

  return (
    <div className="container">
        <img
          src='title.png'
          alt="Main" 
          className="title-image" 
        />
      <h1>Help CFE Raise $125K to Create Opportunity & Activate Potential in Underrepresented Communities!</h1>

      <div className="progress-bar">
        <div className="progress" style={{ width: '50%' }}></div>
      </div>

      <div className="donation-summary">
        <p><strong>$62,552</strong> of $125,000 raised by 159 donors</p>
        <img
          src='donate.png'
          alt="Main" 
          className="main-image" 
        />
      </div>

      <div className="donation-options">
        <div 
          className={`donation-card ${selectedDonation === "250" ? 'selected' : ''}`} 
          onClick={() => handleDonationSelect("250")}
        >
          <h2>$250 Donation</h2>
          <p>With your donation of $250 or more, we will gift you a Charter Membership to our thriving BIPOC-centered community.</p>
        </div>
        <div 
          className={`donation-card ${selectedDonation === "50" ? 'selected' : ''}`} 
          onClick={() => handleDonationSelect("50")}
        >
          <h2>$50 Donation</h2>
          <p>With your donation of $50 or more, we will gift you the eBook, <strong>30 Days to Greater Self Love</strong>, to help celebrate YOU.</p>
        </div>
        <div 
          className={`donation-card ${customDonation !== "" || selectedDonation === "0" ? 'selected' : ''}`}
          onClick={() => handleDonationSelect("0")}
        >
          <h2>Custom Donation</h2>
          <p>Any amount you can give helps us reach our goals. It's all about gratitude!</p>
          <input 
            type="text" 
            placeholder="$ USD" 
            value={customDonation}
            onChange={handleCustomDonationChange}
            onClick={() => handleDonationSelect("0")}
          />
        </div>
      </div>

      {selectedDonation && (
        <div className="selected-amount">
          {customDonation !== "" || selectedDonation === "0"
            ? <p>You have selected a custom donation of <strong>${customDonation || "0"}</strong></p>
            : <p>You have selected a donation of <strong>${selectedDonation}</strong></p>
          }
        </div>
      )}

      <div className="personal-info">
        <h2>Personal Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cardNumber">Credit Card Number:</label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date (MM/YY):</label>
            <input
              type="text"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cvv">CVV:</label>
            <input
              type="text"
              id="cvv"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-button">Submit Donation</button>
        </form>
      </div>

      <div className="image-grid">
        <img src="donation1.png" alt="Person 1" />
        <img src="donation2.png" alt="Person 2" />
        <img src="donation3.png" alt="Person 3" />
        <img src="donation4.png" alt="Person 4" />
        <img src="donation5.png" alt="Person 5" />
      </div>

      <footer>
        <p>&copy; 2024 Coaching for Everyone</p>
      </footer>
    </div>
  );
}

export default App;
