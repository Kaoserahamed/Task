/** Tour endpoints used by the customer SPA. */
import { api } from './client';

export const fetchApprovedTours = () => api.get('/api/tours/approved');

export const fetchTour = (id) => api.get(`/api/tours/${id}`);

export const incrementTourView = (tourId) => api.patch(`/api/tours/${tourId}/increment-view`);

export const bookSeats = (tourId, seatsToBook) =>
  api.patch(`/api/tours/${tourId}/book-seats`, { seatsToBook });
