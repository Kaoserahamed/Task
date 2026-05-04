import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ToursContext } from '../../Context/ToursContext';
import './SearchFilter.css';
import SearchBox from '../../Components/SearchBox/SearchBox';
import { Star, Calendar, Clock, MapPin } from 'lucide-react';

const SearchFilter = () => {
  const { tours, loading, error } = useContext(ToursContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); // Add this
  // Add this with your other state declarations
  const [averageRatings, setAverageRatings] = useState({});
  // Get initial filters from URL params
  const initialQuery = searchParams.get('query') || '';
  const initialPriceMax = parseInt(searchParams.get('priceMax') || '1000');
  const initialTourTypes = searchParams.getAll('tourType') || [];
  const initialDurations = searchParams.getAll('duration') || [];
  const initialStatuses = searchParams.getAll('status') || [];
  const initialSort = searchParams.get('sort') || 'lowest';
  const [reviewCounts, setReviewCounts] = useState({});
  // State for filters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [priceRange, setPriceRange] = useState(initialPriceMax);
  const [selectedTourTypes, setSelectedTourTypes] = useState(initialTourTypes);
  const [selectedDurations, setSelectedDurations] = useState(initialDurations);
  const [selectedStatuses, setSelectedStatuses] = useState(initialStatuses);
  const [sortOption, setSortOption] = useState(initialSort);
  const [filteredTours, setFilteredTours] = useState([]);

  // Tour type options
  const tourTypeOptions = [
    { id: 'adventure', name: 'Adventure', icon: 'mountain', color: '#f97316' },
    { id: 'Family', name: 'Family', icon: 'users', color: '#0ea5e9' },
    { id: 'cultural', name: 'Cultural', icon: 'landmark', color: '#8b5cf6' },
    { id: 'Educational', name: 'Educational', icon: 'graduation-cap', color: '#ec4899' },
    { id: 'Nature & Eco', name: 'Nature & Eco', icon: 'tree', color: '#22c55e' },
    { id: 'Honeymoon', name: 'Honeymoon', icon: 'heart', color: '#f43f5e' },
    { id: 'Seasonal', name: 'Seasonal', icon: 'calendar', color: '#f59e0b' },
    { id: 'Religious', name: 'Religious', icon: 'place-of-worship', color: '#6366f1' },
    { id: 'Beach', name: 'Beach', icon: 'umbrella-beach', color: '#06b6d4' },
    { id: 'Historical', name: 'Historical', icon: 'monument', color: '#84cc16' }
  ];

  // Duration options
  const durationOptions = [
    { id: '1-2', label: '1-2 Days' },
    { id: '3-5', label: '3-5 Days' },
    { id: '6-10', label: '6-10 Days' },
    { id: '10+', label: '10+ Days' }
  ];

  // Status options
  const statusOptions = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' }
  ];
  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const fetchRatingsFromReviews = async () => {
      try {
        const response = await fetch('https://backend-eight-tan-16.vercel.app/reviews');
        const reviews = await response.json();

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
        setReviewCounts(countMap); // Store review counts separately
      } catch (error) {
        console.error('Error fetching ratings:', error);
        setAverageRatings({});
        setReviewCounts({});
      }
    };

    fetchRatingsFromReviews();
  }, []);
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

  // Utility function to determine tour status
  const getTourStatus = (tour) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!tour.startDate || !tour.endDate) return 'upcoming'; // Default if dates not available

    const startDate = new Date(tour.startDate);
    const endDate = new Date(tour.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (today < startDate) return 'upcoming';
    if (today >= startDate && today <= endDate) return 'ongoing';
    if (today > endDate) return 'completed';

    return 'upcoming';
  };

  // Handle search input
  const handleSearch = (query) => {
    setSearchQuery(query);
    updateURLParams('query', query);
  };

  // Handle price range change
  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceRange(value);
    updateURLParams('priceMax', value.toString());
  };

  // Handle tour type checkbox
  const handleTourTypeChange = (type) => {
    setSelectedTourTypes(prev => {
      const updated = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type];

      updateURLParams('tourType', updated, true);
      return updated;
    });
  };

  // Handle duration checkbox
  const handleDurationChange = (duration) => {
    setSelectedDurations(prev => {
      const updated = prev.includes(duration)
        ? prev.filter(d => d !== duration)
        : [...prev, duration];

      updateURLParams('duration', updated, true);
      return updated;
    });
  };

  // Handle status checkbox
  const handleStatusChange = (status) => {
    setSelectedStatuses(prev => {
      const updated = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];

      updateURLParams('status', updated, true);
      return updated;
    });
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOption(value);
    updateURLParams('sort', value);
  };

  // Update URL parameters
  const updateURLParams = (param, value, isArray = false) => {
    const newParams = new URLSearchParams(searchParams);

    if (isArray) {
      // Clear existing values for this param
      newParams.delete(param);
      // Add each value as a separate param entry
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v) newParams.append(param, v);
        });
      }
    } else {
      if (value) {
        newParams.set(param, value);
      } else {
        newParams.delete(param);
      }
    }

    setSearchParams(newParams);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setPriceRange(1000);
    setSelectedTourTypes([]);
    setSelectedDurations([]);
    setSelectedStatuses([]);
    setSortOption('lowest');
    setSearchParams({});
  };

  // Check duration based on days
  const matchesDuration = (tour, durations) => {
    if (durations.length === 0) return true;

    const totalDays = tour.duration?.days || 0;

    return durations.some(d => {
      if (d === '1-2') return totalDays >= 1 && totalDays <= 2;
      if (d === '3-5') return totalDays >= 3 && totalDays <= 5;
      if (d === '6-10') return totalDays >= 6 && totalDays <= 10;
      if (d === '10+') return totalDays > 10;
      return false;
    });
  };

  // Check if tour matches search query
  const matchesSearchQuery = (tour, query) => {
    if (!query) return true;

    const searchTerm = query.toLowerCase().trim();

    // Search in tour name
    if (tour.name?.toLowerCase().includes(searchTerm)) return true;

    // Search in descriptions
    if (tour.description?.toLowerCase().includes(searchTerm)) return true;
    if (tour.shortDescription?.toLowerCase().includes(searchTerm)) return true;

    // Search in destinations
    if (tour.destinations?.some(dest =>
      dest.name?.toLowerCase().includes(searchTerm) ||
      dest.description?.toLowerCase().includes(searchTerm)
    )) return true;

    // Search in package categories
    if (tour.packageCategories?.some(category =>
      category.toLowerCase().includes(searchTerm)
    )) return true;

    // Search in tour guide name
    if (tour.tourGuide?.name?.toLowerCase().includes(searchTerm)) return true;

    return false;
  };

  // Check if tour matches tour type filter
  const matchesTourType = (tour, selectedTypes) => {
    if (selectedTypes.length === 0) return true;

    // Check package categories
    if (tour.packageCategories?.some(category =>
      selectedTypes.includes(category)
    )) return true;

    // Check tour type object properties
    if (tour.tourType) {
      if (selectedTypes.includes('adventure') && tour.tourType.adventure) return true;
      if (selectedTypes.includes('Family') && tour.tourType.family) return true;
      if (selectedTypes.includes('cultural') && tour.tourType.cultural) return true;
      if (selectedTypes.includes('Educational') && tour.tourType.educational) return true;
      if (selectedTypes.includes('Nature & Eco') && tour.tourType.natureEco) return true;
      if (selectedTypes.includes('Honeymoon') && tour.tourType.honeymoon) return true;
      if (selectedTypes.includes('Seasonal') && tour.tourType.seasonal) return true;
      if (selectedTypes.includes('Religious') && tour.tourType.religious) return true;
      if (selectedTypes.includes('Beach') && tour.tourType.beach) return true;
      if (selectedTypes.includes('Historical') && tour.tourType.historical) return true;
    }

    return false;
  };

  // Check if tour matches status filter
  const matchesStatus = (tour, selectedStatuses) => {
    if (selectedStatuses.length === 0) return true;

    const tourStatus = getTourStatus(tour);
    return selectedStatuses.includes(tourStatus);
  };

  // Filter and sort tours
  // Updated sorting logic in the useEffect where filtering and sorting happens
  useEffect(() => {
    if (!tours.length) return;

    let result = [...tours];

    // Apply search query filter
    result = result.filter(tour => matchesSearchQuery(tour, searchQuery));

    // Apply price filter
    result = result.filter(tour => (tour.price || 0) <= priceRange);

    // Apply tour type filter
    result = result.filter(tour => matchesTourType(tour, selectedTourTypes));

    // Apply duration filter
    result = result.filter(tour => matchesDuration(tour, selectedDurations));

    // Apply status filter
    result = result.filter(tour => matchesStatus(tour, selectedStatuses));

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'lowest':
          return (a.price || 0) - (b.price || 0);
        case 'highest':
          return (b.price || 0) - (a.price || 0);
        case 'duration':
          return (b.duration?.days || 0) - (a.duration?.days || 0);
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'rating':
          // Updated to use calculated average ratings from reviews
          const ratingA = averageRatings[a._id] || 0;
          const ratingB = averageRatings[b._id] || 0;
          // Sort by rating descending (highest first)
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          // If ratings are equal, sort by review count (more reviews first)
          const countA = reviewCounts[a._id] || 0;
          const countB = reviewCounts[b._id] || 0;
          return countB - countA;
        default:
          return (a.price || 0) - (b.price || 0);
      }
    });

    setFilteredTours(result);
  }, [tours, searchQuery, priceRange, selectedTourTypes, selectedDurations, selectedStatuses, sortOption, averageRatings, reviewCounts]); // Added averageRatings and reviewCounts to dependencies

  // Generate star rating display
  // Update this function to handle decimal ratings and show count
  const renderStars = (tourId) => {
    const rating = averageRatings[tourId] || 0;
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

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

            return (
              <Star
                key={i}
                size={16}
                fill={fillColor}
                stroke={strokeColor}
              />
            );
          })}
        </div>
        <span className="rating-text">
          {rating > 0 ? `${rating.toFixed(1)} (${getReviewCount(tourId)})` : 'No reviews'}
        </span>
      </div>
    );
  };

  // Format price
  const formatPrice = (price) => {
    return '$' + (price || 0).toLocaleString();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Get the correct image URL
  // Fixed code - with proper forward slash handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Add forward slash if imagePath doesn't start with one
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `https://backend-eight-tan-16.vercel.app${path}`;
  };

  // Get status badge color and text
  const getStatusBadge = (tour) => {
    const status = getTourStatus(tour);
    const statusConfig = statusOptions.find(s => s.id === status);

    return {
      text: statusConfig?.label || 'Unknown',
      color: statusConfig?.color || '#6b7280'
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
            <button className="tour-search-reset-filters" onClick={resetFilters}>Reset</button>
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
              {statusOptions.map(option => (
                <label
                  key={option.id}
                  className="tour-search-filter-option"

                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(option.id)}
                    onChange={() => handleStatusChange(option.id)}
                  />
                  <span className="tour-search-status-indicator" style={{ backgroundColor: option.color }}></span>
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="tour-search-filter-section">
            <h3>Tour Type</h3>
            <div className="tour-search-filter-options">
              {tourTypeOptions.map(option => (
                <label
                  key={option.id}
                  className="tour-search-filter-option"

                >
                  <input
                    type="checkbox"
                    checked={selectedTourTypes.includes(option.id)}
                    onChange={() => handleTourTypeChange(option.id)}
                  />
                  <i className={`fas fa-${option.icon}`} style={{ marginRight: '8px', color: option.color }}></i>
                  {option.name}
                </label>
              ))}
            </div>
          </div>

          <div className="tour-search-filter-section">
            <h3>Duration</h3>
            <div className="tour-search-filter-options">
              {durationOptions.map(option => (
                <label
                  key={option.id}
                  className="tour-search-filter-option"
                  style={{
                    fontWeight: selectedDurations.includes(option.id) ? '600' : '400'
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
                  <button className="tour-search-reset-button" onClick={resetFilters}>Reset Filters</button>
                </div>
              ) : (
                <div className="tour-search-grid">
                  {filteredTours.map(tour => {
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
                            src={tour.images && tour.images.length > 0
                              ? getImageUrl(tour.images[0])
                              : 'https://via.placeholder.com/300x200?text=No+Image'}
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
                            <div className="tour-search-badge tour-search-guide-badge">Tour Guide</div>
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
                            {tour.destinations && tour.destinations.slice(0, 2).map((dest, index) => (
                              <span key={index}>
                                {dest.name}{index < Math.min(1, tour.destinations.length - 1) ? ', ' : ''}
                              </span>
                            ))}
                            {tour.destinations && tour.destinations.length > 2 && (
                              <span> + {tour.destinations.length - 2} more</span>
                            )}
                          </div>

                          <div className="tour-search-info">
                            <div className="tour-search-rating">
                              {renderStars(tour._id)}
                            </div>
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
                                <i className="fas fa-moon"></i>{tour.meals?.dinner}
                              </span>
                            )}

                            {tour.transportation && (
                              <span className="tour-search-feature">
                                <i className="fas fa-bus"></i> {tour.transportation?.transportType || 'Bus'}
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
