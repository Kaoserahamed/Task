import React, { useContext, useState, useEffect } from 'react';

import { useNavigate, Link } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import './WeatherRecommended.css';

const WeatherRecommended = () => {
  const navigate = useNavigate();
  const { tours, loading, error } = useContext(ToursContext);
  const [averageRatings, setAverageRatings] = useState({});
  const handleExplore = (packageId) => {
    navigate(`/package/${packageId}`);
  };
  const handleExploreNow = async (tourId) => {
    try {
      await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/increment-view`, {
        method: 'PATCH',
      });
      navigate(`/package/${tourId}`);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      navigate(`/package/${tourId}`); // Navigate anyway
    }
  };
  useEffect(() => {
    // Fetch all reviews and compute average ratings
    const fetchReviews = async () => {
      try {
        const res = await fetch('https://backend-eight-tan-16.vercel.app/reviews');
        const reviews = await res.json();

        const ratingMap = {};

        reviews.forEach(review => {
          const tourId = review.tourId;
          if (!ratingMap[tourId]) {
            ratingMap[tourId] = { total: 0, count: 0 };
          }
          ratingMap[tourId].total += review.rating;
          ratingMap[tourId].count += 1;
        });

        const averages = {};
        for (const tourId in ratingMap) {
          const { total, count } = ratingMap[tourId];
          averages[tourId] = (total / count).toFixed(1);
        }

        setAverageRatings(averages);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading recommended tours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-circle"></i>
        <p>Error loading recommended tours. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="popular-tours">
      <div className="popular-tours-header">
        <h2>Perfect Tours for current weather</h2>
      </div>
      <div className="tour-scroll-container">
        <div className="tour-row">
          {tours.slice(0,4).map(tour => {
            const averageRating = averageRatings[tour._id];
            return (
              <div key={tour._id} className="tour-card">
                <div className="tour-image">
                  <img
                    src={`https://backend-eight-tan-16.vercel.app/${tour.images[0]}`}
                    alt={tour.name}
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/300/200';
                    }}
                  />
                </div>
                <div className="tour-info">
                  <h3>{tour.name || 'Untitled Tour'}</h3>
                  <div className="tour-details">
                    <span>
                      Price: <strong>${tour.price || 'N/A'}</strong>
                    </span>
                    <span>
                      <i className="fas fa-tag"></i> {tour.packageCategories || 'General'}
                    </span>
                    <span>
                      <i className="fas fa-star"></i>{' '}
                      {averageRating ? `${averageRating} / 5` : 'No Rating'}
                    </span>
                  </div>
                  <div className="tour-actions">
                    <Link to="#" onClick={() => handleExploreNow(tour._id)} className="view-details-btn">
                      Explore Now <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherRecommended;
