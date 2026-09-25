import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './settings.css';
import * as authApi from '../../api/auth';

const Settings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    nid: '',
    image: '',
    tradeLicenseNo: '',
    bankAccountNo: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profilePassword, setProfilePassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileEdit, setProfileEdit] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const data = await authApi.fetchProfile();
        if (data.success && data.profile) {
          setFormData((prev) => ({
            ...prev,
            ...data.profile,
            email: user?.email || '',
            image: data.profile.image || '',
          }));
        } else {
          setFormData((prev) => ({ ...prev, email: user?.email || '' }));
        }
      } catch (e) {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        setProfileLoading(false);
      }
    }
    if (user) fetchProfile();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For demo: just store local URL. In production, upload to server and store path.
      setFormData((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage({ type: '', text: '' });
    if (!profilePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to update profile.' });
      setProfileLoading(false);
      return;
    }
    try {
      const data = await authApi.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        nid: formData.nid,
        image: formData.image,
        tradeLicenseNo: formData.tradeLicenseNo,
        bankAccountNo: formData.bankAccountNo,
        password: profilePassword,
      });
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setProfileEdit(false);
        setProfilePassword('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while updating profile',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    }
  };

  return (
    <div className="settings-container">
      <h2>Admin Settings</h2>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="settings-section">
        <h3>Profile</h3>
        {profileLoading ? (
          <div>Loading profile...</div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="profile-image-row">
              <img
                src={formData.image || 'https://ui-avatars.com/api/?name=Admin'}
                alt="Profile"
                className="profile-image"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #eee',
                }}
              />
              {profileEdit && (
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ marginLeft: 16 }}
                  onChange={handleImageChange}
                />
              )}
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
                disabled={!profileEdit}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} disabled />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleProfileChange}
                disabled={!profileEdit}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleProfileChange}
                disabled={!profileEdit}
              />
            </div>
            <div className="form-group">
              <label>NID No</label>
              <input
                type="text"
                name="nid"
                value={formData.nid}
                onChange={handleProfileChange}
                disabled={!profileEdit}
              />
            </div>
            <div className="form-group">
              <label>Trade License No</label>
              <input
                type="text"
                name="tradeLicenseNo"
                value={formData.tradeLicenseNo}
                onChange={handleProfileChange}
                disabled={!profileEdit}
              />
            </div>
            <div className="form-group">
              <label>Bank Account No</label>
              <input
                type="text"
                name="bankAccountNo"
                value={formData.bankAccountNo}
                onChange={handleProfileChange}
                disabled={!profileEdit}
              />
            </div>
            <div className="form-group">
              <label>
                Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="password"
                name="profilePassword"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                required
                disabled={!profileEdit}
                autoComplete="current-password"
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {profileEdit ? (
                <>
                  <button type="submit" className="btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: '#aaa' }}
                    onClick={() => setProfileEdit(false)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="btn-primary" onClick={() => setProfileEdit(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="settings-section">
        <h3>Account Settings</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
