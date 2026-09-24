import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as toursApi from '../api/tours';
import * as bookingsApi from '../api/bookings';
import { logError } from '../utils/logger';

const ToursContext = createContext(null); // Initialize with null

export const ToursProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { company, authLoading } = useAuth(); // <-- get authLoading

  const fetchcompanyTours = useCallback(async () => {
    try {
      setLoading(true);
      if (authLoading || !company) {
        throw new Error('No company logged in');
      }
      const companyId = company.company._id;
      const data = await toursApi.fetchCompanyTours(companyId);
      if (data.success) {
        setTours(data.tours);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      logError('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  }, [company, authLoading]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const data = await toursApi.fetchTours();

      if (data.success) {
        setTours(data.tours);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      logError('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchToursWithBookings = useCallback(async () => {
    try {
      setLoading(true);
      if (!company) throw new Error('No company logged in');
      const companyId = company.company._id;
      const data = await toursApi.fetchCompanyTours(companyId);
      if (!data.success) throw new Error(data.error);

      const toursWithBookings = await Promise.all(
        data.tours.map(async (tour) => {
          try {
            const bookingsData = await bookingsApi.fetchBookingsForTour(tour._id);
            const bookings = bookingsData.success ? bookingsData.bookings : [];
            return { ...tour, bookings };
          } catch {
            return { ...tour, bookings: [] };
          }
        })
      );
      setTours(toursWithBookings);
    } catch (err) {
      setError(err.message);
      logError('Error fetching tours with bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  const deleteTour = async (tourId) => {
    try {
      const data = await toursApi.deleteTour(tourId);

      if (data.success) {
        setTours(tours.filter((tour) => tour._id !== tourId));
        return { success: true };
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      logError('Error deleting tour:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      const data = await toursApi.updateTourStatus(tourId, status);

      if (data.success) {
        setTours(tours.map((tour) => (tour._id === tourId ? { ...tour, status: status } : tour)));
        return { success: true };
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      logError('Error updating tour status:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    if (!authLoading && company) {
      fetchToursWithBookings(); // Always fetch tours with bookings for dashboard
    }
  }, [fetchToursWithBookings, authLoading, company]);

  const value = {
    tours,
    loading,
    error,
    fetchTours,
    deleteTour,
    updateTourStatus,
    fetchcompanyTours,
    fetchToursWithBookings,
  };

  return <ToursContext.Provider value={value}>{children}</ToursContext.Provider>;
};

export const useTours = () => {
  const context = useContext(ToursContext);
  if (context === null) {
    throw new Error('useTours must be used within a ToursProvider');
  }
  return context;
};

export default ToursContext;
