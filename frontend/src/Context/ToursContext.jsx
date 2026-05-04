import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ToursContext = createContext();

export const ToursProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('https://backend-eight-tan-16.vercel.app/api/tours/approved');
      if (!response.ok) {
        throw new Error('Failed to fetch tours');
      }
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
  }, []);

  const fetchTourById = useCallback(async (id) => {
    try {
      const response = await fetch(`https://backend-eight-tan-16.vercel.app/api/tours/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tour');
      }
      const data = await response.json();

      if (data.success) {
        return data.tour;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error fetching tour:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return (
    <ToursContext.Provider 
      value={{ 
        tours, 
        loading, 
        error, 
        fetchTours, 
        fetchTourById 
      }}
    >
      {children}
    </ToursContext.Provider>
  );
};
