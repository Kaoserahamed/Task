/** Tour endpoints used by the admin dashboard. */
import { api } from './client';

export const fetchTours = () => api.get('/api/tours');

export const fetchTour = (id) => api.get(`/api/tours/${id}`);

/** `payload` is the exact review body the API expects, e.g. `{ status, review }`. */
export const updateTourStatus = (id, payload) => api.patch(`/api/tours/${id}/status`, payload);
