import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as toursApi from '../api/tours';
import { logError } from '../utils/logger';

export const ToursContext = createContext();

export const ToursProvider = ({ children }) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const data = await toursApi.fetchApprovedTours();

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
  }, []);

  const fetchTourById = useCallback(async (id) => {
    try {
      const data = await toursApi.fetchTour(id);

      if (data.success) {
        return data.tour;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      logError('Error fetching tour:', err);
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
        fetchTourById,
      }}
    >
      {children}
    </ToursContext.Provider>
  );
};
