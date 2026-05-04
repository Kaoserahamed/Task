import React from 'react';
import { Check } from 'lucide-react';
import './OrderSummary.css';

const OrderSummary = ({ selectedTour, formData, step }) => {
  // Helper function to format duration
  const formatDuration = (days, nights) => {
    return `${days} Day${days > 1 ? 's' : ''} / ${nights} Night${nights > 1 ? 's' : ''}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'To be determined';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get tour type display
  const getTourTypeDisplay = (tourType) => {
    if (tourType?.group && tourType?.single) {
      return 'Group & Individual';
    } else if (tourType?.group) {
      return 'Group Tour';
    } else if (tourType?.single) {
      return 'Individual Tour';
    }
    return 'Tour Package';
  };

  // Helper function to format included meals
  const getIncludedMeals = (meals) => {
    if (!meals) return 'Not specified';
    
    const includedMeals = [];
    if (meals.breakfast) includedMeals.push('Breakfast');
    if (meals.lunch) includedMeals.push('Lunch');
    if (meals.dinner) includedMeals.push('Dinner');
    
    return includedMeals.length > 0 ? includedMeals.join(', ') : 'Not included';
  };

  // Calculate total price based on travelers
  const travelers = formData.travelers || 1;
  const basePrice = selectedTour?.price || 0;
  const subtotal = basePrice * travelers;
  const taxRate = 0.10; // 10% tax
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  return (
    <div className="card sidebar-sticky">
      <h2 className="card-title">Order Summary</h2>
      
      <div className="border-bottom">
        <h3 className="summary-package-title">{selectedTour?.name}</h3>
        
        <div className="summary-row">
          <span className="summary-label">Duration:</span>
          <span>{formatDuration(selectedTour?.duration?.days, selectedTour?.duration?.nights)}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Tour Type:</span>
          <span>{getTourTypeDisplay(selectedTour?.tourType)}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Start Date:</span>
          <span>{formatDate(selectedTour?.startDate)}</span>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Travelers:</span>
          <span>{travelers}</span>
        </div>

        {selectedTour?.tourType?.group && selectedTour?.maxGroupSize && (
          <div className="summary-row">
            <span className="summary-label">Available Seats:</span>
            <span>{selectedTour?.availableSeats || 0} / {selectedTour?.maxGroupSize}</span>
          </div>
        )}

        <div className="summary-row">
          <span className="summary-label">Transportation:</span>
          <span>{selectedTour?.transportation?.type || 'Not specified'}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Tour Guide:</span>
          <span>{selectedTour?.tourGuide ? 'Included' : 'Not included'}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Meals:</span>
          <span>{getIncludedMeals(selectedTour?.meals)}</span>
        </div>
      </div>

      {step === 2 && formData.firstName && (
        <div className="border-bottom">
          <h3 className="summary-package-title">Contact Information</h3>
          <div>
            <p className="contact-info-text">
              {formData.firstName} {formData.lastName}
            </p>
            <p className="contact-info-text">{formData.email}</p>
            <p className="contact-info-text">{formData.phone}</p>
            <p className="contact-info-text">
              {formData.address}, {formData.city}, {formData.country}
            </p>
          </div>
        </div>
      )}

      <div className="border-bottom">
        <div className="summary-row">
          <span className="summary-subtotal">Price per person</span>
          <span>USD {basePrice.toFixed(2)}</span>
        </div>
        
        {travelers > 1 && (
          <div className="summary-row">
            <span>× {travelers} travelers</span>
            <span>USD {subtotal.toFixed(2)}</span>
          </div>
        )}
        
        <div className="summary-row">
          <span>Taxes & Fees (10%)</span>
          <span>USD {taxes.toFixed(2)}</span>
        </div>
      </div>

      <div className="summary-total">
        <span>Total</span>
        <span>USD {total.toFixed(2)}</span>
      </div>

      <div className="features-section">
        <p className="feature-item">
          <Check size={16} className="feature-icon" />
          {selectedTour?.cancellationPolicy || 'Free cancellation up to 7 days before the tour'}
        </p>
        
        <p className="feature-item">
          <Check size={16} className="feature-icon" />
          24/7 customer support
        </p>

        {selectedTour?.includes && selectedTour.includes.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Includes:</h4>
            {selectedTour.includes.slice(0, 3).map((item, index) => (
              <p key={index} className="feature-item">
                <Check size={16} className="feature-icon" />
                {item}
              </p>
            ))}
            {selectedTour.includes.length > 3 && (
              <p className="contact-info-text" style={{ marginLeft: '28px', fontSize: '12px' }}>
                +{selectedTour.includes.length - 3} more items included
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
