import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user, updateUser, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        name: user.name || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const updatedData = {
        name: formData.name,
        phone: formData.phone
      };

      await updateUser(updatedData);
      setMessage({ type: 'success', text: 'Personal information updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update personal information.' });
    }
  };

  

  return (
    <div className="settings">
      <div className="settings-section">
        <h3>Personal Information</h3>
        <form onSubmit={handlePersonalInfoSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      
      <div className="settings-section">
        <h3>Preferences</h3>
        <div className="preferences">
          <div className="preference-item">
            <label className="toggle">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
            <div className="preference-text">
              <span>Email Notifications</span>
              <p>Receive updates about your trips and offers</p>
            </div>
          </div>
          <div className="preference-item">
            <label className="toggle">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
            <div className="preference-text">
              <span>SMS Notifications</span>
              <p>Get important updates via SMS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences section remains the same */}
    </div>
  );
};

export default Settings;
