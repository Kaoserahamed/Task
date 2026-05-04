import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HotelRestaurants.css';

const HotelRestaurants = () => {
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelQuery, setHotelQuery] = useState('');
  const [restaurantQuery, setRestaurantQuery] = useState('');

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const [hotelRes, restaurantRes] = await Promise.all([
          axios.get('https://backend-eight-tan-16.vercel.app/api/hotels'),
          axios.get('https://backend-eight-tan-16.vercel.app/api/restaurants'),
        ]);
        setHotels(hotelRes.data || []);
        setRestaurants(restaurantRes.data || []);
      } catch (error) {
        console.error('API fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  const renderCard = (place, type) => (
    <div className="place-card" key={place._id}>
      <div className="card-image-wrapper">
        <img
          src={type === 'hotel' ? '/a.jpg' : '/b.jpg'}
          alt={place.name || 'No Name'}
          className="card-image"
        />
      </div>
      <div className="card-info">
        <h3>{place.name || 'Unnamed Place'}</h3>
        <p><i className="fas fa-map-marker-alt"></i> {place.exactLocation || place.location || 'Unknown'}</p>
        <p><i className="fas fa-phone-alt"></i> {place.contact || 'N/A'}</p>
        <p><i className="fas fa-star"></i> {place.rating || 'N/A'}</p>
        <p className="card-description">{place.description || 'No description available.'}</p>
      </div>
    </div>
  );

  const filteredHotels = hotels.filter(h =>
    h.name?.toLowerCase().includes(hotelQuery.toLowerCase()) ||
    h.location?.toLowerCase().includes(hotelQuery.toLowerCase())
  );

  const filteredRestaurants = restaurants.filter(r =>
    r.name?.toLowerCase().includes(restaurantQuery.toLowerCase()) ||
    r.location?.toLowerCase().includes(restaurantQuery.toLowerCase())
  );

  return (
    <div className="hotel-restaurant-page">
      <section>
        <h1 className="section-heading">🏨 Hotels</h1>
        <input
          type="text"
          className="search-input"
          placeholder="Search hotels by name or location..."
          value={hotelQuery}
          onChange={(e) => setHotelQuery(e.target.value)}
        />
        {loading ? <p className="loading">Loading hotels...</p> : (
          <div className="cards-container">
            {filteredHotels.length > 0
              ? filteredHotels.map(hotel => renderCard(hotel, 'hotel'))
              : <p className="empty">No hotels found.</p>}
          </div>
        )}
      </section>

      <section>
        <h1 className="section-heading">🍽️ Restaurants</h1>
        <input
          type="text"
          className="search-input"
          placeholder="Search restaurants by name or location..."
          value={restaurantQuery}
          onChange={(e) => setRestaurantQuery(e.target.value)}
        />
        {loading ? <p className="loading">Loading restaurants...</p> : (
          <div className="cards-container">
            {filteredRestaurants.length > 0
              ? filteredRestaurants.map(restaurant => renderCard(restaurant, 'restaurant'))
              : <p className="empty">No restaurants found.</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelRestaurants;

