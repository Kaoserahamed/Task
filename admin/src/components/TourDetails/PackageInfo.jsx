import React from "react";
import { useNavigate } from "react-router-dom";
import "./PackageInfo.css";

const PackageInfo = ({ tour, companyId, companyName }) => {
  const navigate = useNavigate();

  return (
    <div className="admin-package-info">
      {/* Company Name (if provided) */}
      {companyName && (
        <div className="admin-company-name" style={{marginBottom: '1rem'}}>
          <i className="fas fa-building"></i> {companyName}
        </div>
      )}
      {/* Package Title Section */}
      <div className="admin-package-content">
        {/* Left Column */}
        <div>
          <h1>{tour.name}</h1>
          <p className="admin-package-categories">{tour.packageCategories.join(", ")}</p>
          <div className="admin-info-section">
            <h2>Tour Overview</h2>
            <div className="admin-overview-details">
              <div className="admin-detail-item">
                <span className="admin-label">Duration</span>
                <p>{tour.duration.days} days, {tour.duration.nights} nights</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-label">Group Size</span>
                <p>Maximum {tour.maxGroupSize} people</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-label">Price</span>
                <p>${tour.price} per person</p>
              </div>
            </div>
          </div>

          <div className="admin-info-section" >
            <h2>Special Notes</h2>
            <p className="admin-special-note">{tour.specialNote || "No special notes available."}</p>
          </div>

          <div className="admin-info-section">
            <h2>What's Included</h2>
            <ul className="admin-includes-list">
              {tour.includes.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="admin-info-section">
            <h2>Destinations</h2>
            <div className="admin-destinations-list">
              {tour.destinations.map((destination, index) => (
                <div key={index} className="admin-destination-item">
                  <h3>{destination.name}</h3>
                  <p>{destination.description}</p>
                  <span className="admin-duration">{destination.stayDuration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageInfo;
