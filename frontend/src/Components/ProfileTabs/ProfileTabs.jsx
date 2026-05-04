import React from 'react';
import './ProfileTabs.css';

const ProfileTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="profile-tabs">
      <button 
        className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`}
        onClick={() => setActiveTab('trips')}
      >
        <i className="fas fa-suitcase"></i>
        My Trips
      </button>
      <button 
        className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
        onClick={() => setActiveTab('wishlist')}
      >
        <i className="fas fa-heart"></i>
        Wishlist
      </button>
      <button 
        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <i className="fas fa-cog"></i>
        Settings
      </button>
    </div>
  );
};

export default ProfileTabs; 
