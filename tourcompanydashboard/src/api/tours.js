/** Tour endpoints used by the company dashboard. */
import { api } from './client';

export const fetchTours = () => api.get('/api/tours');

export const fetchCompanyTours = (companyId) => api.get(`/api/companytours/${companyId}`);

export const fetchTour = (tourId) => api.get(`/api/tours/${tourId}`);

/** `payload` is a FormData instance carrying the tour fields and images. */
export const createTour = (payload) => api.post('/api/tours', payload);

/** `payload` is a FormData instance carrying the tour fields and images. */
export const updateTour = (tourId, payload) => api.put(`/api/tours/${tourId}`, payload);

export const deleteTour = (tourId) => api.delete(`/api/tours/${tourId}`);

export const updateTourStatus = (tourId, status) =>
  api.patch(`/api/tours/${tourId}/status`, { status });
