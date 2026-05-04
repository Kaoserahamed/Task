import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ToursContext } from '../../Context/ToursContext';
import PackageGrid from '../../Components/PackageGrid/PackageGrid';
import './PopularTours.css';

const PopularTours = () => {
  const { tours = [], loading } = useContext(ToursContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [averageRatings, setAverageRatings] = useState({});

  // Fetch average ratings from reviews
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

    if (tours.length > 0) {
      fetchAverageRatings();
    }
  }, [tours]);

  // Helper function to check if tour is completed
  const isTourCompleted = (startDate) => {
    if (!startDate) return false;
    const now = new Date();
    const tourStartDate = new Date(startDate);
    return tourStartDate < now;
  };

  // 🔢 Calculate popularity score, filter, and sort
  const sortedAndFilteredTours = useMemo(() => {
    // Step 1: Compute popularity score
    const scoredTours = tours.map(tour => {
      const {
        bookings = 0,
        views = 0,
        wishlistCount = 0,
        rating = {}
      } = tour.popularity || {};

      // Use fetched average rating or fallback to tour's rating
      const averageRating = averageRatings[tour._id] || rating.average || 0;

      const popularityScore =
        (bookings * 0.5) +
        (averageRating * 10 * 0.2) +
        (views * 0.2) +
        (wishlistCount * 0.1);

      // Add completed status to tour object
      const isCompleted = isTourCompleted(tour.startDate);

      return { ...tour, popularityScore, isCompleted };
    });

    // Step 2: Filter by search query
    const searchedTours = scoredTours.filter(tour => {
      if (!searchQuery.trim()) return true; // Show all if no search query
      
      const searchTerm = searchQuery.toLowerCase().trim();
      const name = (tour.name || '').toString().toLowerCase();
      const location = (tour.location || '').toString().toLowerCase();
      
      // Handle packageCategories which might be an array or string
      let category = '';
      if (tour.packageCategories) {
        if (Array.isArray(tour.packageCategories)) {
          category = tour.packageCategories.join(' ').toLowerCase();
        } else {
          category = tour.packageCategories.toString().toLowerCase();
        }
      }
      
      return name.includes(searchTerm) || 
             location.includes(searchTerm) || 
             category.includes(searchTerm);
    });

    // Step 3: Sort by popularity score descending
    return searchedTours.sort((a, b) => b.popularityScore - a.popularityScore);
  }, [tours, searchQuery, averageRatings]);

  return (
    <div className="popular-packages-container">
      {/* Header Section */}
      <div className="popular-packages-header">
        <div className="popular-packages-header-content">
          <h1>Explore Our Popular Packages</h1>
          <p>Discover the best travel experiences curated just for you</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="popular-packages-controls">
        <div className="popular-search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by destination, package name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="popular-results-summary">
        
      </div>

      {/* Packages Grid */}
      <div className='popular-packages-grid'>
        {loading ? (
          <div className="popular-loading-spinner">Loading packages...</div>
        ) : sortedAndFilteredTours.length === 0 && searchQuery ? (
          <div className="no-search-results">
            <i className="fas fa-search"></i>
            <p>No packages found for "{searchQuery}"</p>
            <p>Try searching with different keywords or check back later.</p>
            <button onClick={() => setSearchQuery('')} className="clear-search-button">
              Show All Packages
            </button>
          </div>
        ) : (
          <PackageGrid packages={sortedAndFilteredTours} />
        )}
      </div>
    </div>
  );
};

export default PopularTours;
