import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';


const ToursContext = createContext(null); // Initialize with null

export const ToursProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { company, authLoading } = useAuth(); // <-- get authLoading

  useEffect(() => {
    if (company) {
      console.log("Current logged in company:", company);
      console.log("Company ID:", company._id);
    }
  }, [company]);

  const fetchcompanyTours = useCallback(async () => {
    try {
      setLoading(true);
      if (authLoading || !company) {
        throw new Error('No company logged in');
      }
      const companyId = company.company._id;
      console.log("Fetching tours for company ID:", companyId);
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/companytours/${companyId}`);
      const data = await response.json();
      console.log(response);
      if (data.success) {
        setTours(data.tours);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  }, [company, authLoading]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/tours');
      const data = await response.json();
      
      if (data.success) {
        setTours(data.tours);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchToursWithBookings = useCallback(async () => {
    try {
      setLoading(true);
      if (!company) throw new Error('No company logged in');
      const companyId = company.company._id;
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/companytours/${companyId}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const token = localStorage.getItem('company-token');
      const toursWithBookings = await Promise.all(
        data.tours.map(async (tour) => {
          const res = await fetch(
            `https://backend-eight-tan-16.vercel.app/api/bookings/tour/${tour._id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          const bookingsData = await res.json();
          const bookings = bookingsData.success ? bookingsData.bookings : [];
          return { ...tour, bookings };
        })
      );
      setTours(toursWithBookings);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tours with bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [company]);

  const deleteTour = async (tourId) => {
    try {
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        setTours(tours.filter(tour => tour._id !== tourId));
        return { success: true };
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error deleting tour:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTourStatus = async (tourId, status) => {
    try {
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${tourId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      
      if (data.success) {
        setTours(tours.map(tour => 
          tour._id === tourId ? { ...tour, status: status } : tour
        ));
        return { success: true };
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error updating tour status:', err);
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
    fetchToursWithBookings
  };

  return (
    <ToursContext.Provider value={value}>
      {children}
    </ToursContext.Provider>
  );
};

export const useTours = () => {
  const context = useContext(ToursContext);
  if (context === null) {
    throw new Error('useTours must be used within a ToursProvider');
  }
  return context;
};

export default ToursContext;
