import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PackageGrid.css';

const PackageGrid = ({ packages }) => {
  const navigate = useNavigate();
  const [averageRatings, setAverageRatings] = useState({});

  // Helper function to check if tour is completed
  const isTourCompleted = (startDate) => {
    if (!startDate) return false;
    const now = new Date();
    const tourStartDate = new Date(startDate);
    return tourStartDate < now;
  };

  const handleExploreNow = async (tourId) => {
    try {
      await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/increment-view`, {
        method: 'PATCH',
      });
      navigate(`/package/${tourId}`);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      navigate(`/package/${tourId}`);
    }
  };

  useEffect(() => {
    const fetchAverageRatings = async () => {
      try {
        const res = await fetch('https://backend-eight-tan-16.vercel.app/reviews');
        const reviews = await res.json();

        const ratingMap = {};
        const countMap = {};

        reviews.forEach(review => {
          const tourId = review.tourId;
          if (!ratingMap[tourId]) {
            ratingMap[tourId] = 0;
            countMap[tourId] = 0;
          }
          ratingMap[tourId] += review.rating;
          countMap[tourId] += 1;
        });

        const averages = {};
        for (const id in ratingMap) {
          averages[id] = ratingMap[id] / countMap[id];
        }

        setAverageRatings(averages);
      } catch (err) {
        console.error("Error fetching average ratings:", err);
      }
    };

    // Only fetch ratings if we have packages to display
    if (packages.length > 0) {
      fetchAverageRatings();
    }
  }, [packages]);

  if (packages.length === 0) {
    return (
      <div className="package-grid-empty">
        <i className="fas fa-search"></i>
        <p>No packages found for this category.</p>
        <p>Please try a different category or check back later.</p>
      </div>
    );
  }

  return (
    <div className="package-grid">
      {packages.map(tour => {
        const averageRating = averageRatings[tour._id] || tour.popularity?.rating?.average;
        const isCompleted = isTourCompleted(tour.startDate);
        
        return (
          <div key={tour._id} className="package-card">
            <div className="package-image">
              <img
                src={`https://backend-eight-tan-16.vercel.app/${tour.images[0]}`}
                alt={tour.name}
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/300/200';
                }}
              />
              {isCompleted && <span className="package-completed-tag">Completed</span>}
            </div>
            <div className="package-info">
              <h3>{tour.name || 'Untitled Tour'}</h3>
              <div className="package-details">
                <span>
                  <i className="fas fa-dollar-sign"></i>
                  <strong>${tour.price || 'N/A'}</strong>
                </span>
                <span>
                  <i className="fas fa-tag"></i>
                  {tour.packageCategories || 'General'}
                </span>
                <span>
                  <i className="fas fa-star"></i>
                  {averageRating ? `${averageRating.toFixed(1)} / 5` : 'No Rating'}
                </span>
              </div>
              <div className="package-actions">
                <Link 
                  to="#" 
                  onClick={() => handleExploreNow(tour._id)} 
                  className="package-view-btn"
                >
                  Explore Now
                  {!isCompleted && <i className="fas fa-arrow-right"></i>}
                  {isCompleted && ' (Tour Ended)'}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PackageGrid;
