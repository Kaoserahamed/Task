import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Users } from 'lucide-react';
import './ContactInfoForm.css';
import socket from '../../socket';

const ContactInfoForm = ({ formData, handleChange, handleSubmitContactInfo, selectedTour }) => {
  const [maxTravelers, setMaxTravelers] = useState(selectedTour?.availableSeats || 0);

  // Update maxTravelers when selectedTour changes
  useEffect(() => {
    setMaxTravelers(selectedTour?.availableSeats || 0);
  }, [selectedTour]);

  // Handle socket events for seat updates
  useEffect(() => {
    if (socket) {
      socket.on('book', (data) => {
        console.log('Booking event received in ContactInfoForm:', data);
        if (data.action === 'krlam' && data.booking && data.booking.tourId === selectedTour?._id) {
          const newMaxTravelers = maxTravelers - data.booking.travelers;
          if (newMaxTravelers >= 0) {
            setMaxTravelers(newMaxTravelers);
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('book');
      }
    };
  }, [socket, selectedTour?._id, maxTravelers]);

  const isGroupTour = selectedTour?.tourType?.group;

  return (
    <div className="card">
      <h2 className="card-title">Contact Information</h2>
      <form onSubmit={handleSubmitContactInfo}>
        <div className="form-grid form-grid-2col">
          <div className="form-group">
            <label htmlFor="firstName" className="label">First Name</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <User size={16} />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="lastName" className="label">Last Name</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <User size={16} />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="label">Email Address</label>
          <div className="input-wrapper">
            <div className="input-icon">
              <Mail size={16} />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        <div className="form-grid form-grid-2col">
          <div className="form-group">
            <label htmlFor="phone" className="label">Phone Number</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Phone size={16} />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="travelers" className="label">
              Number of Travelers
              {isGroupTour && (
                <span style={{ fontSize: '12px', color: 'var(--color-subtext)', fontWeight: 'normal' }}>
                  ({maxTravelers} seats available)
                </span>
              )}
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Users size={16} />
              </div>
              <select
                id="travelers"
                name="travelers"
                value={formData.travelers}
                onChange={handleChange}
                className="input"
                required
              >
                {maxTravelers === 0 ? (
                  <option value="">No seats available</option>
                ) : (
                  [...Array(maxTravelers)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? 'Person' : 'People'}
                    </option>
                  ))
                )}
              </select>
            </div>
            {isGroupTour && maxTravelers === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--accent-error)', marginTop: '5px' }}>
                This tour is fully booked.
              </p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address" className="label">Address</label>
          <div className="input-wrapper">
            <div className="input-icon">
              <MapPin size={16} />
            </div>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input"
              required
            />
          </div>
        </div>

        <div className="form-grid form-grid-2col">
          <div className="form-group">
            <label htmlFor="city" className="label">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="input-no-icon"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="country" className="label">Country</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="input-no-icon"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="specialRequests" className="label">
            Special Requests (Optional)
          </label>
          <textarea
            id="specialRequests"
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows="3"
            className="textarea"
            placeholder="Any special dietary requirements, accessibility needs, or other requests..."
          ></textarea>
        </div>

        <div className="flex-end">
          <button 
            type="submit" 
            className="button button-primary"
            disabled={isGroupTour && maxTravelers === 0}
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactInfoForm;
