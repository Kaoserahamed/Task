import React from "react";
import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PackageInfo.css";

const PackageInfo = ({ tour,user,chats}) => {
  const navigate = useNavigate();
  console.log(user);
  let userId,username,avatar
  if(user)
  { userId=user._id;
     username = user.name;
     avatar = user.avatar;
  }
  const companyName = tour.companyName;

  const companyId=tour.companyId;
 console.log(username);
  
  const handleChatClick = () => {
    const selectedData = chats.find(chat => chat.companyName === companyName);
    console.log(selectedData);
    let tempchat=selectedData;
    
    if (!tempchat) {
      tempchat = {
        _id: `temp_${companyId}`,
        companyName: companyName,
        userName: username,
        logo:  avatar,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date(),
        chatType: 'comuse',
        unreadCount: 0,
        online: false,
        companyId: companyId,
        isTemporary: true
      };
    }
    console.log(tempchat);
    navigate('/chat', { 
      state: { 
        Chat: tempchat,
        directChat: true,
        chatType: 'comuse'
      } 
    });
  };

  return (
    <div className="package-info">
      {/* Package Title Section */}

      <div className="package-content">
        {/* Left Column */}
          <h1>{tour.name}</h1>
          <p className="package-categories">{tour.packageCategories.join(", ")}</p>
        <div className="content-column">
          <div className="info-section">
            <h2>Tour Overview</h2>
            <div className="overview-details">
              <div className="detail-item">
                <span className="label">Duration</span>
                <p>{tour.duration.days} days, {tour.duration.nights} nights</p>
              </div>
              
              <div className="detail-item">
                <span className="label">Price</span>
                <p>${tour.price} per person</p>
              </div>
            </div>
          </div>

          <div className="info-section" >
            <h2>Special Notes</h2>
            <p className="special-note">{tour.specialNote || "No special notes available."}</p>
          </div>

          <div className="info-section">
            <h2>What's Included</h2>
            <ul className="includes-list">
              {tour.includes.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="content-column">
          <div className="info-section">
            <h2>Destinations</h2>
            <div className="destinations-list">
              {tour.destinations.map((destination, index) => (
                <div key={index} className="destination-item">
                  <h3>{destination.name}</h3>
                  <p>{destination.description}</p>
                  <span className="duration">{destination.stayDuration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="company-section">
            <div className="company-details">
              {/* Simple company icon instead of image */}
              <div className="company-icon">
                <i className="fas fa-building"></i>
              </div>
              <div>
                <h3>{tour.companyName || "Tour Company"}</h3>
                {user&&<button onClick={handleChatClick}>
                  <i className="fas fa-comments"></i> Chat with Company
                </button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageInfo;
