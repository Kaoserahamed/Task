import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './AllBookingsList.css';
import socket from '../../socket';
import { useTours } from '../../Context/ToursContext';

const AllBookingsList = () => {
  const { tours, loading, error, fetchToursWithBookings } = useTours();
  const [allBookings, setAllBookings] = useState([]);
  const [view, setView] = useState('tours'); // 'tours' or 'all'
  const [toursWithStats, setToursWithStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchTourStats = async () => {
    if (!tours || tours.length === 0) {
      setToursWithStats([]);
      return;
    }
    setStatsLoading(true);
    const token = localStorage.getItem('company-token');
    try {
      const toursStats = await Promise.all(
        tours.map(async (tour) => {
          // Fetch bookings for this tour
          const res = await fetch(
            `https://backend-eight-tan-16.vercel.app/api/bookings/tour/${tour._id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();
          const bookings = data.success ? data.bookings : [];
          const bookingCount = bookings.length;
          const totalRevenue = bookings.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0
          );
          return { ...tour, bookingCount, totalRevenue, bookings };
        })
      );
      setToursWithStats(toursStats);
    } catch (err) {
      console.error('Error fetching tour stats:', err);
      setToursWithStats([]);
    }
    setStatsLoading(false);
  };

  // Fetch bookings for each tour and compute stats
  useEffect(() => {
    if (view === 'tours' && tours && tours.length > 0) {
      fetchTourStats();
    }
  }, [tours, view]);

  // Handle socket events for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('book', async (data) => {
        console.log('Booking event received:', data);
        if (data.action === 'krlam') {
          // Fetch fresh tour data
          await fetchToursWithBookings();
          // Update tour stats
          await fetchTourStats();
        }
      });

      socket.on('seatsUpdated', async (data) => {
        console.log('Seats update event received:', data);
        // Fetch fresh tour data
        await fetchToursWithBookings();
        // Update tour stats
        await fetchTourStats();
      });
    }

    return () => {
      if (socket) {
        socket.off('book');
        socket.off('seatsUpdated');
      }
    };
  }, [socket, fetchToursWithBookings,fetchTourStats]);

  const fetchAllBookings = async () => {
    try {
      const token = localStorage.getItem('company-token');
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/bookings/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAllBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
    }
  };

  useEffect(() => {
    if (view === 'all') {
      fetchAllBookings();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'tours') {
      fetchToursWithBookings();
    }
  }, [view, fetchToursWithBookings]);

  useEffect(() => {
    if (view === 'tours' && tours && tours.length > 0) {
      // Compute stats from tours (which now include bookings)
      const toursStats = tours.map(tour => {
        const bookingCount = Array.isArray(tour.bookings) ? tour.bookings.length : 0;
        const totalRevenue = Array.isArray(tour.bookings)
          ? tour.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
          : 0;
        return { ...tour, bookingCount, totalRevenue };
      });
      setToursWithStats(toursStats);
    }
  }, [tours, view]);

  if (loading || (view === 'tours' && statsLoading)) {
    return <div className="loading">Loading...</div>;
  }
  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="all-bookings-container">
      <div className="header">
        <h1>Bookings Management</h1>
        <div className="view-toggle">
          <button
            className={view === 'tours' ? 'active' : ''}
            onClick={() => setView('tours')}
          >
            By Tours
          </button>
          <button
            className={view === 'all' ? 'active' : ''}
            onClick={() => setView('all')}
          >
            All Bookings
          </button>
        </div>
      </div>

      {view === 'tours' ? (
        <div className="tours-overview">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Tours</h3>
              <p className="number">{toursWithStats.length}</p>
            </div>
            <div className="summary-card">
              <h3>Total Bookings</h3>
              <p className="number">{toursWithStats.reduce((sum, tour) => sum + tour.bookingCount, 0)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Revenue</h3>
              <p className="number">${toursWithStats.reduce((sum, tour) => sum + tour.totalRevenue, 0)}</p>
            </div>
          </div>

          <div className="tours-grid">
            {toursWithStats.map((tour) => (
              <div key={tour._id} className="tour-card">
                <div className="tour-image">
                  {tour.images && tour.images.length > 0 ? (
                    <img
                      src={`https://backend-eight-tan-16.vercel.app/${tour.images[0]}`}
                      alt={tour.title || tour.name}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="tour-info">
                  <h3>{tour.title || tour.name}</h3>
                  <p className="location">{tour.location}</p>
                  <div className="stats">
                    <span className="bookings">
                      📋 {tour.bookingCount} bookings
                    </span>
                    <span className="revenue">
                      💰 ${tour.totalRevenue}
                    </span>
                  </div>
                  <div className="actions">
                    <Link
                      to={`/bookings/${tour._id}`}
                      className="btn btn-primary"
                    >
                      View Bookings
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="all-bookings-view">
          <div className="bookings-table">
            <table>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Tour</th>
                  <th>Customer</th>
                  <th>Travelers</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.bookingReference}</td>
                    <td>{booking.tour?.title || booking.tour?.name || 'N/A'}</td>
                    <td>
                      <div>
                        <strong>{booking.customerName}</strong>
                        <br />
                        <small>{booking.email}</small>
                      </div>
                    </td>
                    <td>{booking.travelers}</td>
                    <td>${booking.totalAmount}</td>
                    <td>
                      <span className={`status ${booking.bookingStatus}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td>{new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to={`/bookings/${booking.tour?._id}`}
                        className="btn btn-small"
                      >
                        View Tour
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBookingsList;
