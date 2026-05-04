import React, { useEffect, useState } from 'react';
import './Places.css';

const PLACES_API_KEY = 'AIzaSyCfoKSQIcf9b3mH10oKLmEV4sS--2_NhFE';

const Places = () => {
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = '23.8103,90.4125'; // Default: Dhaka

  const fetchPlaces = async (type, setter) => {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=5000&type=${type}&key=${PLACES_API_KEY}`;

    try {
      const res = await fetch(`/proxy?target=${encodeURIComponent(url)}`);
      const data = await res.json();
      setter(data.results || []);
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlaces('restaurant', setRestaurants);
    fetchPlaces('lodging', setHotels);
    setLoading(false);
  }, []);

  return (
    <div className="places-container">
      <h2>🏨 Nearby Hotels</h2>
      {loading ? <p>Loading...</p> : (
        <div className="place-grid">
          {hotels.map((place, index) => (
            <div className="place-card" key={index}>
              <h3>{place.name}</h3>
              <p>{place.vicinity}</p>
              <p>⭐ {place.rating || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}

      <h2>🍽️ Nearby Restaurants</h2>
      {loading ? <p>Loading...</p> : (
        <div className="place-grid">
          {restaurants.map((place, index) => (
            <div className="place-card" key={index}>
              <h3>{place.name}</h3>
              <p>{place.vicinity}</p>
              <p>⭐ {place.rating || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Places;

