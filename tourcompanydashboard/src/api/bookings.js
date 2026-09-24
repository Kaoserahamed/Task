/** Booking endpoints used by the company dashboard. */
import { api } from './client';

export const fetchBookingsForTour = (tourId, { page, limit } = {}) => {
  const query = page ? `?page=${page}&limit=${limit}` : '';
  return api.get(`/api/bookings/tour/${tourId}${query}`);
};

export const fetchAllBookings = () => api.get('/api/bookings/admin/all');
