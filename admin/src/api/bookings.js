/** Booking endpoints used by the admin dashboard. */
import { api } from './client';

export const fetchAllBookings = () => api.get('/api/bookings/all');

export const fetchBookingsForTour = (tourId) => api.get(`/api/bookings/tour/${tourId}`);
