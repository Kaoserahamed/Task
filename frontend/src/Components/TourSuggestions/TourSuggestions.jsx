import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import { useAuth } from '../../Context/AuthContext';
import './TourSuggestions.css';

const TourSuggestions = ({ weatherCity }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averageRatings, setAverageRatings] = useState({});
  const { tours } = useContext(ToursContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  console.log('Weather City:', weatherCity);

  // Consistent user data access like in ProfileInfo
  const userData = user?.user || user;

  // Fetch average ratings
  useEffect(() => {
    const fetchRatings = async () => {
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
        console.error("Error fetching reviews:", err);
      }
    };

    fetchRatings();
  }, []);

  // Helper function to check if a tour is upcoming
  const isTourUpcoming = (startDate) => {
    if (!startDate) return false;
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    oneDayFromNow.setHours(0, 0, 0, 0); // Start of day
    
    const tourStartDate = new Date(startDate);
    return tourStartDate >= oneDayFromNow;
  };

  // Fetch suggestions based on user's recent activity or popular tours
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!tours || tours.length === 0 || !weatherCity) return;
      const recentViews = JSON.parse(localStorage.getItem('recentTourViews') || '[]');
      console.log('console'+recentViews);
      let allSuggestedTours=new Set();
      if (recentViews.length > 0) {
      console.log(recentViews);
        // Get suggestions based on recent views
        for (const tourName of recentViews.slice(0, 3)) { // Use last 3 viewed tours
              suggestions.forEach(name => allSuggestedTours.add(tourName));
        }
      }
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://backend-eight-tan-16.vercel.app/Suggestion/${encodeURIComponent(weatherCity)}`);
        if (response.ok) {
          const suggestedData = await response.json();
          console.log('Suggested data:', suggestedData);

          // Flatten all tours from suggestions into a single array
           allSuggestedTours = suggestedData.reduce((acc, suggestion) => {
            return [...acc, ...suggestion.tours];
          }, []);
          console.log(allSuggestedTours);
          // Remove duplicates based on tour ID and ensure tours are upcoming
          const uniqueTours = Array.from(
            new Map(
              allSuggestedTours
                .filter(tour => isTourUpcoming(tour.startDate))
                .map(tour => [tour._id, tour])
            ).values()
          );

          // Sort by confidence (if available) and limit to 6
          const sortedTours = uniqueTours
            .sort((a, b) => {
              const confidenceA = suggestedData.find(s => s.tours.some(t => t._id === a._id))?.confidence || 0;
              const confidenceB = suggestedData.find(s => s.tours.some(t => t._id === b._id))?.confidence || 0;
              return confidenceB - confidenceA;
            })
            .slice(0, 6);

          setSuggestions(sortedTours);
        } else {
          throw new Error('Failed to fetch suggestions');
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions');
        // Fallback to upcoming tours
        const upcomingTours = tours
          .filter(tour => tour.status === 'approved' && isTourUpcoming(tour.startDate))
          .slice(0, 6);
        setSuggestions(upcomingTours);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [tours, weatherCity]);

  const handleExploreNow = async (tourId, tourName) => {
    try {
      // Increment view count
      await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/increment-view`, {
        method: 'PATCH',
      });

      // Save to recent views
      const recentViews = JSON.parse(localStorage.getItem('recentTourViews') || '[]');
      const updatedViews = [tourName, ...recentViews.filter(name => name !== tourName)].slice(0, 10);
      localStorage.setItem('recentTourViews', JSON.stringify(updatedViews));

      navigate(`/package/${tourId}`);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      navigate(`/package/${tourId}`);
    }
  };

  // Helper function to calculate days until tour starts (same as UpcomingTours)
  const getDaysUntilStart = (startDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="tour-suggestions-section">
        <div className="tour-suggestions-header">
          <h2> Tours for You</h2>
          <p>Discovering tours based on your interests...</p>
        </div>
        <div className="tour-suggestions-loading">
          <div className="loading-spinner"></div>
          <p>Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error || suggestions.length === 0) {
    return null; // Don't show the section if there are no suggestions
  }

  return (
    <div className="tour-suggestions-section">
      <div className="tour-suggestions-header">
        <h2>
          {weatherCity ? `Upcoming Tours in ${weatherCity} and nearby areas` : 'Upcoming Tours'}
        </h2>
        <p>Discover upcoming tours tailored to your interests and preferences</p>
      </div>

      <div className="tour-suggestions-container">
        <div className="tour-suggestions-grid">
          {suggestions.map(tour => {
            if (!tour || !tour._id) return null;

            const averageRating = averageRatings[tour._id];
            const tourName = tour.name || 'Untitled Tour';
            const tourPrice = tour.price || 'N/A';
            const tourCategory = tour.packageCategories?.join(', ') || 'General';
            const tourImage = tour.images && tour.images.length > 0
              ? `https://backend-eight-tan-16.vercel.app/${tour.images[0]}`
              : 'https://picsum.photos/300/200';
            const duration = tour.duration ? `${tour.duration.days} days / ${tour.duration.nights} nights` : 'Duration not specified';
            const daysUntilStart = getDaysUntilStart(tour.startDate);

            return (
              <div key={tour._id} className="suggestion-card">
                <div className="suggestion-card-image">
                  <img
                    src={tourImage}
                    alt={tourName}
                    onError={(e) => {
                      e.target.src = 'https://picsum.photos/300/200';
                    }}
                  />
                  {/* Add days until start tag like UpcomingTours */}
                  <span className="suggestion-upcoming-tag">
                    {daysUntilStart} days left
                  </span>
                  <div className="suggestion-card-overlay">
                    
                  </div>
                </div>
                
                <div className="suggestion-card-content">
                  <div className="suggestion-card-header">
                    <h3>{tourName}</h3>
                    <div className="suggestion-rating">
                      <i className="fas fa-star"></i>
                      <span>
                        {averageRating ? `${averageRating.toFixed(1)}` : 'New'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="suggestion-card-details">
                    <div className="suggestion-detail-item">
                      <i className="fas fa-tag"></i>
                      <span>{tourCategory}</span>
                    </div>
                    <div className="suggestion-detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{duration}</span>
                    </div>
                    <div className="suggestion-detail-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>
                        {tour.destinations?.length > 0 
                          ? `${tour.destinations[0].name}${tour.destinations.length > 1 ? ` +${tour.destinations.length - 1} more` : ''}`
                          : 'Multiple Destinations'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="suggestion-card-footer">
                    <div className="suggestion-price">
                      <span className="price-label">From</span>
                      <span className="price-value">${tourPrice}</span>
                    </div>
                    <button
                      onClick={() => handleExploreNow(tour._id, tour.name)}
                      className="suggestion-explore-btn"
                    >
                      Explore Now
                      <i className="fas fa-arrow-right"></i>
                    </button>
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

export default TourSuggestions;
