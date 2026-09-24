/** Booking endpoints used by the customer SPA. */
import { api } from './client';

/** The API scopes bookings by the traveller's email address. */
export const fetchMyBookings = (email) =>
  api.get(`/api/bookings?email=${encodeURIComponent(email)}`);

export const createBooking = (booking) => api.post('/api/bookings/add', booking);
