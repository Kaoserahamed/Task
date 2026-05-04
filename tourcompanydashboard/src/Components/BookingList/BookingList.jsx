import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BookingList.css';
import socket from '../../socket';
const BookingList = () => {
  const { tourId } = useParams(); // Get tourId from URL parameters
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [tourInfo, setTourInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('TourId from params:', tourId); // Debug log
    if (tourId && tourId !== 'undefined') {
      fetchTourBookings();
      fetchTourInfo();
    } else {
      setError('Invalid tour ID');
      setLoading(false);
    }
  }, [tourId, currentPage]);

  const fetchTourInfo = async () => {
    try {
      const token = localStorage.getItem('company-token');
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTourInfo(data.tour);
      }
    } catch (error) {
      console.error('Error fetching tour info:', error);
    }
  };

  const fetchTourBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('company-token');
      const response = await fetch(
        `https://backend-eight-tan-16.vercel.app/api/bookings/tour/${tourId}?page=${currentPage}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
        setTotalPages(data.totalPages);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching tour bookings:', error);
      setError('Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-bookings-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <div className="tour-header">
          {tourInfo && (
            <>
              <h1>{tourInfo.title} - Bookings</h1>
              <p className="tour-location">{tourInfo.location}</p>
            </>
          )}
        </div>
      </div>
      
      {bookings.length === 0 ? (
        <div className="no-bookings">
          <h3>No bookings found for this tour</h3>
          <p>When customers book this tour, their information will appear here.</p>
        </div>
      ) : (
        <>
          <div className="bookings-summary">
            <div className="summary-card">
              <h3>Total Bookings</h3>
              <p className="number">{bookings.length}</p>
            </div>
            <div className="summary-card">
              <h3>Total Travelers</h3>
              <p className="number">
                {bookings.reduce((sum, booking) => sum + (booking.travelers || 0), 0)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p className="number">
                ${bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)}
              </p>
            </div>
          </div>

          <div className="bookings-table">
            <table>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Travelers</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Booking Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>{booking.bookingReference}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{booking.customerName}</strong>
                        <br />
                        <small>{booking.email}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <small>{booking.phone}</small>
                        <br />
                        <small>{booking.address}</small>
                      </div>
                    </td>
                    <td>{booking.travelers}</td>
                    <td>${booking.totalAmount}</td>
                    <td>
                      <span className={`status ${booking.paymentStatus}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${booking.bookingStatus}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-small"
                        onClick={() => viewBookingDetails(booking)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  function viewBookingDetails(booking) {
    // Show booking details in a modal or alert
    alert(`
Booking Details:
Reference: ${booking.bookingReference}
Customer: ${booking.customerName}
Email: ${booking.email}
Phone: ${booking.phone}
Address: ${booking.address}
Travelers: ${booking.travelers}
Total Amount: $${booking.totalAmount}
Payment Method: ${booking.paymentMethod}
Special Requests: ${booking.specialRequests || 'None'}
    `);
  }
};

export default BookingList;
