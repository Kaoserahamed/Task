import React from 'react';
import './PackageItinerary.css';

const PackageItinerary = ({ destinations }) => {
  if (!destinations || destinations.length === 0) {
    return <p className="no-itinerary">No itinerary available.</p>;
  }

  return (
    <div className="itinerary-section">
      <h2>Itinerary</h2>
      <div className="timeline">
        {destinations.map((destination, index) => (
          <div key={index} className="timeline-item">
            <div className="day-number">Stop {index + 1}</div>
            <div className="day-content">
              <h3>{destination.name}</h3>
              <p>{destination.description}</p>
              <p><strong>Stay Duration:</strong> {destination.stayDuration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageItinerary;

