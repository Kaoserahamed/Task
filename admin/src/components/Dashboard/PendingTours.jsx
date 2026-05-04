import React, { useState } from 'react';
import './Dashboard.css';
import axios from 'axios';

const PendingTours = ({ id, name, applicant, date, status, price }) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsLoading(true);
      console.log('key',id);
      const response = await axios.patch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}/status`,{
        status:newStatus
      });

      if (response.data.success) {
        setCurrentStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="approval-item">
      <div className="approval-info">
        <h4>{name}</h4>
        <p>Applicant: {applicant}</p>
        <p>Price: ${price}</p>
        <p>Status: {currentStatus}</p>
        <p className="approval-date">Created: {date}</p>
      </div>
      <div className="approval-actions">
        <button 
          className="approve-btn" 
          onClick={() => handleStatusUpdate('approved')}
          disabled={isLoading || currentStatus === 'approved'}
        >
          <i className="fas fa-check"></i> 
          {isLoading ? 'Processing...' : 'Approve'}
        </button>
        <button 
          className="reject-btn" 
          onClick={() => handleStatusUpdate('rejected')}
          disabled={isLoading || currentStatus === 'rejected'}
        >
          <i className="fas fa-times"></i> 
          {isLoading ? 'Processing...' : 'Reject'}
        </button>
      </div>
    </div>
  );
};

export default PendingTours;
