import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import './SearchFilter.css';
import SearchBox from '../../Components/SearchBox/SearchBox';
import { Star, Calendar, Clock, MapPin } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import * as toursApi from '../../api/tours';
import * as reviewsApi from '../../api/reviews';
import { logError } from '../../utils/logger';
import {
  DURATION_OPTIONS as durationOptions,
  STATUS_OPTIONS as statusOptions,
  TOUR_TYPE_OPTIONS as tourTypeOptions,
  aggregateReviews,
  formatDate,
  formatPrice,
  getImageUrl,
  getTourStatus,
} from '../../utils/searchFilters';
import { useSearchFilters } from './useSearchFilters';

const SearchFilter = () => {
  const { tours, loading, error } = useContext(ToursContext);
  const navigate = useNavigate();
  const [averageRatings, setAverageRatings] = useState({});
  const [reviewCounts, setReviewCounts] = useState({});
  const {
    searchQuery,
    priceRange,
    selectedTourTypes,
    selectedDurations,
    selectedStatuses,
    sortOption,
    filteredTours,
    handleSearch,
    handlePriceChange,
    handleTourTypeChange,
    handleDurationChange,
    handleStatusChange,
    handleSortChange,
    resetFilters,
  } = useSearchFilters({ tours, averageRatings, reviewCounts });

  useEffect(() => {
    const fetchRatingsFromReviews = async () => {
      try {
        const reviews = await reviewsApi.fetchReviews();

        const { averages, counts } = aggregateReviews(reviews);
        setAverageRatings(averages);
        setReviewCounts(counts);
      } catch (error) {
        logError('Error fetching ratings:', error);
        setAverageRatings({});
        setReviewCounts({});
      }
    };

    fetchRatingsFromReviews();
  }, []);
  const handleExploreNow = async (tourId) => {
    try {
      await toursApi.incrementTourView(tourId);
      navigate(`/package/${tourId}`);
    } catch (error) {
      logError('Failed to increment view count:', error);
      navigate(`/package/${tourId}`);
    }
  };

  const renderStars = (tourId) => {
    const rating = averageRatings[tourId] || 0;

    return (
      <div className="rating-container">
        <div className="stars">
          {[...Array(5)].map((_, i) => {
            const starValue = i + 1;
            let fillColor = 'none';
            let strokeColor = '#ddd';

            if (rating >= starValue) {
              fillColor = '#FFD700';
              strokeColor = '#FFD700';
            } else if (rating >= starValue - 0.5) {
              fillColor = 'url(#halfFill)';
              strokeColor = '#FFD700';
            }

            return <Star key={i} size={16} fill={fillColor} stroke={strokeColor} />;
          })}
        </div>
        <span className="rating-text">
          {rating > 0 ? `${rating.toFixed(1)} (${getReviewCount(tourId)})` : 'No reviews'}
        </span>
      </div>
    );
  };

  const getStatusBadge = (tour) => {
    const status = getTourStatus(tour);
    const statusConfig = statusOptions.find((s) => s.id === status);

    return {
      text: statusConfig?.label || 'Unknown',
      color: statusConfig?.color || '#6b7280',
    };
  };
  const getReviewCount = (tourId) => {
    return reviewCounts[tourId] || 0;
  };

  return (
    <div className="tour-search-wrapper">
      <div className="tour-search-container">
        <SearchBox onSearch={handleSearch} initialValue={searchQuery} />
      </div>

      <div className="tour-search-main-content">
        {/* Filter Sidebar */}
        <aside className="tour-search-filter-sidebar">
          <div className="tour-search-filter-header">
            <h2>Filters</h2>
            <button className="tour-search-reset-filters" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="tour-search-filter-section">
            <h3>Price Range</h3>
            <div className="tour-search-price-range">
              <input
                type="range"
                className="tour-search-price-slider"
                min="1"
                max="1000"
                step="1"
                value={priceRange}
                onChange={handlePriceChange}
              />
              <div className="tour-search-price-values">
                <span>$1</span> - <span>${priceRange.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="tour-search-filter-section">
            <h3>Tour Status</h3>
            <div className="tour-search-filter-options">
              {statusOptions.map((option) => (
                <label key={option.id} className="tour-search-filter-option">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(option.id)}
                    onChange={() => handleStatusChange(option.id)}
                  />
                  <span
                    className="tour-search-status-indicator"
                    style={{ backgroundColor: option.color }}
                  ></span>
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="tour-search-filter-section">
            <h3>Tour Type</h3>
            <div className="tour-search-filter-options">
              {tourTypeOptions.map((option) => (
                <label key={option.id} className="tour-search-filter-option">
                  <input
                    type="checkbox"
                    checked={selectedTourTypes.includes(option.id)}
                    onChange={() => handleTourTypeChange(option.id)}
                  />
                  <i
                    className={`fas fa-${option.icon}`}
                    style={{ marginRight: '8px', color: option.color }}
                  ></i>
                  {option.name}
                </label>
              ))}
            </div>
          </div>

          <div className="tour-search-filter-section">
            <h3>Duration</h3>
            <div className="tour-search-filter-options">
              {durationOptions.map((option) => (
                <label
                  key={option.id}
                  className="tour-search-filter-option"
                  style={{
                    fontWeight: selectedDurations.includes(option.id) ? '600' : '400',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDurations.includes(option.id)}
                    onChange={() => handleDurationChange(option.id)}
                  />
                  <Clock size={16} style={{ marginRight: '8px' }} />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Tour Results */}
        <main className="tour-search-results">
          {loading ? (
            <div className="tour-search-loading-indicator">
              <div className="tour-search-spinner"></div>
              <p>Loading tours...</p>
            </div>
          ) : error ? (
            <div className="tour-search-error-message">
              <p>Error loading tours: {error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="tour-search-results-header">
                <h2>{filteredTours.length} Tours Found</h2>
                <select
                  className="tour-search-sort-dropdown"
                  value={sortOption}
                  onChange={handleSortChange}
                >
                  <option value="lowest">Lowest Price</option>
                  <option value="highest">Highest Price</option>
                  <option value="duration">Longest Duration</option>
                  <option value="newest">Newest First</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>

              {filteredTours.length === 0 ? (
                <div className="tour-search-no-results">
                  <h3>No tours match your filters</h3>
                  <p>Try adjusting your search criteria or explore our popular tours.</p>
                  <button className="tour-search-reset-button" onClick={resetFilters}>
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="tour-search-grid">
                  {filteredTours.map((tour) => {
                    const statusBadge = getStatusBadge(tour);

                    return (
                      <div
                        className="tour-search-card"
                        key={tour._id}
                        onClick={() => handleExploreNow(tour._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="tour-search-image-container">
                          <img
                            src={
                              tour.images && tour.images.length > 0
                                ? getImageUrl(tour.images[0], API_BASE_URL)
                                : 'https://via.placeholder.com/300x200?text=No+Image'
                            }
                            alt={tour.name}
                            className="tour-search-image"
                          />

                          {/* Status Badge */}
                          <div
                            className="tour-search-badge tour-search-status-badge"
                            style={{ backgroundColor: statusBadge.color }}
                          >
                            {statusBadge.text}
                          </div>

                          {/* Tour Guide Badge */}
                          {tour.tourGuide && (
                            <div className="tour-search-badge tour-search-guide-badge">
                              Tour Guide
                            </div>
                          )}

                          {/* Available Seats Badge */}
                          {tour.availableSeats && tour.availableSeats < 5 && (
                            <div className="tour-search-badge tour-search-seats-badge">
                              Only {tour.availableSeats} seats left!
                            </div>
                          )}
                        </div>

                        <div className="tour-search-details">
                          <h3 className="tour-search-title">{tour.name}</h3>

                          <div className="tour-search-meta">
                            <p className="tour-search-duration">
                              <Clock size={14} />
                              {tour.duration?.days || 0} Days {tour.duration?.nights || 0} Nights
                            </p>

                            {tour.startDate && (
                              <p className="tour-search-start-date">
                                <Calendar size={14} />
                                Starts: {formatDate(tour.startDate)}
                              </p>
                            )}
                          </div>

                          <div className="tour-search-destinations-preview">
                            <MapPin size={14} />
                            {tour.destinations &&
                              tour.destinations.slice(0, 2).map((dest, index) => (
                                <span key={index}>
                                  {dest.name}
                                  {index < Math.min(1, tour.destinations.length - 1) ? ', ' : ''}
                                </span>
                              ))}
                            {tour.destinations && tour.destinations.length > 2 && (
                              <span> + {tour.destinations.length - 2} more</span>
                            )}
                          </div>

                          <div className="tour-search-info">
                            <div className="tour-search-rating">{renderStars(tour._id)}</div>
                            <span className="tour-search-price">{formatPrice(tour.price)}</span>
                          </div>

                          <div className="tour-search-features">
                            {tour.meals?.breakfast && (
                              <span className="tour-search-feature">
                                <i className="fas fa-utensils"></i> {tour.meals?.breakfast}
                              </span>
                            )}
                            {tour.meals?.dinner && (
                              <span className="tour-search-feature">
                                <i className="fas fa-moon"></i>
                                {tour.meals?.dinner}
                              </span>
                            )}

                            {tour.transportation && (
                              <span className="tour-search-feature">
                                <i className="fas fa-bus"></i>{' '}
                                {tour.transportation?.transportType || 'Bus'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SearchFilter;
