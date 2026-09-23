/** Review endpoints used by the customer SPA. */
import { api } from './client';

export const fetchReviews = () => api.get('/reviews');

export const fetchTourReviews = (tourId) => api.get(`/reviews/tour/${tourId}`);

/** `formData` carries the tour id, rating, comment and photo files. */
export const createReview = (formData) => api.post('/reviews', formData);
