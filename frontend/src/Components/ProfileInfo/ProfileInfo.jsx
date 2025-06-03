import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ProfileInfo.css';
import { useAuth } from '../../Context/AuthContext';

const ProfileInfo = () => {
  const { user } = useAuth();
  const userData = user?.user || user;
  
  const [wishlistCount, setWishlistCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [error, setError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token || !userData?.email) {
        setError('Authentication required.');
        return;
      }

      try {
        // Fetch Wishlist Count
        const wishlistRes = await axios.get('http://localhost:4000/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
          params: { email: userData.email }
        });
        setWishlistCount(wishlistRes.data.wishlist?.length || 0);

        // Fetch Bookings (trips)
        const bookingRes = await axios.get('http://localhost:4000/api/bookings', {
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
  }, [userData]);

  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `http://localhost:4000/${user.avatar}` : 'default-avatar.png'
  );

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

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('email', userData.email);

    try {
      console.log('Uploading avatar for:', userData.email); // Debug log
      
      const response = await axios.post('http://localhost:4000/api/auth/avatar', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data); // Debug log

      if (response.data.success) {
        setAvatarPreview(`http://localhost:4000/${response.data.user.avatar}`);
        setError(''); // Clear any previous errors
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      
      if (err.response) {
        // Server responded with error status
        console.error('Error response:', err.response.data);
        setError(err.response.data.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received
        console.error('No response received:', err.request);
        setError('No response from server. Check your connection.');
      } else {
        // Something else happened
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
          <img src={avatarPreview} alt="Profile" />
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
        <p>{userData?.email || 'email@example.com'}</p>
        <p>{userData?.phone || '0123456789'}</p>
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