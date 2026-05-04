import React, { useState, useContext, useMemo } from 'react';
import { ToursContext } from '../../Context/ToursContext';
import { useNavigate } from 'react-router-dom';
import './UpcomingTours.css';

const UpcomingTours = () => {
  const { tours = [], loading } = useContext(ToursContext);
  const navigate = useNavigate();

  // 🔢 Filter and sort upcoming tours
  const sortedAndFilteredTours = useMemo(() => {
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    oneDayFromNow.setHours(0, 0, 0, 0); // Start of day

    // Step 1: Filter tours that start after one day from now
    const upcomingTours = tours.filter(tour => {
      const startDate = new Date(tour.startDate);
      return startDate >= oneDayFromNow;
    });

    // Step 2: Sort by start date (earliest first)
    return upcomingTours.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [tours]);

  // Handle explore now with view increment
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

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to calculate days until tour starts
  const getDaysUntilStart = (startDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const diffTime = start - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to format duration
  const formatDuration = (duration) => {
    if (!duration) return 'Duration TBD';
    
    // If duration is an object with days/nights
    if (typeof duration === 'object') {
      if (duration.days && duration.nights) {
        return `${duration.days}D/${duration.nights}N`;
      } else if (duration.days) {
        return `${duration.days} days`;
      } else if (duration.nights) {
        return `${duration.nights} nights`;
      }
    }
    
    // If duration is a string or number
    return `${duration} days`;
  };

  return (
    <div className="upcoming-tours-container">
      {/* Tours Display */}
      {loading ? (
        <div className="upcoming-loading-container">
          <div className="upcoming-loading-spinner"></div>
          <p>Loading upcoming tours...</p>
        </div>
      ) : sortedAndFilteredTours.length === 0 ? (
        <div className="upcoming-no-tours-message">
          <div className="upcoming-no-tours-content">
            <i className="fas fa-calendar-alt"></i>
            <h3>No Upcoming Tours Found</h3>
            <p>There are currently no tours scheduled to start after tomorrow. Check back soon for new adventures!</p>
          </div>
        </div>
      ) : (
        <div className="upcoming-tour-scroll-container">
          <div className="upcoming-tour-row">
            {sortedAndFilteredTours.map((tour) => {
              if (!tour || !tour._id) return null;

              const tourName = tour.name || 'Untitled Tour';
              const tourPrice = tour.price || 'N/A';
              const tourLocation = tour.weather || 'Location TBD';
              const tourImage = tour.images && tour.images.length > 0
                ? `https://backend-eight-tan-16.vercel.app/${tour.images[0]}`
                : 'https://picsum.photos/300/200';
              const daysUntilStart = getDaysUntilStart(tour.startDate);
              const startDate = formatDate(tour.startDate);
              const duration = formatDuration(tour.duration);

              return (
                <div key={tour._id} className="upcoming-tour-card">
                  <div className="upcoming-tour-image">
                    <img
                      src={tourImage}
                      alt={tourName}
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/300/200';
                      }}
                    />
                    <span className="upcoming-tour-tag">
                      {daysUntilStart} days left
                    </span>
                  </div>
                  <div className="upcoming-tour-info">
                    <h3>{tourName}</h3>
                    <div className="upcoming-tour-details">
                      <span>
                        Price: <strong>${tourPrice}</strong>
                      </span>
                      
                      <span>
                        <i className="fas fa-calendar"></i> {startDate}
                      </span>
                      <span>
                        <i className="fas fa-clock"></i> {duration}
                      </span>
                    </div>
                    <div className="upcoming-tour-actions">
                      <button
                        onClick={() => handleExploreNow(tour._id)}
                        className="upcoming-view-details-btn"
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
      )}
    </div>
  );
};

export default UpcomingTours;
