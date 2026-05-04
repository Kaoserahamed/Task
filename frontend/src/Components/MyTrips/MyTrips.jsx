import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyTrips.css';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
const MyTrips = () => {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleViewDetails = async (tourId) => {
    try {
      await axios.patch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/increment-view`);
      navigate(`/package/${tourId}`);
    } catch (error) {
      console.error('Failed to increment view count:', error);
      navigate(`/package/${tourId}`); // Navigate anyway
    }
  };
  useEffect(() => {


    const fetchBookings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your trips.');
        return;
      }

      if (!user) {
        setError('User data is missing.');
        return;
      }

      try {
        const response = await axios.get('https://backend-eight-tan-16.vercel.app/api/bookings', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { email: user.user.email }
        });

        console.log('Bookings API response:', response.data);

        // The API returns {success: true, upcoming: Array, completed: Array}
        if (response.data.success) {
          const allBookings = [
            ...(response.data.upcoming || []),
            ...(response.data.completed || [])
          ];
          setBookings(allBookings);
          setError('');
        } else {
          setError('No bookings found.');
          setBookings([]);
        }
      } catch (error) {
        setError('Failed to fetch trips.');
        setBookings([]);
        console.error(error);
      }
    };

    fetchBookings();
  }, [user]);

  // Filter bookings based on status
  const filteredTrips = bookings.filter(trip => {
    if (filter === 'all') return true;
    if (!trip.startDate) return false;

    const tripDate = new Date(trip.startDate);
    const today = new Date();

    // Set both to midnight for clean date comparison
    tripDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') {
      return tripDate.getTime() >= today.getTime();
    }

    if (filter === 'completed') {
      return tripDate.getTime() < today.getTime();
    }
    console.log({
      trip: trip.name,
      tripDate: trip.startDate,
      tripTimestamp: tripDate.getTime(),
      todayTimestamp: today.getTime(),
      result: tripDate.getTime() >= today.getTime()
    });


    return true;
  });


  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="my-trips">
      <div className="trips-header">
        <h3>My Trips</h3>
        <div className="trip-filters">
          {['all', 'upcoming', 'completed'].map(f => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="no-trips">
          <p>No trips found.</p>
        </div>
      ) : (
        <div className="trips-grid">
          {filteredTrips.map((trip, index) => (
            <div key={trip._id || index} className="trip-card">
              <div className="trip-image">
                <img
                  src={`https://backend-eight-tan-16.vercel.app/${trip.images?.[0]}`}
                  alt={trip.name || 'Trip'}
                />
                <span className={`status ${trip.status?.toLowerCase() || 'pending'}`}>
                  {trip.status || 'Pending'}
                </span>
              </div>
              <div className="trip-details">
                <h4>{trip.name || 'Unknown Tour'}</h4>
                <div className="trip-info">
                  <span>
                    <i className="fas fa-map-marker-alt"></i>
                    {trip.duration?.days || 0} Days, {trip.duration?.nights || 0} Nights
                  </span>
                  <span>
                    <i className="fas fa-calendar"></i>
                    {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'Date TBD'}
                  </span>
                </div>
                <div className="trip-footer">
                  <span className="price">${trip.price || 0}</span>
                  <button
                    className="view-details"
                    onClick={() => handleViewDetails(trip.tourId || trip._id)}
                  >
                    View Details
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;
