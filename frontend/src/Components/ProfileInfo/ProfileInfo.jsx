import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './ProfileInfo.css';
import { useAuth } from '../../Context/AuthContext';

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
      return `https://backend-eight-tan-16.vercel.app/${userData.avatar}`;
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
        const wishlistRes = await axios.get('https://backend-eight-tan-16.vercel.app/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
          params: { email: userData.email }
        });
        setWishlistCount(wishlistRes.data.wishlist?.length || 0);

        // Fetch Bookings (trips)
        const bookingRes = await axios.get('https://backend-eight-tan-16.vercel.app/api/bookings', {
          headers: { Authorization: `Bearer ${token}` },
          params: { email: userData.email }
        });
        const totalTrips = [
          ...(bookingRes.data.upcoming || []),
          ...(bookingRes.data.completed || [])
        ];
        setTripsCount(totalTrips.length);
      } catch (err) {
        console.error('Error fetching counts:', err);
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
      console.log('Uploading avatar for:', userData.email);
      
      const response = await axios.post('https://backend-eight-tan-16.vercel.app/user/auth/avatar', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      if (response.data.success) {
        // Update the avatar URL with cache busting
        const newAvatarUrl = `https://backend-eight-tan-16.vercel.app/${response.data.user.avatar}?t=${Date.now()}`;
        setAvatarPreview(newAvatarUrl);
        setImageError(false);
        setError('');

        // Update the user context with new avatar data
        updateUserLocal({ avatar: response.data.user.avatar });

        // Optionally refresh all user data from server
        setTimeout(() => {
          refreshUserData();
        }, 1000);
        
      } else {
        setError(response.data.message || 'Upload failed');
        setAvatarPreview(originalAvatar);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      
      // Revert to original avatar on error
      setAvatarPreview(originalAvatar);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Check your connection.');
      } else {
        console.error('Request setup error:', err.message);
        setError('Error setting up the request.');
      }
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
              transition: 'opacity 0.3s ease'
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

      {error && <p className="error-message" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

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
