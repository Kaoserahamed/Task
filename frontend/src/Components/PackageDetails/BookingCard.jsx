import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Corrected import

const BookingCard = ({ price, availableSeats: initialSeats, startDate, endDate, tourId, socket }) => {
  const [message, setMessage] = useState('');
  const [availableSeats, setAvailableSeats] = useState(initialSeats);
  const { user } = useAuth(); 
  const navigate = useNavigate(); // Corrected hook

  // Update available seats when initialSeats prop changes
  useEffect(() => {
    setAvailableSeats(initialSeats);
  }, [initialSeats]);

  // Handle socket events for seat updates
  useEffect(() => {
    if (socket) {
      socket.on('book', (data) => {
        console.log('Booking event received:', data);
        if (data.action === 'krlam' && data.booking && data.booking.tourId === tourId) {
          const newSeats = availableSeats - data.booking.travelers;
          if (newSeats >= 0) {
            setAvailableSeats(newSeats);
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('book');
      }
    };
  }, [socket, tourId, availableSeats]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  console.log("User in BookingCard:", user?.user?.email);

  const handleAddToWishlist = async () => {
    if (!user) {
      setMessage('Please log in to add to wishlist');
      return;
    }

    console.log("Adding to wishlist - Email:", user?.user?.email, "Tour ID:", tourId);

    try {
      const response = await axios.post(
        'https://backend-eight-tan-16.vercel.app/api/wishlist/add',
        { tourId, email: user?.user?.email }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
        });

      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding to wishlist');
    }
  };

  const handleBookNow = () => {
    if (!user) {
      setMessage('Please log in to Book the tour');
      return;
    }
    navigate(`/checkout/${tourId}`); // Navigate to checkout page with tourId
  };

  return (
    <div className="booking-card">
      <div className="booking-header">
        {availableSeats && <span>{availableSeats} seats left</span>}
        {startDate && endDate && (
          <div className="date-info">
            <p>Start: {new Date(startDate).toLocaleDateString()}</p>
            <p>End: {new Date(endDate).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      <div className="booking-actions">
        <button className="book-now" onClick={handleBookNow}>
          <i className="fas fa-ticket-alt"></i>
          Book Now
        </button>
        <button className="add-wishlist" onClick={handleAddToWishlist}>
          <i className="far fa-heart"></i>
          Add to Wishlist
        </button>
        {message&&<p className='error-message'>{message}</p>}
      </div>
    </div>
  );
};

export default BookingCard;

