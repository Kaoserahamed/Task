import React, { useState, useEffect } from 'react';
import './Wishlist.css';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import * as toursApi from '../../api/tours';
import * as wishlistApi from '../../api/wishlist';
import { logError } from '../../utils/logger';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth(); // Get the user from context
  const navigate = useNavigate();

  const handleViewDetails = async (tourId) => {
    try {
      await toursApi.incrementTourView(tourId);
      navigate(`/package/${tourId}`);
    } catch (error) {
      logError('Failed to increment view count:', error);
      navigate(`/package/${tourId}`); // Navigate anyway
    }
  };

  // Fetch wishlist items from the backend
  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your wishlist.');
        return;
      }

      if (!user) {
        setError('User data is missing.');
        return;
      }

      try {
        const data = await wishlistApi.fetchWishlist(user.user.email);

        setWishlistItems(data.wishlist);
      } catch (error) {
        setError('Failed to load wishlist items.');
        logError(error);
      }
    };

    fetchWishlist();
  }, [user]);

  const handleRemoveFromWishlist = async (tourId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to remove items from your wishlist.');
      return;
    }

    if (!user) {
      setError('User data is missing.');
      return;
    }

    try {
      await wishlistApi.removeFromWishlist(tourId, user.user.email);

      // Remove the item from the state after successful deletion
      setWishlistItems((prevItems) => prevItems.filter((item) => item.tourId._id !== tourId));
    } catch (error) {
      setError('Failed to remove from wishlist.');
      logError(error);
    }
  };

  return (
    <div className="wishlist-grid">
      {wishlistItems.map((item) => (
        <div key={item._id} className="wishlist-card">
          <div className="wishlist-image">
            <p>{item.tourId?.name}</p>
            <img
              src={`${API_BASE_URL}/${item.tourId?.images[0]}`} // Assuming the first image is representative
              alt={item.tourId?.name}
            />
            {item.tourId && (
              <button
                className="remove-btn"
                aria-label={`Remove ${item.tourId?.name} from wishlist`}
                title="Remove from wishlist"
                onClick={() => handleRemoveFromWishlist(item.tourId._id)}
              >
                <i className="fas fa-trash"></i>
              </button>
            )}
          </div>
          <div className="wishlist-content">
            <div className="wishlist-info">
              <span>
                <i className="fas fa-map-marker-alt"></i>
                {item.tourId?.destinations[0].name || 'No Location'}
              </span>
              <span>
                <i className="fas fa-clock"></i>
                {item.tourId?.duration.days} Days, {item.tourId?.duration.nights} Nights
              </span>
            </div>
            <div className="wishlist-footer">
              <div className="price-rating">
                <span className="price">${item.tourId?.price}</span>
                {/* Optional: Add rating if available */}
                <span className="rating">
                  <i className="fas fa-star"></i> {/* Adjust this if you have a rating */}
                </span>
              </div>
              <button className="view-details" onClick={() => handleViewDetails(item.tourId._id)}>
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Wishlist;
