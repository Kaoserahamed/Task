import React, { useEffect, useState, useCallback } from 'react';
import './ProfileInfo.css';
import { useAuth } from '../../Context/AuthContext';
import API_BASE_URL from '../../config/api';
import * as wishlistApi from '../../api/wishlist';
import * as bookingsApi from '../../api/bookings';
import * as authApi from '../../api/auth';
import { logError } from '../../utils/logger';

const ProfileInfo = () => {
  const { user, updateUserLocal, refreshUserData } = useAuth();
  const userData = user?.user || user;

  const [wishlistCount, setWishlistCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize the avatar URL to prevent unnecessary re-renders
  const getAvatarUrl = useCallback(() => {
    if (userData?.avatar && userData.avatar !== 'default-avatar.png') {
      return `${API_BASE_URL}/${userData.avatar}`;
    }
    return '/default-avatar.png';
  }, [userData?.avatar]);

  const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl());

  // Update avatar preview when userData changes
  useEffect(() => {
    setAvatarPreview(getAvatarUrl());
    setImageError(false);
  }, [getAvatarUrl]);

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token || !userData?.email) {
        setError('Authentication required.');
        return;
      }

      try {
        // Fetch Wishlist Count
        const wishlistData = await wishlistApi.fetchWishlist(userData.email);
        setWishlistCount(wishlistData.wishlist?.length || 0);

        // Fetch Bookings (trips)
        const bookingData = await bookingsApi.fetchMyBookings(userData.email);
        const totalTrips = [...(bookingData.upcoming || []), ...(bookingData.completed || [])];
        setTripsCount(totalTrips.length);
      } catch (err) {
        logError('Error fetching counts:', err);
        setError('Failed to load profile stats.');
      }
    };

    fetchCounts();
  }, [userData?.email]);

  const handleImageError = useCallback(() => {
    if (!imageError) {
      setImageError(true);
      setAvatarPreview('/default-avatar.png');
    }
  }, [imageError]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }

    setUploadLoading(true);
    setError('');

    // Store original avatar for fallback
    const originalAvatar = avatarPreview;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
      setImageError(false);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('email', userData.email);

    try {
      const data = await authApi.uploadAvatar(formData);

      if (data.success) {
        // Update the avatar URL with cache busting
        const newAvatarUrl = `${API_BASE_URL}/${data.user.avatar}?t=${Date.now()}`;
        setAvatarPreview(newAvatarUrl);
        setImageError(false);
        setError('');

        // Update the user context with new avatar data
        updateUserLocal({ avatar: data.user.avatar });

        // Optionally refresh all user data from server
        setTimeout(() => {
          refreshUserData();
        }, 1000);
      } else {
        setError(data.message || 'Upload failed');
        setAvatarPreview(originalAvatar);
      }
    } catch (err) {
      logError('Upload failed:', err);

      // Revert to original avatar on error
      setAvatarPreview(originalAvatar);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="profile-info">
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={avatarPreview}
            alt="Profile"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{
              opacity: uploadLoading ? 0.7 : 1,
              transition: 'opacity 0.3s ease',
            }}
          />
          <label htmlFor="avatar-upload" className="edit-avatar">
            {uploadLoading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-camera"></i>
            )}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadLoading}
            hidden
          />
        </div>
        <h2>{userData?.name || 'User Name'}</h2>
        <p>{userData?.phone || 'No phone number'}</p>
      </div>

      {error && (
        <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </p>
      )}

      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-value">{tripsCount}</span>
          <span className="stat-label">Total Trips</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{wishlistCount}</span>
          <span className="stat-label">Wishlist</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
