import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import ProfileInfo from '../../Components/ProfileInfo/ProfileInfo';
import ProfileTabs from '../../Components/ProfileTabs/ProfileTabs';
import MyTrips from '../../Components/MyTrips/MyTrips';
import Wishlist from '../../Components/Wishlist/Wishlist';
import Settings from '../../Components/Settings/Settings';
import './ProfilePage.css';
const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trips');

  return (
    <div className="profile-page">
      <div className="profile-container">
        <ProfileInfo user={user} />
        
        <div className="profile-content">
          <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <p>{user.name}</p>
          <div className="tab-content">
            {activeTab === 'trips' && <MyTrips />}
            {activeTab === 'wishlist' && <Wishlist />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
