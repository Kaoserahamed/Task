import React from 'react';
import { Link } from 'react-router-dom';
import './TrendingDestinations.css';

const TrendingDestinations = () => {
  const destinations = [
    {
      id: 1,
      name: 'Santorini',
      country: 'Greece',
      rating: 4.8,
      reviews: 1250,
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e',
      price: 1499,
      description: 'Iconic white-washed buildings and stunning sunsets'
    },
    {
      id: 2,
      name: 'Machu Picchu',
      country: 'Peru',
      rating: 4.9,
      reviews: 2100,
      image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1',
      price: 1899,
      description: 'Ancient Incan citadel set high in the Andes Mountains'
    },
    {
      id: 3,
      name: 'Dubai',
      country: 'UAE',
      rating: 4.7,
      reviews: 3300,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
      price: 2299,
      description: 'Ultra-modern architecture and luxury shopping'
    },
    {
      id: 4,
      name: 'Kyoto',
      country: 'Japan',
      rating: 4.8,
      reviews: 1800,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
      price: 1699,
      description: 'Traditional temples and beautiful gardens'
    }
  ];

  return (
    <section className="trending-destinations">
      <div className="section-header">
        <div className="header-content">
          <p>Most popular choices for travelers this month</p>
        </div>
        <Link to="/destinations" className="view-all">
          View All <i className="fas fa-arrow-right"></i>
        </Link>
      </div>

      <div className="destinations-grid">
        {destinations.map(destination => (
          <div key={destination.id} className="destination-card">
            <div className="destination-image">
              <img src={destination.image} alt={destination.name} />
              <div className="destination-price">
                From ${destination.price}
              </div>
            </div>
            <div className="destination-content">
              <div className="destination-header">
                <div className="destination-title">
                  <h3>{destination.name}</h3>
                  <span className="country">
                    <i className="fas fa-map-marker-alt"></i> {destination.country}
                  </span>
                </div>
                <div className="destination-rating">
                  <span className="rating">
                    <i className="fas fa-star"></i> {destination.rating}
                  </span>
                  <span className="reviews">({destination.reviews})</span>
                </div>
              </div>
              <p className="destination-description">{destination.description}</p>
              <div className="destination-footer">
                <button className="explore-btn">
                  Explore Now <i className="fas fa-arrow-right"></i>
                </button>
                <button className="wishlist-btn">
                  <i className="far fa-heart"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrendingDestinations; 
