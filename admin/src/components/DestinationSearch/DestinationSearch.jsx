import React, { useState } from 'react';
import './DestinationSearch.css';

const DestinationSearch = () => {
  const [query, setQuery] = useState('');
  const [destinations, setDestinations] = useState([
    { name: 'Paris', transport: 'Car', price: '$100' },
    { name: 'Tokyo', transport: 'Auto', price: '$80' },
  ]);

  const handleSearch = () => {
    // For now, just filter destinations based on query
    setDestinations(
      destinations.filter((dest) => dest.name.toLowerCase().includes(query.toLowerCase()))
    );
  };

  return (
    <div className="destination-search">
      <h2>Destination Search</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for destinations"
      />
      <button onClick={handleSearch}>Search</button>

      <div className="results">
        {destinations.map((destination, index) => (
          <div key={index} className="destination-card">
            <h3>{destination.name}</h3>
            <p>Transport: {destination.transport}</p>
            <p>Price: {destination.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DestinationSearch;
